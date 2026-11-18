import { toast } from '@ziarnista/ui/toast';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { sessionExpired } from './session-slice';

// Same origin as the panel: the Next.js rewrite forwards /api/* to NestJS (BFF, SPEC 7.2).
// The browser adds the Origin header to mutations on its own; the API checks it against CSRF.
const rawBaseQuery = fetchBaseQuery({ baseUrl: '/api/v1', credentials: 'include' });

// On login a 401 means a wrong password, not a lost session, and both forms show their own errors
const ENDPOINTS_WITH_OWN_ERRORS = new Set(['login', 'logout']);

const baseQueryWithSession: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const status = result.error?.status;

  if (ENDPOINTS_WITH_OWN_ERRORS.has(api.endpoint)) {
    return result;
  }
  if (status === 401) {
    api.dispatch(sessionExpired());
  }
  // A query has a page to render ForbiddenState on; a mutation only has the button just clicked
  if (status === 403 && api.type === 'mutation') {
    toast.error('Nie masz uprawnień do wykonania tej operacji.');
  }
  return result;
};

/** Endpoints are added per feature with injectEndpoints. Tag strategy: docs/admin-state.md */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithSession,
  tagTypes: ['Product', 'Category', 'Origin', 'Order'],
  endpoints: () => ({}),
});
