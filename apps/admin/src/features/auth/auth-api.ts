import { authUserSchema, type AuthUser, type LoginInput } from '@ziarnista/shared';
import { baseApi } from '@/store/base-api';
import { sessionStarted } from '@/store/session-slice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<AuthUser, void>({
      query: () => 'admin/me',
      responseSchema: authUserSchema,
    }),
    login: build.mutation<AuthUser, LoginInput>({
      query: (body) => ({ url: 'admin/auth/login', method: 'POST', body }),
      responseSchema: authUserSchema,
      async onQueryStarted(_input, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(sessionStarted());
          // The login response is the same user /admin/me returns, so no extra request
          await dispatch(authApi.util.upsertQueryData('getMe', undefined, data));
        } catch {
          // The login form shows the error
        }
      },
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: 'admin/auth/logout', method: 'POST' }),
    }),
  }),
});

export const { useGetMeQuery, useLoginMutation, useLogoutMutation } = authApi;
