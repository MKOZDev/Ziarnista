import { Prisma } from '../generated/prisma/client';
import { ProductStatus } from '../generated/prisma/enums';

// What the storefront may show: ACTIVE products with at least one active variant.
// minPrice is null exactly when there is no active variant (SPEC 7.4); such a product
// cannot be bought and would break price filters and sorting. The same rule in two forms,
// for the Prisma client and for raw SQL (alias p = products); keep them in sync.

export const PUBLIC_PRODUCT_WHERE = {
  status: ProductStatus.ACTIVE,
  minPrice: { not: null },
} satisfies Prisma.ProductWhereInput;

export const PUBLIC_PRODUCT_SQL = Prisma.sql`p.status = 'ACTIVE' AND p.min_price IS NOT NULL`;
