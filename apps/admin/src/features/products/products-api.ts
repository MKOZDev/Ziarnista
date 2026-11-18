import { adminProductListResponseSchema, type AdminProductListResponse } from '@ziarnista/shared';
import { baseApi } from '@/store/base-api';
import { serializeProductListParams, type ProductListParams } from './product-list-params';

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
  }),
});

export const { useGetProductsQuery } = productsApi;
