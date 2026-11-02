import { z } from 'zod';
import { idSchema, requireSlugSource } from './admin-catalog';
import { PG_INT_MAX, slugSchema } from './catalog';
import { paginatedSchema, paginationQuerySchema } from './pagination';
import {
  brewMethodSchema,
  brewMethodsSchema,
  checkCoffeeFields,
  flavorNotesSchema,
  productAttributesShape,
  productKindSchema,
  productStatusSchema,
  roastLevelSchema,
} from './product';

// ---------- Admin products: /admin/products, /admin/products/:id/variants ----------

export const PRODUCT_NAME_MAX_LENGTH = 200;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 10_000;
export const META_TITLE_MAX_LENGTH = 70;
export const META_DESCRIPTION_MAX_LENGTH = 160;
export const SKU_MAX_LENGTH = 64;
export const VARIANT_LABEL_MAX_LENGTH = 100;
export const PRODUCT_MAX_VARIANTS = 20;
export const ADMIN_SEARCH_MAX_LENGTH = 100;

const productNameSchema = z
  .string()
  .trim()
  .min(1, 'Podaj nazwę')
  .max(PRODUCT_NAME_MAX_LENGTH, `Nazwa może mieć najwyżej ${PRODUCT_NAME_MAX_LENGTH} znaków`);

const descriptionSchema = z
  .string()
  .trim()
  .max(
    PRODUCT_DESCRIPTION_MAX_LENGTH,
    `Opis może mieć najwyżej ${PRODUCT_DESCRIPTION_MAX_LENGTH} znaków`,
  );

/** Optional text field; an empty form input ("") is stored as null */
function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} może mieć najwyżej ${max} znaków`)
    .nullable()
    .transform((value) => (value === '' ? null : value));
}

const metaTitleSchema = optionalText(META_TITLE_MAX_LENGTH, 'Meta title');
const metaDescriptionSchema = optionalText(META_DESCRIPTION_MAX_LENGTH, 'Meta description');

/** Normalized to uppercase, so "eth-hambela-250-z" and "ETH-HAMBELA-250-Z" are one SKU */
const skuSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, 'Podaj SKU')
  .max(SKU_MAX_LENGTH, `SKU może mieć najwyżej ${SKU_MAX_LENGTH} znaków`)
  .regex(
    /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/,
    'SKU może zawierać tylko litery, cyfry i pojedyncze myślniki',
  );

const variantFields = {
  sku: skuSchema,
  /** e.g. "250 g / ziarno" */
  label: z
    .string()
    .trim()
    .min(1, 'Podaj etykietę wariantu')
    .max(
      VARIANT_LABEL_MAX_LENGTH,
      `Etykieta może mieć najwyżej ${VARIANT_LABEL_MAX_LENGTH} znaków`,
    ),
  /** grosze */
  price: z
    .int('Cena musi być liczbą całkowitą (w groszach)')
    .min(1, 'Cena musi być większa od zera')
    .max(PG_INT_MAX, 'Cena jest za duża'),
  stock: z
    .int('Stan musi być liczbą całkowitą')
    .min(0, 'Stan nie może być ujemny')
    .max(PG_INT_MAX, 'Stan jest za duży'),
};

export const createVariantSchema = z.strictObject({
  ...variantFields,
  isActive: z.boolean().default(true),
});

export const updateVariantSchema = z.strictObject({
  sku: variantFields.sku.optional(),
  label: variantFields.label.optional(),
  price: variantFields.price.optional(),
  stock: variantFields.stock.optional(),
  isActive: z.boolean().optional(),
});

/** One SKU twice in one request would fail on the unique index; report it on the field */
function checkDuplicateSkus(variants: { sku: string }[], ctx: z.RefinementCtx): void {
  const seen = new Set<string>();
  variants.forEach((variant, index) => {
    if (seen.has(variant.sku)) {
      ctx.addIssue({
        code: 'custom',
        path: ['variants', index, 'sku'],
        message: 'SKU powtarza się w innym wariancie',
      });
    }
    seen.add(variant.sku);
  });
}

/**
 * New product with its variants. No status: a new product has no images yet, so it could
 * not be published anyway; it always starts as DRAFT.
 */
export const createProductSchema = z
  .strictObject({
    ...productAttributesShape,
    // An accessory form may simply leave the coffee fields out
    originId: productAttributesShape.originId.default(null),
    roastLevel: productAttributesShape.roastLevel.default(null),
    name: productNameSchema,
    slug: slugSchema.optional(),
    description: descriptionSchema.default(''),
    metaTitle: metaTitleSchema.default(null),
    metaDescription: metaDescriptionSchema.default(null),
    categoryId: idSchema,
    variants: z
      .array(createVariantSchema)
      .min(1, 'Dodaj co najmniej jeden wariant')
      .max(PRODUCT_MAX_VARIANTS, `Najwyżej ${PRODUCT_MAX_VARIANTS} wariantów`),
  })
  .superRefine((product, ctx) => {
    checkCoffeeFields(product, ctx);
    requireSlugSource(product, ctx);
    checkDuplicateSkus(product.variants, ctx);
  });

/**
 * Changes only the fields that are sent. The coffee rule depends on the stored product too
 * (e.g. { kind: 'COFFEE' } alone), so the API checks it on the merged result. A new name
 * does not regenerate the slug. Variants have their own endpoints.
 */
export const updateProductSchema = z.strictObject({
  kind: productKindSchema.optional(),
  originId: productAttributesShape.originId.optional(),
  roastLevel: productAttributesShape.roastLevel.optional(),
  flavorNotes: flavorNotesSchema.optional(),
  brewMethods: brewMethodsSchema.optional(),
  name: productNameSchema.optional(),
  slug: slugSchema.optional(),
  description: descriptionSchema.optional(),
  metaTitle: metaTitleSchema.optional(),
  metaDescription: metaDescriptionSchema.optional(),
  categoryId: idSchema.optional(),
  /** ACTIVE requires an active variant and an image; ARCHIVED → DRAFT restores a product */
  status: productStatusSchema.optional(),
});

export const adminProductSortSchema = z.enum([
  'updated',
  'newest',
  'name',
  'price_asc',
  'price_desc',
]);

export type AdminProductSort = z.infer<typeof adminProductSortSchema>;

/** Query of GET /admin/products; all statuses unless filtered */
export const adminProductListQuerySchema = z.strictObject({
  ...paginationQuerySchema.shape,
  /** Case-insensitive substring of the name, slug or a variant SKU */
  q: z.string().trim().min(1).max(ADMIN_SEARCH_MAX_LENGTH).optional(),
  status: productStatusSchema.optional(),
  kind: productKindSchema.optional(),
  /** Includes all its subcategories */
  categoryId: idSchema.optional(),
  sort: adminProductSortSchema.default('updated'),
});

const countSchema = z.number().int().min(0);

export const adminVariantSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  label: z.string(),
  /** grosze */
  price: z.number().int(),
  stock: z.number().int(),
  isActive: z.boolean(),
});

export const adminProductImageSchema = z.object({
  id: z.uuid(),
  url: z.string(),
  alt: z.string(),
  position: z.number().int(),
});

/** Everything the edit form needs, inactive variants included */
export const adminProductDetailSchema = z.object({
  id: z.uuid(),
  kind: productKindSchema,
  status: productStatusSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  categoryId: z.uuid(),
  originId: z.uuid().nullable(),
  roastLevel: roastLevelSchema.nullable(),
  flavorNotes: z.array(z.string()),
  brewMethods: z.array(brewMethodSchema),
  /** grosze; null when no variant is active */
  minPrice: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  /** Oldest first (creation order) */
  variants: z.array(adminVariantSchema),
  /** Ordered by position */
  images: z.array(adminProductImageSchema),
});

export const adminProductListItemSchema = z.object({
  id: z.uuid(),
  kind: productKindSchema,
  status: productStatusSchema,
  name: z.string(),
  slug: z.string(),
  category: z.object({ id: z.uuid(), name: z.string() }),
  /** grosze; null when no variant is active */
  minPrice: z.number().int().nullable(),
  variantCount: countSchema,
  activeVariantCount: countSchema,
  /** Sum over active variants */
  totalStock: countSchema,
  /** First image by position */
  image: z.object({ url: z.string(), alt: z.string() }).nullable(),
  updatedAt: z.iso.datetime(),
});

export const adminProductListResponseSchema = paginatedSchema(adminProductListItemSchema);

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
export type AdminVariant = z.infer<typeof adminVariantSchema>;
export type AdminProductImage = z.infer<typeof adminProductImageSchema>;
export type AdminProductDetail = z.infer<typeof adminProductDetailSchema>;
export type AdminProductListItem = z.infer<typeof adminProductListItemSchema>;
export type AdminProductListResponse = z.infer<typeof adminProductListResponseSchema>;
