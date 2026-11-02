import { Injectable, NotFoundException } from '@nestjs/common';
import {
  coffeeFieldsIssues,
  pageCount,
  type AdminProductDetail,
  type AdminProductListQuery,
  type AdminProductListResponse,
  type AdminProductSort,
  type CreateProductInput,
  type UpdateProductInput,
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
import {
  adminProductDetailSelect,
  adminProductListSelect,
  toAdminProductDetail,
  toAdminProductListItem,
} from './admin-product-mapper';
import { PRODUCT_SLUG_INDEX, translateProductWriteError } from './product-errors';
import { lockProduct } from './product-lock';
import { PUBLISH_BLOCKED_MESSAGE, publicationIssues } from './publication-rules';

// id breaks ties, so a product never shows up on two pages. Products without an active
// variant (minPrice null) go last in both price orders.
const ORDER_BY: Record<AdminProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  updated: [{ updatedAt: 'desc' }, { id: 'desc' }],
  newest: [{ createdAt: 'desc' }, { id: 'desc' }],
  name: [{ name: 'asc' }, { id: 'asc' }],
  price_asc: [{ minPrice: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
  price_desc: [{ minPrice: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
};

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

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
      items: rows.map(toAdminProductListItem),
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
    return toAdminProductDetail(row);
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
   * The coffee rule is checked on the stored product merged with the change (the schema
   * alone cannot know that { kind: 'COFFEE' } leaves the origin empty). Publishing checks
   * the variants and images under the product lock, so a concurrent variant change cannot
   * invalidate the check before the commit.
   */
  async update(id: string, input: UpdateProductInput): Promise<AdminProductDetail> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const { status } = await lockProduct(tx, id);
        const current = await tx.product.findUniqueOrThrow({
          where: { id },
          select: { kind: true, originId: true, roastLevel: true },
        });
        const coffeeIssues = coffeeFieldsIssues({
          kind: input.kind ?? current.kind,
          originId: input.originId === undefined ? current.originId : input.originId,
          roastLevel: input.roastLevel === undefined ? current.roastLevel : input.roastLevel,
        });
        if (coffeeIssues.length > 0) {
          throw validationError(coffeeIssues);
        }
        if (input.status === ProductStatus.ACTIVE && status !== ProductStatus.ACTIVE) {
          const issues = publicationIssues({
            activeVariants: await tx.productVariant.count({
              where: { productId: id, isActive: true },
            }),
            images: await tx.productImage.count({ where: { productId: id } }),
          });
          if (issues.length > 0) {
            throw validationError(issues, PUBLISH_BLOCKED_MESSAGE);
          }
        }
        await tx.product.update({ where: { id }, data: input });
      });
    } catch (error) {
      throw await translateProductWriteError(error, this.prisma, []);
    }
    return this.findById(id);
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
