import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createTestApp,
  createUser,
  findSetCookie,
  resetDatabase,
  STOREFRONT_ORIGIN,
  type TestApp,
} from '../../test/test-app';
import { SESSION_POLICIES } from './session-policy';
import { hashSessionToken } from './session-token';

const COOKIE = SESSION_POLICIES.STOREFRONT.cookieName;
const DAY_MS = 24 * 60 * 60 * 1000;
const customer = { email: 'jan@example.com', password: 'dlugie-haslo-123', name: 'Jan' };

describe('storefront auth (/auth, /me)', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
  });

  afterEach(async () => {
    await t.app.close();
  });

  const post = (path: string) => request(t.server).post(path).set('Origin', STOREFRONT_ORIGIN);

  async function login(credentials = customer): Promise<string> {
    const response = await post('/api/v1/auth/login').send(credentials).expect(200);
    const cookie = findSetCookie(response.headers, COOKIE);
    if (!cookie) {
      throw new Error('login did not set the session cookie');
    }
    return cookie.value;
  }

  describe('POST /auth/register', () => {
    it('creates a customer, logs them in and never returns the password hash', async () => {
      const response = await post('/api/v1/auth/register')
        .send({ ...customer, email: '  Jan@Example.com ' })
        .expect(201);

      expect(response.body).toMatchObject({
        email: 'jan@example.com',
        name: 'Jan',
        role: 'CUSTOMER',
      });
      expect(response.body).not.toHaveProperty('passwordHash');

      const cookie = findSetCookie(response.headers, COOKIE);
      expect(cookie?.raw).toMatch(/HttpOnly/);
      expect(cookie?.raw).toMatch(/SameSite=Lax/);
      expect(cookie?.raw).toMatch(/Path=\//);
      // Only the hash of the token is stored
      const session = await t.prisma.session.findFirstOrThrow();
      expect(session.id).toBe(hashSessionToken(cookie?.value ?? ''));
      expect(session.scope).toBe('STOREFRONT');
    });

    it('rejects a duplicate email regardless of letter case with 409', async () => {
      await post('/api/v1/auth/register').send(customer).expect(201);

      const response = await post('/api/v1/auth/register')
        .send({ ...customer, email: 'JAN@example.com' })
        .expect(409);
      expect(response.body).toMatchObject({ message: 'Konto z tym adresem email już istnieje' });
    });

    it('rejects a password shorter than 12 characters with 400', async () => {
      const response = await post('/api/v1/auth/register')
        .send({ ...customer, password: 'za-krotkie' })
        .expect(400);
      expect(response.body).toMatchObject({
        errors: [{ path: 'password', message: 'Hasło musi mieć co najmniej 12 znaków' }],
      });
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await createUser(t.prisma, { ...customer, role: 'CUSTOMER' });
    });

    it('logs in with correct credentials', async () => {
      const response = await post('/api/v1/auth/login').send(customer).expect(200);

      expect(response.body).toMatchObject({ email: customer.email, role: 'CUSTOMER' });
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(findSetCookie(response.headers, COOKIE)).not.toBeNull();
    });

    it('answers a wrong password and an unknown email identically', async () => {
      const wrongPassword = await post('/api/v1/auth/login')
        .send({ ...customer, password: 'zle-haslo-12345' })
        .expect(401);
      const unknownEmail = await post('/api/v1/auth/login')
        .send({ ...customer, email: 'nikt@example.com' })
        .expect(401);

      expect(wrongPassword.body).toEqual(unknownEmail.body);
      expect(wrongPassword.body).toMatchObject({ message: 'Nieprawidłowy email lub hasło' });
      expect(findSetCookie(wrongPassword.headers, COOKIE)).toBeNull();
    });

    it('replaces the session the request came with (no session fixation)', async () => {
      const first = await login();
      const response = await post('/api/v1/auth/login')
        .set('Cookie', `${COOKIE}=${first}`)
        .send(customer)
        .expect(200);

      const second = findSetCookie(response.headers, COOKIE)?.value;
      expect(second).toBeDefined();
      expect(second).not.toBe(first);
      expect(await t.prisma.session.count()).toBe(1);
    });

    it('returns 429 after 5 attempts for one email from one address', async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        await post('/api/v1/auth/login')
          .send({ ...customer, password: 'zle-haslo-12345' })
          .expect(401);
      }
      const response = await post('/api/v1/auth/login').send(customer).expect(429);
      expect(response.body).toMatchObject({
        message: 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.',
      });

      // Another account from the same address still has its own budget
      await post('/api/v1/auth/login')
        .send({ email: 'inny@example.com', password: 'cokolwiek-123' })
        .expect(401);
    });
  });

  describe('GET /me', () => {
    beforeEach(async () => {
      await createUser(t.prisma, { ...customer, role: 'CUSTOMER' });
    });

    it('returns 401 without a session cookie', async () => {
      await request(t.server).get('/api/v1/me').expect(401);
    });

    it('returns 401 for an unknown token', async () => {
      await request(t.server)
        .get('/api/v1/me')
        .set('Cookie', `${COOKIE}=nieistniejacy`)
        .expect(401);
    });

    it('returns the logged-in user', async () => {
      const token = await login();

      const response = await request(t.server)
        .get('/api/v1/me')
        .set('Cookie', `${COOKIE}=${token}`)
        .expect(200);
      expect(response.body).toMatchObject({ email: customer.email, role: 'CUSTOMER' });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('rejects an expired session, deletes it and clears the cookie', async () => {
      const token = await login();
      await t.prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

      const response = await request(t.server)
        .get('/api/v1/me')
        .set('Cookie', `${COOKIE}=${token}`)
        .expect(401);

      expect(await t.prisma.session.count()).toBe(0);
      expect(findSetCookie(response.headers, COOKIE)?.raw).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it('extends a sliding session past half of its lifetime and resends the cookie', async () => {
      const token = await login();
      const nearExpiry = new Date(Date.now() + 10 * DAY_MS);
      await t.prisma.session.updateMany({ data: { expiresAt: nearExpiry } });

      const response = await request(t.server)
        .get('/api/v1/me')
        .set('Cookie', `${COOKIE}=${token}`)
        .expect(200);

      const session = await t.prisma.session.findFirstOrThrow();
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * DAY_MS);
      expect(findSetCookie(response.headers, COOKIE)?.value).toBe(token);
    });

    it('does not touch a fresh session', async () => {
      const token = await login();

      const response = await request(t.server)
        .get('/api/v1/me')
        .set('Cookie', `${COOKIE}=${token}`)
        .expect(200);
      expect(findSetCookie(response.headers, COOKIE)).toBeNull();
    });
  });

  describe('POST /auth/logout', () => {
    it('deletes the session and clears the cookie', async () => {
      await createUser(t.prisma, { ...customer, role: 'CUSTOMER' });
      const token = await login();

      const response = await post('/api/v1/auth/logout')
        .set('Cookie', `${COOKIE}=${token}`)
        .expect(204);

      expect(await t.prisma.session.count()).toBe(0);
      expect(findSetCookie(response.headers, COOKIE)?.raw).toMatch(/Expires=Thu, 01 Jan 1970/);
      await request(t.server).get('/api/v1/me').set('Cookie', `${COOKIE}=${token}`).expect(401);
    });

    it('succeeds without a session', async () => {
      await post('/api/v1/auth/logout').expect(204);
    });
  });

  describe('CSRF protection (Origin header)', () => {
    it('rejects a mutating request without an Origin header', async () => {
      await request(t.server).post('/api/v1/auth/login').send(customer).expect(403);
    });

    it('rejects a mutating request from a foreign origin', async () => {
      await request(t.server)
        .post('/api/v1/auth/logout')
        .set('Origin', 'https://evil.example')
        .expect(403);
    });

    it('does not check GET requests', async () => {
      await request(t.server).get('/api/v1/me').set('Origin', 'https://evil.example').expect(401);
    });
  });
});
