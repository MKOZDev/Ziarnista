import { describe, expect, it } from 'vitest';
import { loginPath, safeReturnTo } from './return-to';

describe('safeReturnTo', () => {
  it('keeps a path inside the panel with its query and hash', () => {
    expect(safeReturnTo('/products?page=2#top')).toBe('/products?page=2#top');
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['absolute URL', 'https://evil.com'],
    ['bare domain', 'evil.com'],
    ['protocol-relative', '//evil.com'],
    ['backslash', '/\\evil.com'],
    ['tab inside the slashes', '/\t/evil.com'],
    ['the login page', '/login?returnTo=/orders'],
  ])('falls back to the dashboard: %s', (_case, value) => {
    expect(safeReturnTo(value)).toBe('/');
  });
});

describe('loginPath', () => {
  it('encodes the target', () => {
    expect(loginPath('/products?page=2')).toBe('/login?returnTo=%2Fproducts%3Fpage%3D2');
  });

  it('adds no parameter for the dashboard', () => {
    expect(loginPath('/')).toBe('/login');
  });
});
