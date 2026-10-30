import { Injectable, NotFoundException } from '@nestjs/common';
import {
  brewMethodSchema,
  pageCount,
  roastLevelSchema,
  type ProductDetail,
  type ProductFacets,
  type ProductListItem,
  type ProductListQuery,
  type ProductListResponse,
} from '@ziarnista/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';
import {
  productPageSql,
  productStatsSql,
  type ProductListRow,
  type ProductStatsRow,
} from './product-list.query';
import { PUBLIC_PRODUCT_WHERE } from './public-product';

export const PRODUCT_NOT_FOUND_MESSAGE = 'Nie znaleziono produktu';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
  ) {}

  /**
   * 2–3 queries: the category tree (only with ?category=), then the page and the
   * total + facets in parallel. Independent of page size and number of results.
   */
  async list(query: ProductListQuery): Promise<ProductListResponse> {
    const categoryIds = await this.categoryFilter(query.category);
    const [rows, stats] = await Promise.all([
      this.prisma.$queryRaw<ProductListRow[]>(productPageSql(query, categoryIds)),
      this.prisma.$queryRaw<ProductStatsRow[]>(productStatsSql(query, categoryIds)),
    ]);

    const total = stats.find((row) => row.facet === 'total')?.count ?? 0;
    return {
      items: rows.map(toListItem),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: pageCount(total, query.pageSize),
      facets: toFacets(stats),
    };
  }

  /**
   * 5 queries: the category tree, in parallel with the product and one query per relation
   * (origin, variants, images) — Prisma's default strategy, one query per relation, never per row.
   */
  async findBySlug(slug: string): Promise<ProductDetail> {
    const [product, tree] = await Promise.all([
      this.prisma.product.findFirst({
        where: { slug, ...PUBLIC_PRODUCT_WHERE },
        select: {
          id: true,
          slug: true,
          name: true,
          kind: true,
          description: true,
          metaTitle: true,
          metaDescription: true,
          minPrice: true,
          roastLevel: true,
          flavorNotes: true,
          brewMethods: true,
          categoryId: true,
          origin: { select: { slug: true, name: true } },
          variants: {
            where: { isActive: true },
            orderBy: [{ price: 'asc' }, { id: 'asc' }],
            select: { id: true, sku: true, label: true, price: true, stock: true },
          },
          images: {
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
            select: { id: true, url: true, alt: true },
          },
        },
      }),
      this.categories.loadTree(),
    ]);
    // minPrice is never null here (PUBLIC_PRODUCT_WHERE); the check narrows the type
    if (!product || product.minPrice === null) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_MESSAGE);
    }

    const { categoryId, variants, ...rest } = product;
    const breadcrumbs = tree.path(categoryId);
    const category = breadcrumbs.at(-1);
    if (!category) {
      throw new Error(`Category ${categoryId} of product ${product.id} is not in the tree`);
    }
    return {
      ...rest,
      minPrice: product.minPrice,
      category,
      breadcrumbs,
      variants: variants.map(({ stock, ...variant }) => ({ ...variant, inStock: stock > 0 })),
    };
  }

  /** undefined = no filter; an unknown slug gives [] (no results, not a 404) */
  private async categoryFilter(slug: string | undefined): Promise<string[] | undefined> {
    if (slug === undefined) {
      return undefined;
    }
    const tree = await this.categories.loadTree();
    const category = tree.findBySlug(slug);
    return category ? tree.descendantIds(category.id) : [];
  }
}

function toListItem(row: ProductListRow): ProductListItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    kind: row.kind,
    minPrice: row.minPrice,
    roastLevel: row.roastLevel,
    origin:
      row.originSlug !== null && row.originName !== null
        ? { slug: row.originSlug, name: row.originName }
        : null,
    flavorNotes: row.flavorNotes,
    brewMethods: row.brewMethods,
    image: row.imageUrl !== null ? { url: row.imageUrl, alt: row.imageAlt ?? '' } : null,
    inStock: row.inStock,
  };
}

/** Origins by name, enum facets in enum order (LIGHT → DARK), as the UI lists them */
function toFacets(stats: ProductStatsRow[]): ProductFacets {
  const facets: ProductFacets = { origin: [], roastLevel: [], brewMethod: [] };
  for (const { facet, value, name, count } of stats) {
    if (facet === 'origin' && value !== null && name !== null) {
      facets.origin.push({ slug: value, name, count });
    } else if (facet === 'roastLevel') {
      facets.roastLevel.push({ value: roastLevelSchema.parse(value), count });
    } else if (facet === 'brewMethod') {
      facets.brewMethod.push({ value: brewMethodSchema.parse(value), count });
    }
  }
  const order = (options: readonly string[]) => (a: { value: string }, b: { value: string }) =>
    options.indexOf(a.value) - options.indexOf(b.value);
  facets.origin.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  facets.roastLevel.sort(order(roastLevelSchema.options));
  facets.brewMethod.sort(order(brewMethodSchema.options));
  return facets;
}
