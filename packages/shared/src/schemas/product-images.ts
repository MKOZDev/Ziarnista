import { z } from 'zod';
import { idSchema } from './admin-catalog';

// ---------- Admin product images: /admin/products/:id/images, /admin/images/:id ----------

export const PRODUCT_MAX_IMAGES = 12;
export const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
/** Longer side of the stored WebP; smaller images are not enlarged */
export const IMAGE_MAX_DIMENSION = 1600;
export const IMAGE_ALT_MAX_LENGTH = 200;
/**
 * Formats accepted on upload, checked by the API on the file content (not its name or the
 * browser-reported type). For the form's <input accept="...">.
 */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const altSchema = z
  .string()
  .trim()
  .min(1, 'Opisz zdjęcie (tekst alternatywny)')
  .max(IMAGE_ALT_MAX_LENGTH, `Opis może mieć najwyżej ${IMAGE_ALT_MAX_LENGTH} znaków`);

/** Text fields of the multipart upload (the file itself is the "file" part) */
export const uploadImageSchema = z.strictObject({ alt: altSchema });

export const updateImageSchema = z.strictObject({ alt: altSchema });

/** All images of the product, each exactly once, in the new order */
export const reorderImagesSchema = z.strictObject({
  imageIds: z
    .array(idSchema)
    .min(1, 'Podaj kolejność zdjęć')
    .max(PRODUCT_MAX_IMAGES)
    .refine((ids) => new Set(ids).size === ids.length, 'Zdjęcie powtarza się na liście'),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
