import { Injectable, NotFoundException } from '@nestjs/common';
import {
  coffeeFieldsIssues,
  LOW_STOCK_THRESHOLD,
  pageCount,
  type AdminProductDetail,
  type AdminProductListQuery,
  type AdminProductListResponse,
  type AdminProductSort,
  type CreateProductInput,
  type UpdateProductInput,
  type UpsertVariantInput,
} from '@ziarnista/shared';
import { CategoryTree } from '../../catalog/category-tree';
import { escapeLike } from '../../catalog/product-list.query';
import { PRODUCT_NOT_FOUND_MESSAGE } from '../../catalog/products.service';
import { createWithUniqueSlug } from '../../common/unique-slug';
import { validationError } from '../../common/validation-error';
import type { Prisma } from '../../generated/prisma/client';
import { ProductStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { computeMinPrice } from '../../products/min-price';
import type { PublicUrl } from '../../products/product-image';
import { StorageService } from '../../storage/storage.service';
import {
  adminProductDetailSelect,
  adminProductListSelect,
  toAdminProductDetail,
  toAdminProductListItem,
} from './admin-product-mapper';
import {
  PRODUCT_SLUG_INDEX,
  productStaleError,
  translateProductWriteError,
  VARIANT_NOT_FOUND_MESSAGE,
} from './product-errors';
import { lockProduct, refreshMinPrice } from './product-lock';
import {
  LAST_ACTIVE_VARIANT_MESSAGE,
  PUBLISH_BLOCKED_MESSAGE,
  publicationIssues,
} from './publication-rules';

// id breaks ties, so a product never shows up on two pages. Products without an active
// variant (minPrice null) go last in both price orders.
const ORDER_BY: Record<AdminProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  updated: [{ updatedAt: 'desc' }, { id: 'desc' }],
  newest: [{ createdAt: 'desc' }, { id: 'desc' }],
  name: [{ name: 'asc' }, { id: 'asc' }],
  name_desc: [{ name: 'desc' }, { id: 'desc' }],
  price_asc: [{ minPrice: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
  price_desc: [{ minPrice: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
};

@Injectable()
export class AdminProductsService {
  private readonly publicUrl: PublicUrl;

  constructor(
    private readonly prisma: PrismaService,
    storage: StorageService,
  ) {
    this.publicUrl = (key) => storage.publicUrl(key);
  }

  /** 2–3 queries: the category tree (only with categoryId), then the page and the total */
  async list(query: AdminProductListQuery): Promise<AdminProductListResponse> {
    const where = await this.listWhere(query);
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: ORDER_BY[query.sort],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: adminProductListSelect,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      items: rows.map((row) => toAdminProductListItem(row, this.publicUrl)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: pageCount(total, query.pageSize),
    };
  }

  async findById(id: string): Promise<AdminProductDetail> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      select: adminProductDetailSelect,
    });
    if (!row) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_MESSAGE);
    }
    return toAdminProductDetail(row, this.publicUrl);
  }

  /**
   * One nested create: Prisma runs the product and variant inserts in one transaction,
   * so a taken SKU rolls back the product too. minPrice is computed before the insert.
   * Always a DRAFT (no images yet).
   */
  async create(input: CreateProductInput): Promise<AdminProductDetail> {
    const { variants, ...product } = input;
    try {
      const { id } = await createWithUniqueSlug({
        name: input.name,
        slug: input.slug,
        slugIndex: PRODUCT_SLUG_INDEX,
        findTaken: (base) => this.findTakenSlugs(base),
        create: (slug) =>
          this.prisma.product.create({
            data: {
              ...product,
              slug,
              minPrice: computeMinPrice(variants),
              variants: { create: variants },
            },
            select: { id: true },
          }),
      });
      return await this.findById(id);
    } catch (error) {
      throw await translateProductWriteError(
        error,
        this.prisma,
        variants.map((variant, index) => ({ path: `variants.${index}.sku`, sku: variant.sku })),
      );
    }
  }

  /**
   * Product fields and variants in one transaction, under the product lock:
   * 1. expectedUpdatedAt: the product must be the version the form was loaded from,
   * 2. the coffee rule on the stored product merged with the change (the schema alone
   *    cannot know that { kind: 'COFFEE' } leaves the origin empty),
   * 3. variant writes and minPrice,
   * 4. publication rules on the result, so a variant activated in the same request counts
   *    and the last active variant of a published product cannot be switched off.
   */
  async update(id: string, input: UpdateProductInput): Promise<AdminProductDetail> {
    const { variants, expectedUpdatedAt, ...fields } = input;
    try {
      await this.prisma.$transaction(async (tx) => {
        const { status, updatedAt } = await lockProduct(tx, id);
        // Compared under the lock: a save that commits in between is seen, not overwritten
        if (
          expectedUpdatedAt !== undefined &&
          new Date(expectedUpdatedAt).getTime() !== updatedAt.getTime()
        ) {
          throw productStaleError();
        }
        const current = await tx.product.findUniqueOrThrow({
          where: { id },
          select: { kind: true, originId: true, roastLevel: true },
        });
        const coffeeIssues = coffeeFieldsIssues({
          kind: fields.kind ?? current.kind,
          originId: fields.originId === undefined ? current.originId : fields.originId,
          roastLevel: fields.roastLevel === undefined ? current.roastLevel : fields.roastLevel,
        });
        if (coffeeIssues.length > 0) {
          throw validationError(coffeeIssues);
        }
        const minPrice =
          variants === undefined ? undefined : await this.writeVariants(tx, id, variants);
        if (fields.status === ProductStatus.ACTIVE && status !== ProductStatus.ACTIVE) {
          const issues = publicationIssues({
            activeVariants: await tx.productVariant.count({
              where: { productId: id, isActive: true },
            }),
            images: await tx.productImage.count({ where: { productId: id } }),
          });
          if (issues.length > 0) {
            throw validationError(issues, PUBLISH_BLOCKED_MESSAGE);
          }
        } else if ((fields.status ?? status) === ProductStatus.ACTIVE && minPrice === null) {
          throw validationError(
            [{ path: 'variants', message: LAST_ACTIVE_VARIANT_MESSAGE }],
            LAST_ACTIVE_VARIANT_MESSAGE,
          );
        }
        // Always written, also with no field changes: updatedAt marks the new version
        await tx.product.update({ where: { id }, data: fields });
      });
    } catch (error) {
      throw await translateProductWriteError(
        error,
        this.prisma,
        (variants ?? []).map((variant, index) => ({
          path: `variants.${index}.sku`,
          sku: variant.sku,
          variantId: variant.id,
        })),
      );
    }
    return this.findById(id);
  }

  /**
   * With an id: replaces the variant's fields; productId in the filter makes a variant of
   * another product an error, not an edit. Without an id: a new variant. Returns minPrice.
   */
  private async writeVariants(
    tx: Prisma.TransactionClient,
    productId: string,
    variants: UpsertVariantInput[],
  ): Promise<number | null> {
    for (const [index, { id, ...data }] of variants.entries()) {
      if (id === undefined) {
        await tx.productVariant.create({ data: { ...data, productId } });
        continue;
      }
      const { count } = await tx.productVariant.updateMany({ where: { id, productId }, data });
      if (count === 0) {
        throw validationError([
          { path: `variants.${index}.id`, message: VARIANT_NOT_FOUND_MESSAGE },
        ]);
      }
    }
    return refreshMinPrice(tx, productId);
  }

  /** DELETE = archive (SPEC 7.5); idempotent. Variants and order items stay untouched. */
  async archive(id: string): Promise<void> {
    const { count } = await this.prisma.product.updateMany({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
    });
    if (count === 0) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_MESSAGE);
    }
  }

  private async listWhere(query: AdminProductListQuery): Promise<Prisma.ProductWhereInput> {
    // Prisma's `contains` does not escape LIKE wildcards: "%" would match every product
    const q = query.q === undefined ? undefined : escapeLike(query.q);
    return {
      status: query.status,
      kind: query.kind,
      categoryId:
        query.categoryId === undefined
          ? undefined
          : { in: await this.categoryWithDescendants(query.categoryId) },
      // Same rule as hasLowStock in the mapper; inactive variants are not for sale
      variants: query.lowStock
        ? { some: { isActive: true, stock: { lt: LOW_STOCK_THRESHOLD } } }
        : undefined,
      OR:
        q === undefined
          ? undefined
          : [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },
            ],
    };
  }

  /** An unknown id gives [] (no results, not a 404), as in the public catalog */
  private async categoryWithDescendants(categoryId: string): Promise<string[]> {
    const rows = await this.prisma.category.findMany({
      select: { id: true, parentId: true, slug: true, name: true },
    });
    return new CategoryTree(rows).descendantIds(categoryId);
  }

  private async findTakenSlugs(base: string): Promise<string[]> {
    const rows = await this.prisma.product.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  }
}
