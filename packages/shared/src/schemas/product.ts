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

/**
 * Structural product attributes. Same rule as the products_coffee_fields_check constraint:
 * kind = COFFEE requires originId and roastLevel; accessories may leave them empty.
 */
export const productAttributesSchema = z
  .object({
    kind: productKindSchema,
    originId: z.uuid().nullable(),
    roastLevel: roastLevelSchema.nullable(),
    flavorNotes: z.array(z.string().trim().toLowerCase().min(1)).default([]),
    brewMethods: z.array(brewMethodSchema).default([]),
  })
  .superRefine((product, ctx) => {
    if (product.kind !== 'COFFEE') {
      return;
    }
    if (product.originId === null) {
      ctx.addIssue({ code: 'custom', path: ['originId'], message: 'Kawa musi mieć pochodzenie' });
    }
    if (product.roastLevel === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['roastLevel'],
        message: 'Kawa musi mieć stopień palenia',
      });
    }
  });

export type ProductAttributes = z.infer<typeof productAttributesSchema>;
