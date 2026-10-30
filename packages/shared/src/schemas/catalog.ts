import { z } from 'zod';
import { paginatedSchema, paginationQuery } from './pagination';
import { brewMethodSchema, productKindSchema, roastLevelSchema } from './product';

// ---------- Public catalog: GET /products, GET /products/:slug, GET /categories ----------

export const CATALOG_DEFAULT_PAGE_SIZE = 24;
export const CATALOG_MAX_PAGE_SIZE = 48;
export const CATALOG_SEARCH_MAX_LENGTH = 100;
/** Upper bound of a PostgreSQL int column (prices are stored as int grosze) */
const MAX_PRICE = 2_147_483_647;

export const slugSchema = z
  .string()
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Nieprawidłowy slug');

export const productSortSchema = z.enum(['newest', 'price_asc', 'price_desc', 'name']);

export type ProductSort = z.infer<typeof productSortSchema>;

const priceFilterSchema = z.coerce.number().int().min(0).max(MAX_PRICE);

/** ?brewMethod=A&brewMethod=B — Express parses one value as a string and several as an array */
function oneOrMany<T extends z.ZodType>(item: T) {
  return z.preprocess(
    (value) => (value === undefined || Array.isArray(value) ? value : [value]),
    z.array(item).min(1),
  );
}

/**
 * Query of GET /products. Strict: an unknown (e.g. misspelled) param is a 400,
 * not a silently unfiltered list.
 */
export const productListQuerySchema = z
  .strictObject({
    ...paginationQuery({
      defaultPageSize: CATALOG_DEFAULT_PAGE_SIZE,
      maxPageSize: CATALOG_MAX_PAGE_SIZE,
    }).shape,
    /** Category slug; includes all its subcategories */
    category: slugSchema.optional(),
    kind: productKindSchema.optional(),
    /** Origin slug */
    origin: slugSchema.optional(),
    roastLevel: roastLevelSchema.optional(),
    /** Products matching any of the given methods */
    brewMethod: oneOrMany(brewMethodSchema).optional(),
    /** grosze, compared with Product.minPrice */
    priceMin: priceFilterSchema.optional(),
    priceMax: priceFilterSchema.optional(),
    /** Case-insensitive substring of the name (semantic search comes in the AI phase) */
    q: z.string().trim().min(1).max(CATALOG_SEARCH_MAX_LENGTH).optional(),
    sort: productSortSchema.default('newest'),
  })
  .refine(
    ({ priceMin, priceMax }) =>
      priceMin === undefined || priceMax === undefined || priceMin <= priceMax,
    { path: ['priceMin'], message: 'Cena minimalna nie może być większa od maksymalnej' },
  );

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

const countSchema = z.number().int().min(0);

/** Reference to a dictionary entry shown by name and linked by slug (origin, category) */
export const namedRefSchema = z.object({ slug: z.string(), name: z.string() });

export const productImageSchema = z.object({ url: z.string(), alt: z.string() });

export const productListItemSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  kind: productKindSchema,
  /** grosze; lowest price among active variants */
  minPrice: z.number().int(),
  roastLevel: roastLevelSchema.nullable(),
  origin: namedRefSchema.nullable(),
  flavorNotes: z.array(z.string()),
  brewMethods: z.array(brewMethodSchema),
  /** First image by position */
  image: productImageSchema.nullable(),
  /** At least one active variant has stock */
  inStock: z.boolean(),
});

/**
 * Number of products per filter value. Each facet ignores its own filter and applies all
 * the others, so it shows how many results switching to that value would give.
 * Only values with count > 0.
 */
export const productFacetsSchema = z.object({
  origin: z.array(namedRefSchema.extend({ count: countSchema })),
  roastLevel: z.array(z.object({ value: roastLevelSchema, count: countSchema })),
  brewMethod: z.array(z.object({ value: brewMethodSchema, count: countSchema })),
});

export const productListResponseSchema = paginatedSchema(productListItemSchema).extend({
  facets: productFacetsSchema,
});

export const productVariantSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  /** e.g. "250 g / ziarno" */
  label: z.string(),
  /** grosze */
  price: z.number().int(),
  inStock: z.boolean(),
});

export const productDetailSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  kind: productKindSchema,
  description: z.string(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  minPrice: z.number().int(),
  roastLevel: roastLevelSchema.nullable(),
  origin: namedRefSchema.nullable(),
  flavorNotes: z.array(z.string()),
  brewMethods: z.array(brewMethodSchema),
  category: namedRefSchema,
  /** From the root category down to the product's category (inclusive) */
  breadcrumbs: z.array(namedRefSchema),
  /** Active variants only, cheapest first */
  variants: z.array(productVariantSchema),
  /** Ordered by position */
  images: z.array(productImageSchema.extend({ id: z.uuid() })),
});

// Written by hand: an inferred recursive type does not survive the .d.ts emit
// (children would become Record<string, unknown>[])
export type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  /** Public products in this category and all its subcategories */
  productCount: number;
  children: CategoryNode[];
};

export const categoryNodeSchema: z.ZodType<CategoryNode> = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  productCount: countSchema,
  children: z.array(z.lazy(() => categoryNodeSchema)),
});

export type NamedRef = z.infer<typeof namedRefSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type ProductListItem = z.infer<typeof productListItemSchema>;
export type ProductFacets = z.infer<typeof productFacetsSchema>;
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
