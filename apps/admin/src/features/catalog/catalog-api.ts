import { adminCategoryListSchema, type AdminCategory } from '@ziarnista/shared';
import { baseApi } from '@/store/base-api';

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Flat list; the panel builds the tree from parentId (categoryOptions) */
    getCategories: build.query<AdminCategory[], void>({
      query: () => 'admin/categories',
      responseSchema: adminCategoryListSchema,
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),
  }),
});

export const { useGetCategoriesQuery } = catalogApi;
