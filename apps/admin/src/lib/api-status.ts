import { healthResponseSchema } from '@ziarnista/shared';

export type ApiStatus = 'loading' | 'ok' | 'database-down' | 'unreachable';

/**
 * Calls the API through the Next.js rewrite (same origin), so it also verifies the BFF proxy.
 * The API answers 503 with the same body when the database is down, so the body is parsed
 * regardless of the HTTP status.
 */
export async function fetchApiStatus(signal?: AbortSignal): Promise<Exclude<ApiStatus, 'loading'>> {
  try {
    const response = await fetch('/api/v1/health', { signal, cache: 'no-store' });
    const parsed = healthResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      return 'unreachable';
    }
    return parsed.data.status === 'ok' ? 'ok' : 'database-down';
  } catch (error) {
    // Let the caller ignore aborted requests (component unmounted)
    if (signal?.aborted) {
      throw error;
    }
    // Network error or a non-JSON body (e.g. the proxy's error page when the API is down)
    return 'unreachable';
  }
}
