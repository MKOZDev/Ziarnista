import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdminProductDetail, CreateVariantInput, UpdateVariantInput } from '@ziarnista/shared';
import { validationError } from '../../common/validation-error';
import { ProductStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminProductsService } from './admin-products.service';
import { translateProductWriteError } from './product-errors';
import { lockProduct, refreshMinPrice } from './product-lock';
import { LAST_ACTIVE_VARIANT_MESSAGE } from './publication-rules';

export const VARIANT_NOT_FOUND_MESSAGE = 'Nie znaleziono wariantu tego produktu';

/**
 * Variants are never deleted (order items reference them); isActive = false hides one.
 * Every change runs under the product lock and recomputes minPrice in the same transaction.
 * Both endpoints answer with the whole product: its minPrice changes along with the variant.
 */
@Injectable()
export class ProductVariantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: AdminProductsService,
  ) {}

  async create(productId: string, input: CreateVariantInput): Promise<AdminProductDetail> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await lockProduct(tx, productId);
        await tx.productVariant.create({ data: { ...input, productId } });
        await refreshMinPrice(tx, productId);
      });
    } catch (error) {
      throw await translateProductWriteError(error, this.prisma, [{ path: 'sku', sku: input.sku }]);
    }
    return this.products.findById(productId);
  }

  async update(
    productId: string,
    variantId: string,
    input: UpdateVariantInput,
  ): Promise<AdminProductDetail> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const { status } = await lockProduct(tx, productId);
        // productId in the filter: a variant of another product is a 404, not an edit
        const { count } = await tx.productVariant.updateMany({
          where: { id: variantId, productId },
          data: input,
        });
        if (count === 0) {
          throw new NotFoundException(VARIANT_NOT_FOUND_MESSAGE);
        }
        // minPrice is null exactly when no variant is active
        const minPrice = await refreshMinPrice(tx, productId);
        if (status === ProductStatus.ACTIVE && minPrice === null) {
          throw validationError(
            [{ path: 'isActive', message: LAST_ACTIVE_VARIANT_MESSAGE }],
            LAST_ACTIVE_VARIANT_MESSAGE,
          );
        }
      });
    } catch (error) {
      throw await translateProductWriteError(
        error,
        this.prisma,
        input.sku === undefined ? [] : [{ path: 'sku', sku: input.sku }],
      );
    }
    return this.products.findById(productId);
  }
}
