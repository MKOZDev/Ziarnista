import type { AdminProductDetail, AdminProductListItem } from '@ziarnista/shared';
import type { Prisma } from '../../generated/prisma/client';
import {
  productImageOrder,
  productImageSelect,
  toProductImage,
  type PublicUrl,
} from '../../products/product-image';

// Prisma rows → response bodies of /admin/products. Dates become ISO strings, as in JSON;
// image storage keys become public URLs.

export const adminProductDetailSelect = {
  id: true,
  kind: true,
  status: true,
  name: true,
  slug: true,
  description: true,
  metaTitle: true,
  metaDescription: true,
  categoryId: true,
  originId: true,
  roastLevel: true,
  flavorNotes: true,
  brewMethods: true,
  minPrice: true,
  createdAt: true,
  updatedAt: true,
  // ids are UUIDv7 (time-ordered): creation order, stable while the admin edits
  variants: {
    orderBy: { id: 'asc' },
    select: { id: true, sku: true, label: true, price: true, stock: true, isActive: true },
  },
  images: {
    orderBy: productImageOrder,
    select: { id: true, position: true, ...productImageSelect },
  },
} satisfies Prisma.ProductSelect;

type ProductDetailRow = Prisma.ProductGetPayload<{ select: typeof adminProductDetailSelect }>;

export function toAdminProductDetail(
  row: ProductDetailRow,
  publicUrl: PublicUrl,
): AdminProductDetail {
  return {
    ...row,
    images: row.images.map((image) => toProductImage(image, publicUrl)),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const adminProductListSelect = {
  id: true,
  kind: true,
  status: true,
  name: true,
  slug: true,
  minPrice: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  variants: { select: { stock: true, isActive: true } },
  images: { orderBy: productImageOrder, take: 1, select: productImageSelect },
} satisfies Prisma.ProductSelect;

type ProductListRow = Prisma.ProductGetPayload<{ select: typeof adminProductListSelect }>;

export function toAdminProductListItem(
  { variants, images, updatedAt, ...row }: ProductListRow,
  publicUrl: PublicUrl,
): AdminProductListItem {
  const active = variants.filter((variant) => variant.isActive);
  const image = images[0];
  return {
    ...row,
    variantCount: variants.length,
    activeVariantCount: active.length,
    totalStock: active.reduce((sum, variant) => sum + variant.stock, 0),
    image: image ? toProductImage(image, publicUrl) : null,
    updatedAt: updatedAt.toISOString(),
  };
}
