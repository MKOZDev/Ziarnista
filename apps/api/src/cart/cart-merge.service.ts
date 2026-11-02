import { Injectable, Logger } from '@nestjs/common';
import { CART_MAX_QUANTITY } from '@ziarnista/shared';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { CartCookies } from './cart-cookies';
import { lockCarts, touchCart } from './cart-lock';

/** Merged quantity of a variant that is in both carts (SPEC 7.5) */
export function mergedQuantity(userQuantity: number, guestQuantity: number, stock: number): number {
  const cap = Math.min(stock, CART_MAX_QUANTITY);
  // The guest part is capped at the stock; what the user already had is never lowered here
  // (a line over the stock is flagged by GET /cart, the user decides)
  return Math.max(userQuantity, Math.min(userQuantity + guestQuantity, cap));
}

/**
 * Moves the guest cart into the user's cart after a storefront login or registration.
 * Same variant in both: quantities are added up to the current stock. A line the user
 * does not have moves as it is, unavailable or not: GET /cart flags it, nothing is lost.
 */
@Injectable()
export class CartMergeService {
  private readonly logger = new Logger(CartMergeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cookies: CartCookies,
  ) {}

  /**
   * Called by the login and register endpoints. A failed merge must not fail the login:
   * it is logged and the guest cart (and its cookie) stay for the next login.
   */
  async mergeAfterLogin(req: Request, res: Response, userId: string): Promise<void> {
    const token = this.cookies.read(req);
    if (!token) {
      return;
    }
    try {
      await this.merge(this.cookies.hash(token), userId);
      this.cookies.clear(res);
    } catch (error) {
      this.logger.warn(`Could not merge the guest cart into user ${userId}: ${String(error)}`);
    }
  }

  async merge(guestTokenHash: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const guest = await tx.cart.findUnique({
        where: { guestToken: guestTokenHash },
        select: { id: true },
      });
      if (!guest) {
        // Already merged (or cleaned up): nothing to do, the cookie is just stale
        return;
      }
      const user = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      });
      await lockCarts(tx, [guest.id, user.id]);

      const guestItems = await tx.cartItem.findMany({
        where: { cartId: guest.id },
        select: { variantId: true, quantity: true, variant: { select: { stock: true } } },
      });
      const userItems = await tx.cartItem.findMany({
        where: { cartId: user.id },
        select: { id: true, variantId: true, quantity: true },
      });
      const userByVariant = new Map(userItems.map((item) => [item.variantId, item]));
      for (const item of guestItems) {
        const existing = userByVariant.get(item.variantId);
        if (existing) {
          const quantity = mergedQuantity(existing.quantity, item.quantity, item.variant.stock);
          if (quantity !== existing.quantity) {
            await tx.cartItem.update({ where: { id: existing.id }, data: { quantity } });
          }
        } else {
          await tx.cartItem.create({
            data: { cartId: user.id, variantId: item.variantId, quantity: item.quantity },
          });
        }
      }
      // Cascade removes the guest items
      await tx.cart.delete({ where: { id: guest.id } });
      await touchCart(tx, user.id);
    });
  }
}
