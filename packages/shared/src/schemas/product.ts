import { z } from 'zod';

// Mirrors of the Prisma enums (apps/api/prisma/schema.prisma); a test in apps/api keeps them in sync
export const productKindSchema = z.enum(['COFFEE', 'ACCESSORY']);
export const productStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
export const roastLevelSchema = z.enum(['LIGHT', 'MEDIUM', 'DARK']);
export const brewMethodSchema = z.enum([
  'ESPRESSO',
  'POUR_OVER',
  'AEROPRESS',
  'FRENCH_PRESS',
  'MOKA',
]);

export type ProductKind = z.infer<typeof productKindSchema>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type RoastLevel = z.infer<typeof roastLevelSchema>;
export type BrewMethod = z.infer<typeof brewMethodSchema>;

export const FLAVOR_NOTE_MAX_LENGTH = 50;
export const FLAVOR_NOTES_MAX_COUNT = 15;

/** Repeated values are dropped, the first occurrence keeps its place (display order) */
function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export const flavorNotesSchema = z
  .array(
    z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Nuta smakowa nie może być pusta')
      .max(
        FLAVOR_NOTE_MAX_LENGTH,
        `Nuta smakowa może mieć najwyżej ${FLAVOR_NOTE_MAX_LENGTH} znaków`,
      ),
  )
  .max(FLAVOR_NOTES_MAX_COUNT, `Najwyżej ${FLAVOR_NOTES_MAX_COUNT} nut smakowych`)
  .transform(unique);

export const brewMethodsSchema = z.array(brewMethodSchema).transform(unique);

/** Fields of productAttributesSchema, reused by the admin create/update schemas */
export const productAttributesShape = {
  kind: productKindSchema,
  originId: z.uuid('Nieprawidłowy identyfikator pochodzenia').nullable(),
  roastLevel: roastLevelSchema.nullable(),
  flavorNotes: flavorNotesSchema.default([]),
  brewMethods: brewMethodsSchema.default([]),
};

type CoffeeFields = {
  kind: ProductKind;
  originId: string | null;
  roastLevel: RoastLevel | null;
};

export type FieldIssue = { path: string; message: string };

/**
 * kind = COFFEE requires originId and roastLevel (also the products_coffee_fields_check
 * constraint); an accessory has neither, so it never shows up under an origin filter.
 * A plain function, so the API can also check a PATCH merged with the stored product.
 */
export function coffeeFieldsIssues(product: CoffeeFields): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (product.kind === 'COFFEE') {
    if (product.originId === null) {
      issues.push({ path: 'originId', message: 'Kawa musi mieć pochodzenie' });
    }
    if (product.roastLevel === null) {
      issues.push({ path: 'roastLevel', message: 'Kawa musi mieć stopień palenia' });
    }
  } else {
    if (product.originId !== null) {
      issues.push({ path: 'originId', message: 'Akcesorium nie może mieć pochodzenia' });
    }
    if (product.roastLevel !== null) {
      issues.push({ path: 'roastLevel', message: 'Akcesorium nie może mieć stopnia palenia' });
    }
  }
  return issues;
}

/** coffeeFieldsIssues as a Zod refinement */
export function checkCoffeeFields(product: CoffeeFields, ctx: z.RefinementCtx): void {
  for (const issue of coffeeFieldsIssues(product)) {
    ctx.addIssue({ code: 'custom', path: [issue.path], message: issue.message });
  }
}

/** Structural product attributes; see coffeeFieldsIssues for the kind rule */
export const productAttributesSchema = z
  .object(productAttributesShape)
  .superRefine(checkCoffeeFields);

export type ProductAttributes = z.infer<typeof productAttributesSchema>;
