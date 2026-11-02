import type { Prisma } from '../generated/prisma/client';

/**
 * Locks cart rows until the transaction ends, in id order: two transactions locking the
 * same carts (a merge and an add) then always take them in the same order and cannot
 * deadlock. Every change to a cart's items takes this lock first, so the quantity check
 * and the write cannot interleave with another request for the same cart.
 */
export async function lockCarts(tx: Prisma.TransactionClient, ids: string[]): Promise<void> {
  const sorted = [...new Set(ids)].sort();
  if (sorted.length === 0) {
    return;
  }
  await tx.$queryRaw`SELECT id FROM carts WHERE id = ANY(${sorted}::uuid[]) ORDER BY id FOR UPDATE`;
}

/** Bumps updated_at (Prisma's @updatedAt only fires on writes to the carts row itself) */
export async function touchCart(tx: Prisma.TransactionClient, id: string): Promise<void> {
  await tx.cart.update({ where: { id }, data: { updatedAt: new Date() } });
}
