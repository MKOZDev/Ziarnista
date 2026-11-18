import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { config, proxy } from './proxy';

const ORIGIN = 'http://localhost:3001';

function request(path: string, cookie?: string) {
  return new NextRequest(`${ORIGIN}${path}`, cookie ? { headers: { cookie } } : undefined);
}

describe('proxy', () => {
  it('redirects to the login page with the return path when there is no session cookie', () => {
    const response = proxy(request('/products?page=2'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      `${ORIGIN}/login?returnTo=%2Fproducts%3Fpage%3D2`,
    );
  });

  it('adds no return path for the dashboard', () => {
    expect(proxy(request('/')).headers.get('location')).toBe(`${ORIGIN}/login`);
  });

  it('lets the request through with the session cookie', () => {
    const response = proxy(request('/products', 'zia_admin_session=abc'));

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('does not accept the storefront session cookie', () => {
    expect(proxy(request('/products', 'zia_session=abc')).status).toBe(307);
  });

  describe('matcher', () => {
    const [pattern] = config.matcher;
    const matches = (path: string) => new RegExp(`^${pattern}$`).test(path);

    it.each(['/', '/products', '/orders/123', '/login-history'])('covers %s', (path) => {
      expect(matches(path)).toBe(true);
    });

    it.each(['/login', '/api/v1/admin/me', '/_next/static/chunk.js', '/favicon.ico'])(
      'skips %s',
      (path) => {
        expect(matches(path)).toBe(false);
      },
    );
  });
});
