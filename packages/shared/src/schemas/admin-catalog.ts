import { z } from 'zod';
import { slugify } from '../slug';
import { slugSchema } from './catalog';

// ---------- Admin dictionaries: /admin/categories, /admin/origins ----------

export const DICTIONARY_NAME_MAX_LENGTH = 100;

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Podaj nazwę')
  .max(DICTIONARY_NAME_MAX_LENGTH, `Nazwa może mieć najwyżej ${DICTIONARY_NAME_MAX_LENGTH} znaków`);

export const idSchema = z.uuid('Nieprawidłowy identyfikator');

const countSchema = z.number().int().min(0);

/**
 * Without a slug, the API generates one from the name (slugify), so the name must have
 * at least one letter or digit. A slug given by hand is used as is (409 when taken).
 * Zod 4 runs object refinements even when a field check (here min(1)) failed; an empty name
 * already has its own error, so it is skipped to report one message per problem.
 */
export function requireSlugSource(
  value: { name: string; slug?: string | undefined },
  ctx: z.RefinementCtx,
) {
  if (value.slug === undefined && value.name !== '' && slugify(value.name) === '') {
    ctx.addIssue({
      code: 'custom',
      path: ['name'],
      message: 'Nazwa musi zawierać literę lub cyfrę albo podaj slug',
    });
  }
}

// Updates change only the fields that are sent. A new name does not regenerate the slug:
// product URLs should not change behind the admin's back.

export const createCategorySchema = z
  .strictObject({
    name: nameSchema,
    slug: slugSchema.optional(),
    /** null = top-level category */
    parentId: idSchema.nullable().default(null),
  })
  .superRefine(requireSlugSource);

export const updateCategorySchema = z.strictObject({
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  parentId: idSchema.nullable().optional(),
});

export const createOriginSchema = z
  .strictObject({ name: nameSchema, slug: slugSchema.optional() })
  .superRefine(requireSlugSource);

export const updateOriginSchema = z.strictObject({
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
});

/** Flat list item; the panel builds the tree from parentId */
export const adminCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  parentId: z.uuid().nullable(),
  /** Products directly in this category, any status (a category with products cannot be deleted) */
  productCount: countSchema,
  childCount: countSchema,
});

export const adminOriginSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  /** Products of any status (an origin in use cannot be deleted) */
  productCount: countSchema,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateOriginInput = z.infer<typeof createOriginSchema>;
export type UpdateOriginInput = z.infer<typeof updateOriginSchema>;
export type AdminCategory = z.infer<typeof adminCategorySchema>;
export type AdminOrigin = z.infer<typeof adminOriginSchema>;
