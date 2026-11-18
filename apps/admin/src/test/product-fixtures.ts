import type {
  AdminCategory,
  AdminProductListItem,
  AdminProductListResponse,
} from '@ziarnista/shared';
import { http, HttpResponse } from 'msw/http';
import { API, server } from './server';

export const KAWA_ID = '01923456-789a-7bcd-8ef0-000000000001';

export const categories: AdminCategory[] = [
  { id: KAWA_ID, name: 'Kawa', slug: 'kawa', parentId: null, productCount: 2, childCount: 0 },
];

let nextId = 1;

/** A list row with a fresh id; override what the test is about */
export function product(overrides: Partial<AdminProductListItem> = {}): AdminProductListItem {
  const id = `01923456-789a-7bcd-8ef0-${String(nextId++).padStart(12, '0')}`;
  return {
    id,
    kind: 'COFFEE',
    status: 'ACTIVE',
    name: 'Etiopia Guji',
    slug: 'etiopia-guji',
    category: { id: KAWA_ID, name: 'Kawa' },
    minPrice: 4900,
    variantCount: 2,
    activeVariantCount: 2,
    totalStock: 25,
    hasLowStock: false,
    image: null,
    updatedAt: '2026-11-18T10:00:00.000Z',
    ...overrides,
  };
}

export function page(
  items: AdminProductListItem[],
  overrides: Partial<AdminProductListResponse> = {},
): AdminProductListResponse {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1, ...overrides };
}

/** Serves the list and records the query string of every list request */
export function serveProducts(respond: (search: URLSearchParams) => AdminProductListResponse) {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(`${API}/admin/categories`, () => HttpResponse.json(categories)),
    http.get(`${API}/admin/products`, ({ request }) => {
      const search = new URL(request.url).searchParams;
      requests.push(search);
      return HttpResponse.json(respond(search));
    }),
  );
  return requests;
}
