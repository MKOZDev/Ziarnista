import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  calculateTotals,
  CART_MAX_QUANTITY,
  cartLineProblem,
  FREE_SHIPPING_THRESHOLD,
  maxCartQuantity,
  type AddCartItemInput,
  type Cart,
  type CartItem,
  type CartQuantityError,
  type UpdateCartItemInput,
} from '@ziarnista/shared';
import type { Request, Response } from 'express';
import type { PublicUser } from '../auth/public-user';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  productImageOrder,
  productImageSelect,
  toProductImage,
  type PublicUrl,
} from '../products/product-image';
import { StorageService } from '../storage/storage.service';
import { CartCookies } from './cart-cookies';
import { lockCarts, touchCart } from './cart-lock';

export const CART_ITEM_NOT_FOUND_MESSAGE = 'Nie znaleziono pozycji koszyka';
export const VARIANT_NOT_FOUND_MESSAGE = 'Nie znaleziono produktu';

const EMPTY_CART: Cart = {
  items: [],
  itemCount: 0,
  ...calculateTotals(0),
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  canCheckout: false,
};

const variantStateSelect = {
  stock: true,
  isActive: true,
  product: { select: { status: true } },
} satisfies Prisma.ProductVariantSelect;

type VariantStateRow = Prisma.ProductVariantGetPayload<{ select: typeof variantStateSelect }>;

const cartLineSelect = {
  id: true,
  variantId: true,
  quantity: true,
  variant: {
    select: {
      sku: true,
      label: true,
      price: true,
      ...variantStateSelect,
      product: {
        select: {
          slug: true,
          name: true,
          status: true,
          images: { orderBy: productImageOrder, take: 1, select: productImageSelect },
        },
      },
    },
  },
} satisfies Prisma.CartItemSelect;

type CartLineRow = Prisma.CartItemGetPayload<{ select: typeof cartLineSelect }>;

function variantState(variant: VariantStateRow) {
  return {
    variantActive: variant.isActive,
    productStatus: variant.product.status,
    stock: variant.stock,
  };
}

/** 409 with the quantity that would succeed, so the shop can offer it (CartQuantityError) */
function quantityConflict(
  code: CartQuantityError['code'],
  available: number,
  message: string,
): ConflictException {
  const body: CartQuantityError = {
    statusCode: 409,
    message,
    code,
    available,
    errors: [{ path: 'quantity', message }],
  };
  return new ConflictException(body);
}

/** Why a variant cannot be added at all (limit 0), as a 409 */
function notSellable(state: ReturnType<typeof variantState>): ConflictException {
  const problem = cartLineProblem({ ...state, quantity: 1 });
  return quantityConflict(
    problem?.code ?? 'UNAVAILABLE',
    0,
    problem?.message ?? 'Produkt jest niedostępny',
  );
}

/**
 * The shopping cart of a logged-in user (by userId) or a guest (zia_cart cookie). Prices
 * are never stored: every read takes the current ones from the catalog.
 */
@Injectable()
export class CartService {
  private readonly publicUrl: PublicUrl;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cookies: CartCookies,
    storage: StorageService,
  ) {
    this.publicUrl = (key) => storage.publicUrl(key);
  }

  async get(user: PublicUser | null, req: Request): Promise<Cart> {
    const cartId = await this.findCartId(user, req);
    return cartId ? this.load(cartId) : EMPTY_CART;
  }

  /** Adds to the line of the variant if there is one; the total may not exceed the stock */
  async add(
    user: PublicUser | null,
    req: Request,
    res: Response,
    input: AddCartItemInput,
  ): Promise<Cart> {
    const cartId = await this.ensureCart(user, req, res);
    await this.prisma.$transaction(async (tx) => {
      await lockCarts(tx, [cartId]);
      const variant = await tx.productVariant.findUnique({
        where: { id: input.variantId },
        select: variantStateSelect,
      });
      if (!variant) {
        throw new NotFoundException(VARIANT_NOT_FOUND_MESSAGE);
      }
      const state = variantState(variant);
      const limit = maxCartQuantity(state);
      if (limit === 0) {
        throw notSellable(state);
      }
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId, variantId: input.variantId } },
        select: { quantity: true },
      });
      const inCart = existing?.quantity ?? 0;
      if (inCart + input.quantity > limit) {
        throw addLimitConflict(limit, inCart, state.stock);
      }
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId, variantId: input.variantId } },
        create: { cartId, variantId: input.variantId, quantity: input.quantity },
        update: { quantity: inCart + input.quantity },
      });
      await touchCart(tx, cartId);
    });
    return this.load(cartId);
  }

  /** Sets the quantity of a line (not a difference) */
  async update(
    user: PublicUser | null,
    req: Request,
    res: Response,
    itemId: string,
    input: UpdateCartItemInput,
  ): Promise<Cart> {
    const cartId = await this.requireCartId(user, req);
    await this.prisma.$transaction(async (tx) => {
      await lockCarts(tx, [cartId]);
      // cartId in the filter: a line of another cart is a 404, not someone else's change
      const item = await tx.cartItem.findFirst({
        where: { id: itemId, cartId },
        select: { variant: { select: variantStateSelect } },
      });
      if (!item) {
        throw new NotFoundException(CART_ITEM_NOT_FOUND_MESSAGE);
      }
      const state = variantState(item.variant);
      const limit = maxCartQuantity(state);
      if (limit === 0) {
        throw notSellable(state);
      }
      if (input.quantity > limit) {
        throw quantityConflict('INSUFFICIENT_STOCK', limit, `Dostępne tylko ${limit} szt.`);
      }
      await tx.cartItem.update({ where: { id: itemId }, data: { quantity: input.quantity } });
      await touchCart(tx, cartId);
    });
    this.refreshGuestCookie(user, req, res);
    return this.load(cartId);
  }

  /** Always possible, also for a line that cannot be bought any more */
  async remove(
    user: PublicUser | null,
    req: Request,
    res: Response,
    itemId: string,
  ): Promise<Cart> {
    const cartId = await this.requireCartId(user, req);
    await this.prisma.$transaction(async (tx) => {
      await lockCarts(tx, [cartId]);
      const { count } = await tx.cartItem.deleteMany({ where: { id: itemId, cartId } });
      if (count === 0) {
        throw new NotFoundException(CART_ITEM_NOT_FOUND_MESSAGE);
      }
      await touchCart(tx, cartId);
    });
    this.refreshGuestCookie(user, req, res);
    return this.load(cartId);
  }

  /** A logged-in user's cart, or the guest cart of the cookie; a leftover cookie is ignored after login */
  private async findCartId(user: PublicUser | null, req: Request): Promise<string | null> {
    if (user) {
      const cart = await this.prisma.cart.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      return cart?.id ?? null;
    }
    const token = this.cookies.read(req);
    if (!token) {
      return null;
    }
    const cart = await this.prisma.cart.findUnique({
      where: { guestToken: this.cookies.hash(token) },
      select: { id: true },
    });
    return cart?.id ?? null;
  }

  private async requireCartId(user: PublicUser | null, req: Request): Promise<string> {
    const cartId = await this.findCartId(user, req);
    if (!cartId) {
      throw new NotFoundException(CART_ITEM_NOT_FOUND_MESSAGE);
    }
    return cartId;
  }

  /**
   * The cart to add to, created on first use. A guest gets a new token (and cookie) only
   * here: reading an empty cart writes nothing, so bots do not fill the table.
   */
  private async ensureCart(user: PublicUser | null, req: Request, res: Response): Promise<string> {
    if (user) {
      const cart = await this.prisma.cart.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
        select: { id: true },
      });
      return cart.id;
    }
    const existing = await this.findCartId(null, req);
    if (existing) {
      this.refreshGuestCookie(user, req, res);
      return existing;
    }
    const token = this.cookies.newToken();
    const cart = await this.prisma.cart.create({
      data: { guestToken: this.cookies.hash(token) },
      select: { id: true },
    });
    this.cookies.set(res, token);
    return cart.id;
  }

  /** Moves the guest cookie's expiry forward: an active cart keeps living */
  private refreshGuestCookie(user: PublicUser | null, req: Request, res: Response): void {
    const token = user ? null : this.cookies.read(req);
    if (token) {
      this.cookies.set(res, token);
    }
  }

  private async load(cartId: string): Promise<Cart> {
    const rows = await this.prisma.cartItem.findMany({
      where: { cartId },
      // ids are UUIDv7: the order the lines were added in
      orderBy: { id: 'asc' },
      select: cartLineSelect,
    });
    const items = rows.map((row) => this.toCartItem(row));
    const buyable = items.filter((item) => item.available);
    return {
      items,
      itemCount: buyable.reduce((sum, item) => sum + item.quantity, 0),
      ...calculateTotals(buyable.reduce((sum, item) => sum + item.lineTotal, 0)),
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      canCheckout: items.length > 0 && buyable.length === items.length,
    };
  }

  private toCartItem({ id, variantId, quantity, variant }: CartLineRow): CartItem {
    const state = variantState(variant);
    const problem = cartLineProblem({ ...state, quantity });
    const image = variant.product.images[0];
    return {
      id,
      variantId,
      productSlug: variant.product.slug,
      productName: variant.product.name,
      variantLabel: variant.label,
      sku: variant.sku,
      image: image ? toProductImage(image, this.publicUrl) : null,
      unitPrice: variant.price,
      quantity,
      lineTotal: variant.price * quantity,
      maxQuantity: maxCartQuantity(state),
      available: problem === null,
      problem,
    };
  }
}

/** POST over the limit: how many can still be added, phrased for the shopper */
function addLimitConflict(limit: number, inCart: number, stock: number): ConflictException {
  const available = Math.max(0, limit - inCart);
  const byCartLimit = limit === CART_MAX_QUANTITY && stock > CART_MAX_QUANTITY;
  if (byCartLimit) {
    return quantityConflict(
      'CART_LIMIT',
      available,
      `Najwyżej ${CART_MAX_QUANTITY} szt. jednego produktu w koszyku` +
        (inCart > 0 ? ` (masz już ${inCart} szt.)` : ''),
    );
  }
  const message =
    available === 0
      ? `W koszyku masz już całą dostępną ilość (${limit} szt.)`
      : `Możesz dodać jeszcze ${available} szt.` +
        (inCart > 0 ? ` (w koszyku masz już ${inCart} szt.)` : '');
  return quantityConflict('INSUFFICIENT_STOCK', available, message);
}
