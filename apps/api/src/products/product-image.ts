import type { ProductImage } from '@ziarnista/shared';
import type { Prisma } from '../generated/prisma/client';

/** Turns a storage key into the URL the browser loads (StorageService.publicUrl) */
export type PublicUrl = (key: string) => string;

/** Columns of a product image as shown anywhere (storefront and panel) */
export const productImageSelect = {
  storageKey: true,
  alt: true,
  width: true,
  height: true,
} satisfies Prisma.ProductImageSelect;

/** Images in display order; id breaks ties between equal positions */
export const productImageOrder = [
  { position: 'asc' },
  { id: 'asc' },
] satisfies Prisma.ProductImageOrderByWithRelationInput[];

/**
 * The database keeps only the key; the URL is built on every read, so moving to another
 * bucket or domain is a change of S3_PUBLIC_URL, not a data migration.
 */
export function toProductImage<T extends { storageKey: string }>(
  { storageKey, ...image }: T,
  publicUrl: PublicUrl,
): Omit<T, 'storageKey'> & Pick<ProductImage, 'url'> {
  return { ...image, url: publicUrl(storageKey) };
}
