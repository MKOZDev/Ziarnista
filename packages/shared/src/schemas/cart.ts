import { z } from 'zod';
import { productImageSchema } from './catalog';
import type { ProductStatus } from './product';

// ---------- Cart: /cart, /cart/items ----------

/** grosze; flat rate (SPEC 1) */
export const SHIPPING_COST = 1499;
/** grosze; shipping is free from this subtotal on (inclusive) */
export const FREE_SHIPPING_THRESHOLD = 15_000;
/** Most units of one variant in a cart (also a CHECK constraint) */
export const CART_MAX_QUANTITY = 99;

export type CartTotals = {
  subtotal: number;
  shippingCost: number;
  total: number;
  /** 0 once shipping is free */
  amountToFreeShipping: number;
};

/**
 * Totals of a cart or an order from its subtotal (grosze). Shared by the cart, the checkout
 * and the storefront, so the three can never disagree. Nothing to ship, nothing to pay.
 */
export function calculateTotals(subtotal: number): CartTotals {
  const free = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = subtotal === 0 || free ? 0 : SHIPPING_COST;
  return {
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
    amountToFreeShipping: free ? 0 : FREE_SHIPPING_THRESHOLD - subtotal,
  };
}

export const cartProblemCodeSchema = z.enum(['UNAVAILABLE', 'OUT_OF_STOCK', 'INSUFFICIENT_STOCK']);

export type CartProblemCode = z.infer<typeof cartProblemCodeSchema>;

export type CartProblem = { code: CartProblemCode; message: string };

type VariantState = {
  variantActive: boolean;
  productStatus: ProductStatus;
  stock: number;
};

/** Most units of the variant one cart may hold right now: 0 when it cannot be bought */
export function maxCartQuantity({ variantActive, productStatus, stock }: VariantState): number {
  if (!variantActive || productStatus !== 'ACTIVE') {
    return 0;
  }
  return Math.min(Math.max(stock, 0), CART_MAX_QUANTITY);
}

/**
 * Why a cart line cannot be bought as it is, or null. Lines with a problem stay in the
 * cart (nothing disappears silently); they are left out of the totals and block checkout.
 */
export function cartLineProblem(state: VariantState & { quantity: number }): CartProblem | null {
  if (!state.variantActive || state.productStatus !== 'ACTIVE') {
    return { code: 'UNAVAILABLE', message: 'Produkt jest niedostępny' };
  }
  if (state.stock <= 0) {
    return { code: 'OUT_OF_STOCK', message: 'Produkt chwilowo niedostępny' };
  }
  if (state.quantity > state.stock) {
    return { code: 'INSUFFICIENT_STOCK', message: `Dostępne tylko ${state.stock} szt.` };
  }
  return null;
}

const quantitySchema = z
  .int('Ilość musi być liczbą całkowitą')
  .min(1, 'Ilość musi wynosić co najmniej 1')
  .max(CART_MAX_QUANTITY, `Najwyżej ${CART_MAX_QUANTITY} szt. jednego produktu`);

export const addCartItemSchema = z.strictObject({
  variantId: z.uuid('Nieprawidłowy identyfikator wariantu'),
  quantity: quantitySchema.default(1),
});

/** The new quantity of the line (not a difference) */
export const updateCartItemSchema = z.strictObject({ quantity: quantitySchema });

const countSchema = z.number().int().min(0);

export const cartItemSchema = z.object({
  id: z.uuid(),
  variantId: z.uuid(),
  productSlug: z.string(),
  productName: z.string(),
  /** e.g. "250 g / ziarno" */
  variantLabel: z.string(),
  sku: z.string(),
  /** First product image */
  image: productImageSchema.nullable(),
  /** grosze, current price from the catalog (a cart stores no prices) */
  unitPrice: z.number().int(),
  quantity: z.number().int(),
  /** unitPrice × quantity, grosze */
  lineTotal: z.number().int(),
  /** Most units this line may hold now (quantity selector); 0 when it cannot be bought */
  maxQuantity: countSchema,
  available: z.boolean(),
  problem: z.object({ code: cartProblemCodeSchema, message: z.string() }).nullable(),
});

export const cartSchema = z.object({
  /** Oldest first */
  items: z.array(cartItemSchema),
  /** Units of the lines without a problem */
  itemCount: countSchema,
  /** The totals count lines without a problem only (grosze) */
  subtotal: countSchema,
  shippingCost: countSchema,
  total: countSchema,
  freeShippingThreshold: countSchema,
  amountToFreeShipping: countSchema,
  /** Not empty and no line has a problem */
  canCheckout: z.boolean(),
});

/**
 * Body of a 409 when the requested quantity is more than can be added or set: `available`
 * is the largest quantity that would succeed in the same request (for POST: how many can
 * still be added on top of what is in the cart; for PATCH: the largest quantity of the line).
 */
export const cartQuantityErrorSchema = z.object({
  statusCode: z.literal(409),
  message: z.string(),
  code: cartProblemCodeSchema.or(z.literal('CART_LIMIT')),
  available: countSchema,
  errors: z.array(z.object({ path: z.string(), message: z.string() })),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type CartQuantityError = z.infer<typeof cartQuantityErrorSchema>;
