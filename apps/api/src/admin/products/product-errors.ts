import { ConflictException, NotFoundException } from '@nestjs/common';
import { PRODUCT_STALE_ERROR_CODE } from '@ziarnista/shared';
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
export const VARIANT_NOT_FOUND_MESSAGE = 'Nie znaleziono wariantu tego produktu';
export const PRODUCT_STALE_MESSAGE =
  'Ktoś zmienił ten produkt, odkąd otworzyłeś formularz. Odśwież dane, żeby zobaczyć aktualną wersję.';

/** 409 with a code: the panel tells it apart from a taken slug or SKU (also 409) */
export function productStaleError(): ConflictException {
  return new ConflictException({
    statusCode: 409,
    message: PRODUCT_STALE_MESSAGE,
    code: PRODUCT_STALE_ERROR_CODE,
  });
}

const SKU_INDEX = 'product_variants_sku_key';

/**
 * A SKU from the request and the path of its form field (e.g. "variants.1.sku").
 * variantId: the variant being edited, which may keep its own SKU.
 */
export type SkuField = { path: string; sku: string; variantId?: string };

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
    select: { id: true, sku: true },
  });
  const owners = new Map(existing.map((variant) => [variant.sku, variant.id]));
  // An unchanged SKU of an edited variant is in the database too, but it is not a conflict
  const conflicts = skuFields.filter(
    (field) => owners.has(field.sku) && owners.get(field.sku) !== field.variantId,
  );
  const taken = new Set(conflicts.map((field) => field.sku));
  return new ConflictException({
    statusCode: 409,
    message: taken.size > 0 ? `SKU już zajęte: ${[...taken].join(', ')}` : SKU_TAKEN_MESSAGE,
    errors: conflicts.map((field) => ({ path: field.path, message: SKU_TAKEN_MESSAGE })),
  });
}
