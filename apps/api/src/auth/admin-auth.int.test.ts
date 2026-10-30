import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ADMIN_ORIGIN,
  createTestApp,
  createUser,
  findSetCookie,
  resetDatabase,
  STOREFRONT_ORIGIN,
  type TestApp,
} from '../../test/test-app';
import { SESSION_POLICIES } from './session-policy';
import { generateSessionToken, hashSessionToken } from './session-token';

const ADMIN_COOKIE = SESSION_POLICIES.ADMIN.cookieName;
const STOREFRONT_COOKIE = SESSION_POLICIES.STOREFRONT.cookieName;
const HOUR_MS = 60 * 60 * 1000;
const admin = { email: 'admin@example.com', password: 'haslo-admina-123' };
const customer = { email: 'jan@example.com', password: 'dlugie-haslo-123' };

describe('admin auth (/admin/auth, /admin/me)', () => {
  let t: TestApp;
  let customerId: string;

  beforeEach(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    await createUser(t.prisma, { ...admin, role: 'ADMIN' });
    customerId = (await createUser(t.prisma, { ...customer, role: 'CUSTOMER' })).id;
  });

  afterEach(async () => {
    await t.app.close();
  });

  const post = (path: string) => request(t.server).post(path).set('Origin', ADMIN_ORIGIN);

  async function adminLogin(): Promise<string> {
    const response = await post('/api/v1/admin/auth/login').send(admin).expect(200);
    const cookie = findSetCookie(response.headers, ADMIN_COOKIE);
    if (!cookie) {
      throw new Error('admin login did not set the session cookie');
    }
    return cookie.value;
  }

  it('logs an admin in with an 8-hour, admin-scoped session', async () => {
    const before = Date.now();
    const token = await adminLogin();

    const session = await t.prisma.session.findUniqueOrThrow({
      where: { id: hashSessionToken(token) },
    });
    expect(session.scope).toBe('ADMIN');
    expect(session.expiresAt.getTime() - before).toBeGreaterThanOrEqual(8 * HOUR_MS - 1000);
    expect(session.expiresAt.getTime() - before).toBeLessThanOrEqual(8 * HOUR_MS + 5000);

    const me = await request(t.server)
      .get('/api/v1/admin/me')
      .set('Cookie', `${ADMIN_COOKIE}=${token}`)
      .expect(200);
    expect(me.body).toMatchObject({ email: admin.email, role: 'ADMIN' });
    expect(me.body).not.toHaveProperty('passwordHash');
  });

  it('refuses a customer account with the same message as a wrong password', async () => {
    const asCustomer = await post('/api/v1/admin/auth/login').send(customer).expect(401);
    const wrongPassword = await post('/api/v1/admin/auth/login')
      .send({ ...admin, password: 'zle-haslo-12345' })
      .expect(401);

    expect(asCustomer.body).toEqual(wrongPassword.body);
    expect(findSetCookie(asCustomer.headers, ADMIN_COOKIE)).toBeNull();
  });

  it('returns 401 on /admin/me for a customer logged in to the storefront', async () => {
    const login = await request(t.server)
      .post('/api/v1/auth/login')
      .set('Origin', STOREFRONT_ORIGIN)
      .send(customer)
      .expect(200);
    const token = findSetCookie(login.headers, STOREFRONT_COOKIE)?.value ?? '';

    // The storefront cookie is not read by the panel...
    await request(t.server)
      .get('/api/v1/admin/me')
      .set('Cookie', `${STOREFRONT_COOKIE}=${token}`)
      .expect(401);
    // ...and a storefront token moved into the panel cookie is rejected by its scope
    await request(t.server)
      .get('/api/v1/admin/me')
      .set('Cookie', `${ADMIN_COOKIE}=${token}`)
      .expect(401);
  });

  it('returns 403 on /admin/me for an admin-scoped session of a non-admin user', async () => {
    // Not reachable through the API (admin login refuses customers); simulates an admin
    // whose role was revoked while their panel session was still alive
    const token = generateSessionToken();
    await t.prisma.session.create({
      data: {
        id: hashSessionToken(token),
        userId: customerId,
        scope: 'ADMIN',
        expiresAt: new Date(Date.now() + HOUR_MS),
      },
    });

    const response = await request(t.server)
      .get('/api/v1/admin/me')
      .set('Cookie', `${ADMIN_COOKIE}=${token}`)
      .expect(403);
    expect(response.body).toMatchObject({ message: 'Brak uprawnień' });
  });

  it('rejects an admin token placed in the storefront cookie', async () => {
    const token = await adminLogin();

    await request(t.server)
      .get('/api/v1/me')
      .set('Cookie', `${STOREFRONT_COOKIE}=${token}`)
      .expect(401);
    // The admin session is not deleted by that attempt
    expect(await t.prisma.session.count()).toBe(1);
  });

  it('does not extend an admin session', async () => {
    const token = await adminLogin();
    const nearExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await t.prisma.session.updateMany({ data: { expiresAt: nearExpiry } });

    const response = await request(t.server)
      .get('/api/v1/admin/me')
      .set('Cookie', `${ADMIN_COOKIE}=${token}`)
      .expect(200);

    const session = await t.prisma.session.findFirstOrThrow();
    expect(session.expiresAt).toEqual(nearExpiry);
    expect(findSetCookie(response.headers, ADMIN_COOKIE)).toBeNull();
  });

  it('rejects an expired admin session', async () => {
    const token = await adminLogin();
    await t.prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    await request(t.server)
      .get('/api/v1/admin/me')
      .set('Cookie', `${ADMIN_COOKIE}=${token}`)
      .expect(401);
    expect(await t.prisma.session.count()).toBe(0);
  });

  it('logs out: deletes the session and clears the panel cookie', async () => {
    const token = await adminLogin();

    const response = await post('/api/v1/admin/auth/logout')
      .set('Cookie', `${ADMIN_COOKIE}=${token}`)
      .expect(204);

    expect(await t.prisma.session.count()).toBe(0);
    expect(findSetCookie(response.headers, ADMIN_COOKIE)?.raw).toMatch(/Expires=Thu, 01 Jan 1970/);
    await request(t.server)
      .get('/api/v1/admin/me')
      .set('Cookie', `${ADMIN_COOKIE}=${token}`)
      .expect(401);
  });
});
