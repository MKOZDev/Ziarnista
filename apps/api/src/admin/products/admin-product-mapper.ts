import type { AdminProductDetail, AdminProductListItem } from '@ziarnista/shared';
import type { Prisma } from '../../generated/prisma/client';

// Prisma rows → response bodies of /admin/products. Dates become ISO strings, as in JSON.

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
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    select: { id: true, url: true, alt: true, position: true },
  },
} satisfies Prisma.ProductSelect;

type ProductDetailRow = Prisma.ProductGetPayload<{ select: typeof adminProductDetailSelect }>;

export function toAdminProductDetail(row: ProductDetailRow): AdminProductDetail {
  return {
    ...row,
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
  images: {
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    take: 1,
    select: { url: true, alt: true },
  },
} satisfies Prisma.ProductSelect;

type ProductListRow = Prisma.ProductGetPayload<{ select: typeof adminProductListSelect }>;

export function toAdminProductListItem({
  variants,
  images,
  updatedAt,
  ...row
}: ProductListRow): AdminProductListItem {
  const active = variants.filter((variant) => variant.isActive);
  return {
    ...row,
    variantCount: variants.length,
    activeVariantCount: active.length,
    totalStock: active.reduce((sum, variant) => sum + variant.stock, 0),
    image: images[0] ?? null,
    updatedAt: updatedAt.toISOString(),
  };
}
