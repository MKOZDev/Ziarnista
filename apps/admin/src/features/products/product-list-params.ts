import type { SortState } from '@ziarnista/ui/data-table';
import {
  adminProductListQuerySchema,
  type AdminProductListQuery,
  type AdminProductSort,
} from '@ziarnista/shared';

/** The whole state of the product list; the URL is its only store (docs/admin-state.md) */
export type ProductListParams = AdminProductListQuery;

const shape = adminProductListQuerySchema.shape;
const KEYS = Object.keys(shape) as (keyof typeof shape)[];
const DEFAULTS: ProductListParams = adminProductListQuerySchema.parse({});

/** Narrowing the list: changing any of these starts again from page 1 and clears the selection */
export const FILTER_KEYS = ['q', 'status', 'kind', 'categoryId', 'lowStock'] as const;

/**
 * Each param is validated on its own with the API's schema, and an invalid one falls back to
 * its default. A typo in a shared link narrows the list a little less instead of breaking it.
 */
export function parseProductListParams(search: URLSearchParams): ProductListParams {
  const valid: Record<string, string> = {};
  for (const key of KEYS) {
    const value = search.get(key);
    if (value !== null && shape[key].safeParse(value).success) {
      valid[key] = value;
    }
  }
  return adminProductListQuerySchema.parse(valid);
}

/**
 * Defaults are left out, so one view has one URL ("/products", not "/products?page=1&sort=…").
 * The API applies the same defaults, so this is also the query string of GET /admin/products.
 */
export function serializeProductListParams(params: ProductListParams): URLSearchParams {
  const search = new URLSearchParams();
  for (const key of KEYS) {
    const value = params[key];
    if (value !== undefined && value !== DEFAULTS[key]) {
      search.set(key, String(value));
    }
  }
  return search;
}

export function hasActiveFilters(params: ProductListParams): boolean {
  return FILTER_KEYS.some((key) => params[key] !== undefined);
}

/**
 * The next state after a change. Anything but a page change starts from page 1: page 4 of
 * the old results says nothing about the new ones.
 */
export function nextProductListParams(
  params: ProductListParams,
  change: Partial<ProductListParams>,
): ProductListParams {
  return { ...params, page: DEFAULTS.page, ...change };
}

export function clearedFilters(): Partial<ProductListParams> {
  return Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined]));
}

// ---------- Sortable column headers ↔ the API sort param ----------

/** Header sortKey → the API sort for each direction; only orders the API supports */
const COLUMN_SORTS: Record<string, Record<SortState['direction'], AdminProductSort>> = {
  name: { asc: 'name', desc: 'name_desc' },
  price: { asc: 'price_asc', desc: 'price_desc' },
};

export function sortToColumn(sort: AdminProductSort): SortState | null {
  for (const [key, directions] of Object.entries(COLUMN_SORTS)) {
    if (directions.asc === sort) return { key, direction: 'asc' };
    if (directions.desc === sort) return { key, direction: 'desc' };
  }
  // "updated" and "newest" have no column; the sort select shows them
  return null;
}

export function columnToSort({ key, direction }: SortState): AdminProductSort {
  const directions = COLUMN_SORTS[key];
  if (!directions) {
    throw new Error(`Column "${key}" is not sortable`);
  }
  return directions[direction];
}
