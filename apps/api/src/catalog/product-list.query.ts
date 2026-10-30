import type {
  BrewMethod,
  ProductKind,
  ProductListQuery,
  ProductSort,
  RoastLevel,
} from '@ziarnista/shared';
import { Prisma } from '../generated/prisma/client';
import { PUBLIC_PRODUCT_SQL } from './public-product';

// Raw SQL for GET /products. The Prisma client cannot group by the elements of an array
// (brewMethod facet), and one set of filter fragments shared by the page query and the
// facet query keeps both in agreement. Every value is a bind parameter (Prisma.sql);
// the only interpolated SQL is ORDER BY, picked from a fixed map.

export type ProductListRow = {
  id: string;
  slug: string;
  name: string;
  kind: ProductKind;
  minPrice: number;
  roastLevel: RoastLevel | null;
  flavorNotes: string[];
  brewMethods: BrewMethod[];
  originSlug: string | null;
  originName: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  inStock: boolean;
};

export type ProductStatsRow = {
  facet: 'total' | 'origin' | 'roastLevel' | 'brewMethod';
  value: string | null;
  name: string | null;
  count: number;
};

// id breaks ties, so a product never shows up on two pages
const ORDER_BY: Record<ProductSort, Prisma.Sql> = {
  newest: Prisma.sql`p.created_at DESC, p.id DESC`,
  price_asc: Prisma.sql`p.min_price ASC, p.id ASC`,
  price_desc: Prisma.sql`p.min_price DESC, p.id DESC`,
  name: Prisma.sql`p.name COLLATE "pl-x-icu" ASC, p.id ASC`,
};

/** %, _ and \ typed by the user are matched literally, not as LIKE wildcards */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&');
}

function and(conditions: Prisma.Sql[]): Prisma.Sql {
  return conditions.length > 0 ? Prisma.join(conditions, ' AND ') : Prisma.sql`TRUE`;
}

/**
 * Filter fragments split in two: "common" filters always apply; each facet dimension
 * (origin, roastLevel, brewMethod) is kept apart so its own facet can ignore it.
 * categoryIds: the requested category and its subcategories (undefined = no filter).
 */
function filters(query: ProductListQuery, categoryIds: string[] | undefined) {
  const common = [PUBLIC_PRODUCT_SQL];
  if (categoryIds !== undefined) {
    common.push(Prisma.sql`p.category_id = ANY(${categoryIds}::uuid[])`);
  }
  if (query.kind !== undefined) {
    common.push(Prisma.sql`p.kind = ${query.kind}::"ProductKind"`);
  }
  if (query.priceMin !== undefined) {
    common.push(Prisma.sql`p.min_price >= ${query.priceMin}`);
  }
  if (query.priceMax !== undefined) {
    common.push(Prisma.sql`p.min_price <= ${query.priceMax}`);
  }
  if (query.q !== undefined) {
    common.push(Prisma.sql`p.name ILIKE ${`%${escapeLike(query.q)}%`}`);
  }

  return {
    common: and(common),
    // An unknown slug gives NULL, which matches nothing
    origin:
      query.origin === undefined
        ? Prisma.sql`TRUE`
        : Prisma.sql`p.origin_id = (SELECT id FROM origins WHERE slug = ${query.origin})`,
    roastLevel:
      query.roastLevel === undefined
        ? Prisma.sql`TRUE`
        : Prisma.sql`p.roast_level = ${query.roastLevel}::"RoastLevel"`,
    // && = arrays overlap: the product matches any of the requested methods
    brewMethod:
      query.brewMethod === undefined
        ? Prisma.sql`TRUE`
        : Prisma.sql`p.brew_methods && ${query.brewMethod}::"BrewMethod"[]`,
  };
}

/**
 * One page of products with origin, first image and stock flag. Image and stock are
 * LATERAL ... LIMIT 1 subqueries, run only for the rows of the page (index lookups);
 * EXISTS in the select list made the planner scan the whole variants table instead.
 */
export function productPageSql(
  query: ProductListQuery,
  categoryIds: string[] | undefined,
): Prisma.Sql {
  const f = filters(query, categoryIds);
  return Prisma.sql`
    SELECT p.id, p.slug, p.name, p.kind::text AS kind, p.min_price AS "minPrice",
           p.roast_level::text AS "roastLevel", p.flavor_notes AS "flavorNotes",
           p.brew_methods::text[] AS "brewMethods",
           o.slug AS "originSlug", o.name AS "originName",
           img.url AS "imageUrl", img.alt AS "imageAlt",
           stock.found IS NOT NULL AS "inStock"
    FROM products p
    LEFT JOIN origins o ON o.id = p.origin_id
    LEFT JOIN LATERAL (
      SELECT i.url, i.alt FROM product_images i
      WHERE i.product_id = p.id
      ORDER BY i.position, i.id
      LIMIT 1
    ) img ON TRUE
    LEFT JOIN LATERAL (
      SELECT TRUE AS found FROM product_variants v
      WHERE v.product_id = p.id AND v.is_active AND v.stock > 0
      LIMIT 1
    ) stock ON TRUE
    WHERE ${f.common} AND ${f.origin} AND ${f.roastLevel} AND ${f.brewMethod}
    ORDER BY ${ORDER_BY[query.sort]}
    LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}`;
}

/**
 * Total and all three facets in one statement (one snapshot, one round trip).
 * The CTE applies the common filters once and marks each facet dimension as a boolean;
 * every facet then combines all marks except its own.
 */
export function productStatsSql(
  query: ProductListQuery,
  categoryIds: string[] | undefined,
): Prisma.Sql {
  const f = filters(query, categoryIds);
  return Prisma.sql`
    WITH base AS (
      SELECT p.origin_id, p.roast_level, p.brew_methods,
             ${f.origin} AS m_origin, ${f.roastLevel} AS m_roast, ${f.brewMethod} AS m_brew
      FROM products p
      WHERE ${f.common}
    )
    SELECT 'total' AS facet, NULL::text AS value, NULL::text AS name, count(*)::int AS count
    FROM base WHERE m_origin AND m_roast AND m_brew
    UNION ALL
    SELECT 'origin', o.slug, o.name, count(*)::int
    FROM base JOIN origins o ON o.id = base.origin_id
    WHERE m_roast AND m_brew
    GROUP BY o.slug, o.name
    UNION ALL
    SELECT 'roastLevel', roast_level::text, NULL, count(*)::int
    FROM base WHERE m_origin AND m_brew AND roast_level IS NOT NULL
    GROUP BY roast_level
    UNION ALL
    SELECT 'brewMethod', method::text, NULL, count(*)::int
    FROM base, unnest(brew_methods) AS method
    WHERE m_origin AND m_roast
    GROUP BY method`;
}
