import { NotFoundException } from '@nestjs/common';
import { PRODUCT_NOT_FOUND_MESSAGE } from '../../catalog/products.service';
import type { Prisma } from '../../generated/prisma/client';
import type { ProductStatus } from '../../generated/prisma/enums';
import { computeMinPrice } from '../../products/min-price';

/**
 * Locks the product row until the transaction ends (SELECT ... FOR UPDATE). Every change
 * to a product's variants or status takes this lock first, so for one product they run one
 * at a time. Without it, two concurrent variant changes could each compute minPrice from
 * data the other one is changing, and publishing could race with deactivating the last
 * variant, leaving an ACTIVE product that cannot be bought.
 */
export async function lockProduct(
  tx: Prisma.TransactionClient,
  id: string,
): Promise<{ status: ProductStatus }> {
  const rows = await tx.$queryRaw<{ status: ProductStatus }[]>`
    SELECT status FROM products WHERE id = ${id}::uuid FOR UPDATE`;
  const product = rows[0];
  if (!product) {
    throw new NotFoundException(PRODUCT_NOT_FOUND_MESSAGE);
  }
  return product;
}

/** Recomputes the denormalized Product.minPrice (SPEC 7.4); call under lockProduct */
export async function refreshMinPrice(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<number | null> {
  const variants = await tx.productVariant.findMany({
    where: { productId },
    select: { price: true, isActive: true },
  });
  const minPrice = computeMinPrice(variants);
  await tx.product.update({ where: { id: productId }, data: { minPrice } });
  return minPrice;
}
