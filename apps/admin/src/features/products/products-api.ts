import {
  adminProductListResponseSchema,
  type AdminProductListResponse,
  type ProductStatus,
} from '@ziarnista/shared';
import type { FetchArgs } from '@reduxjs/toolkit/query';
import { mapSettled } from '@/lib/map-settled';
import { parseApiError, type ApiError } from '@/store/api-error';
import { baseApi } from '@/store/base-api';
import { serializeProductListParams, type ProductListParams } from './product-list-params';

/** Archiving goes through DELETE (SPEC 7.5); the other statuses through PATCH */
export type BulkProductAction =
  { type: 'archive' } | { type: 'status'; status: Exclude<ProductStatus, 'ARCHIVED'> };

export type BulkProductResult = {
  succeeded: string[];
  failed: { id: string; error: ApiError }[];
};

/** Enough to be quick, few enough not to flood the API (browsers allow ~6 per host anyway) */
export const BULK_CONCURRENCY = 4;

function bulkRequest(id: string, action: BulkProductAction): FetchArgs {
  const url = `admin/products/${id}`;
  return action.type === 'archive'
    ? { url, method: 'DELETE' }
    : { url, method: 'PATCH', body: { status: action.status } };
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<AdminProductListResponse, ProductListParams>({
      query: (params) => {
        const query = serializeProductListParams(params).toString();
        return query === '' ? 'admin/products' : `admin/products?${query}`;
      },
      responseSchema: adminProductListResponseSchema,
      // One LIST for every filter and page; each row too, so a product change refreshes it
      providesTags: (result) => [
        { type: 'Product', id: 'LIST' },
        ...(result?.items ?? []).map((item) => ({ type: 'Product' as const, id: item.id })),
      ],
    }),

    /**
     * The API has no bulk endpoint, so this is one request per product. Wrapped in a single
     * mutation, the list is refetched once at the end instead of after every product, and a
     * failure of one product does not stop the others: the mutation itself always succeeds
     * and reports which products failed and why.
     */
    bulkProductAction: build.mutation<
      BulkProductResult,
      { ids: readonly string[]; action: BulkProductAction }
    >({
      queryFn: async ({ ids, action }, _api, _extraOptions, baseQuery) => {
        // baseQuery is the panel's own one: a 401 still ends the session, a 403 still toasts
        const results = await mapSettled(ids, BULK_CONCURRENCY, (id) =>
          Promise.resolve(baseQuery(bulkRequest(id, action))),
        );

        const data: BulkProductResult = { succeeded: [], failed: [] };
        results.forEach((result, index) => {
          const id = ids[index] as string;
          // An HTTP error comes back as ; a rejection would be a bug, reported the same way
          const error: unknown = result.status === 'fulfilled' ? result.value.error : result.reason;
          if (error === undefined) data.succeeded.push(id);
          else data.failed.push({ id, error: parseApiError(error) });
        });
        return { data };
      },
      invalidatesTags: (result) =>
        result && result.succeeded.length > 0
          ? [
              { type: 'Product', id: 'LIST' },
              ...result.succeeded.map((id) => ({ type: 'Product' as const, id })),
              // Not Category/Origin: their productCount counts products of every status
            ]
          : [],
    }),
  }),
});

export const { useGetProductsQuery, useBulkProductActionMutation } = productsApi;
