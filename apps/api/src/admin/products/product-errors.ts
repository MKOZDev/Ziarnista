import { ConflictException, NotFoundException } from '@nestjs/common';
import { PRODUCT_NOT_FOUND_MESSAGE } from '../../catalog/products.service';
import {
  isCheckViolation,
  isForeignKeyViolation,
  isPrismaError,
  isUniqueViolation,
  PrismaErrorCode,
} from '../../common/prisma-errors';
import { validationError } from '../../common/validation-error';
import type { PrismaService } from '../../prisma/prisma.service';

export const PRODUCT_SLUG_INDEX = 'products_slug_key';
export const PRODUCT_SLUG_TAKEN_MESSAGE = 'Produkt o tym slugu już istnieje';
export const SKU_TAKEN_MESSAGE = 'SKU jest już zajęte';

const SKU_INDEX = 'product_variants_sku_key';

/** A SKU from the request and the path of its form field (e.g. "variants.1.sku") */
export type SkuField = { path: string; sku: string };

/**
 * Database errors of product and variant writes → HTTP errors. The database is the single
 * source of truth for uniqueness and references: nothing is checked before the write, so
 * there is no window between a check and the insert for a concurrent request to slip through.
 */
export async function translateProductWriteError(
  error: unknown,
  prisma: PrismaService,
  skuFields: readonly SkuField[],
): Promise<unknown> {
  if (isUniqueViolation(error, PRODUCT_SLUG_INDEX)) {
    return new ConflictException(PRODUCT_SLUG_TAKEN_MESSAGE);
  }
  if (isUniqueViolation(error, SKU_INDEX)) {
    return skuConflict(prisma, skuFields);
  }
  if (isForeignKeyViolation(error, 'products_category_id_fkey')) {
    return validationError([{ path: 'categoryId', message: 'Kategoria nie istnieje' }]);
  }
  if (isForeignKeyViolation(error, 'products_origin_id_fkey')) {
    return validationError([{ path: 'originId', message: 'Pochodzenie nie istnieje' }]);
  }
  // Normally caught by the Zod schema / coffeeFieldsIssues before the write
  if (isCheckViolation(error, 'products_coffee_fields_check')) {
    return validationError([
      { path: 'kind', message: 'Kawa musi mieć pochodzenie i stopień palenia' },
    ]);
  }
  if (isPrismaError(error, PrismaErrorCode.RecordNotFound)) {
    return new NotFoundException(PRODUCT_NOT_FOUND_MESSAGE);
  }
  return error;
}

/**
 * The unique index does not say which SKU collided. The failed transaction has rolled
 * back, so one query now tells which of the requested SKUs belong to other variants.
 */
async function skuConflict(
  prisma: PrismaService,
  skuFields: readonly SkuField[],
): Promise<ConflictException> {
  const existing = await prisma.productVariant.findMany({
    where: { sku: { in: skuFields.map((field) => field.sku) } },
    select: { sku: true },
  });
  const taken = new Set(existing.map((variant) => variant.sku));
  const errors = skuFields
    .filter((field) => taken.has(field.sku))
    .map((field) => ({ path: field.path, message: SKU_TAKEN_MESSAGE }));
  return new ConflictException({
    statusCode: 409,
    message: taken.size > 0 ? `SKU już zajęte: ${[...taken].join(', ')}` : SKU_TAKEN_MESSAGE,
    errors,
  });
}
