import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { apiErrorBodySchema, type FieldIssue } from '@ziarnista/shared';

export type ApiErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  // Other 4xx: the API understood the request and refused it (404, 409, 429)
  | 'rejected'
  // No usable answer: network failure, API down, 5xx, a response breaking the contract
  | 'unavailable';

export type ApiError = {
  kind: ApiErrorKind;
  /** From the API, in Polish; null when the response had no usable body */
  message: string | null;
  fieldIssues: FieldIssue[];
  /** Technical detail shown in ErrorState */
  code: string;
};

function unavailable(code: string): ApiError {
  return { kind: 'unavailable', message: null, fieldIssues: [], code };
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function kindOf(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 400) return 'validation';
  return 'rejected';
}

/** Translates anything a query or mutation can fail with into what the UI needs to decide. */
export function parseApiError(error: unknown): ApiError {
  if (!isFetchBaseQueryError(error)) {
    // Not an HTTP problem: the response failed its responseSchema
    return unavailable('Nieprawidłowa odpowiedź serwera');
  }
  if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') {
    return unavailable('Brak połączenia');
  }
  if (error.status === 'PARSING_ERROR') {
    // With the API down the Next.js proxy answers with a non-JSON error page
    return unavailable(`HTTP ${error.originalStatus}`);
  }
  if (typeof error.status !== 'number' || error.status >= 500) {
    return unavailable(`HTTP ${String(error.status)}`);
  }

  const body = apiErrorBodySchema.safeParse(error.data);
  return {
    kind: kindOf(error.status),
    message: body.success ? body.data.message : null,
    fieldIssues: body.success ? (body.data.errors ?? []) : [],
    code: `HTTP ${error.status}`,
  };
}
