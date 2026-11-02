import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';
import {
  ADMIN_ORIGIN,
  adminSessionCookie,
  createTestApp,
  createUser,
  findSetCookie,
  resetDatabase,
  STOREFRONT_ORIGIN,
  type TestApp,
} from '../../test/test-app';
import { SESSION_POLICIES } from '../auth/session-policy';

const STOREFRONT_COOKIE = SESSION_POLICIES.STOREFRONT.cookieName;

// Every admin route, so a new controller cannot forget @AdminAuth(). Ids only need to be
// well-formed: the guards run before the handler, so nothing is looked up.
const ID = '01923456-789a-7bcd-8ef0-123456789abc';
const ROUTES: ReadonlyArray<readonly ['get' | 'post' | 'patch' | 'delete', string]> = [
  ['get', '/api/v1/admin/categories'],
  ['post', '/api/v1/admin/categories'],
  ['patch', `/api/v1/admin/categories/${ID}`],
  ['delete', `/api/v1/admin/categories/${ID}`],
  ['get', '/api/v1/admin/origins'],
  ['post', '/api/v1/admin/origins'],
  ['patch', `/api/v1/admin/origins/${ID}`],
  ['delete', `/api/v1/admin/origins/${ID}`],
  ['get', '/api/v1/admin/products'],
  ['post', '/api/v1/admin/products'],
  ['get', `/api/v1/admin/products/${ID}`],
  ['patch', `/api/v1/admin/products/${ID}`],
  ['delete', `/api/v1/admin/products/${ID}`],
  ['post', `/api/v1/admin/products/${ID}/variants`],
  ['patch', `/api/v1/admin/products/${ID}/variants/${ID}`],
];

describe('admin routes access', () => {
  let t: TestApp;
  let customerAdminScopeCookie: string;
  let storefrontCookie: string;

  beforeAll(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    const customer = await createUser(t.prisma, {
      email: 'jan@example.com',
      password: 'dlugie-haslo-123',
      role: 'CUSTOMER',
    });
    // A customer cannot log in to the panel; this simulates an admin whose role was revoked
    customerAdminScopeCookie = await adminSessionCookie(t.prisma, customer.id);
    const login = await request(t.server)
      .post('/api/v1/auth/login')
      .set('Origin', STOREFRONT_ORIGIN)
      .send({ email: 'jan@example.com', password: 'dlugie-haslo-123' })
      .expect(200);
    const token = findSetCookie(login.headers, STOREFRONT_COOKIE)?.value ?? '';
    storefrontCookie = `${STOREFRONT_COOKIE}=${token}`;
  });

  afterAll(async () => {
    await t.app.close();
  });

  const call = (method: (typeof ROUTES)[number][0], path: string) =>
    request(t.server)[method](path).set('Origin', ADMIN_ORIGIN);

  it.each(ROUTES)('%s %s → 401 without a panel session', async (method, path) => {
    await call(method, path).expect(401);
  });

  it.each(ROUTES)('%s %s → 401 with a storefront session', async (method, path) => {
    await call(method, path).set('Cookie', storefrontCookie).expect(401);
  });

  it.each(ROUTES)('%s %s → 403 for a non-admin panel session', async (method, path) => {
    await call(method, path).set('Cookie', customerAdminScopeCookie).expect(403);
  });
});
