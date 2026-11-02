import type { AdminOrigin } from '@ziarnista/shared';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createCategory, createOrigin, createProduct } from '../../../test/catalog-fixtures';
import {
  ADMIN_ORIGIN,
  adminSessionCookie,
  createTestApp,
  createUser,
  resetDatabase,
  type TestApp,
} from '../../../test/test-app';
import { ORIGIN_NAME_TAKEN_MESSAGE, ORIGIN_SLUG_TAKEN_MESSAGE } from './admin-origins.service';

const URL = '/api/v1/admin/origins';
const MISSING_ID = '01923456-789a-7bcd-8ef0-123456789abc';

describe('admin origins (/admin/origins)', () => {
  let t: TestApp;
  let cookie: string;

  beforeEach(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    const admin = await createUser(t.prisma, {
      email: 'admin@example.com',
      password: 'haslo-admina-123',
      role: 'ADMIN',
    });
    cookie = await adminSessionCookie(t.prisma, admin.id);
  });

  afterEach(async () => {
    await t.app.close();
  });

  const post = (body: object) =>
    request(t.server).post(URL).set('Cookie', cookie).set('Origin', ADMIN_ORIGIN).send(body);
  const patch = (id: string, body: object) =>
    request(t.server)
      .patch(`${URL}/${id}`)
      .set('Cookie', cookie)
      .set('Origin', ADMIN_ORIGIN)
      .send(body);
  const remove = (id: string) =>
    request(t.server).delete(`${URL}/${id}`).set('Cookie', cookie).set('Origin', ADMIN_ORIGIN);

  async function originWithProduct(): Promise<string> {
    const originId = await createOrigin(t.prisma, 'etiopia', 'Etiopia');
    const categoryId = await createCategory(t.prisma, 'kawa', 'Kawa');
    await createProduct(t.prisma, {
      slug: 'etiopia-guji',
      name: 'Etiopia Guji',
      categoryId,
      originId,
      variants: [{ price: 4900 }],
    });
    return originId;
  }

  it('creates an origin with a slug generated from the name', async () => {
    const response = await post({ name: 'Wybrzeże Kości Słoniowej' }).expect(201);

    expect(response.body).toEqual<AdminOrigin>({
      id: expect.any(String) as string,
      name: 'Wybrzeże Kości Słoniowej',
      slug: 'wybrzeze-kosci-sloniowej',
      productCount: 0,
    });
  });

  it('lists origins with product counts', async () => {
    const etiopia = await originWithProduct();
    await createOrigin(t.prisma, 'kenia', 'Kenia');

    const response = await request(t.server).get(URL).set('Cookie', cookie).expect(200);

    expect(response.body).toEqual([
      { id: etiopia, name: 'Etiopia', slug: 'etiopia', productCount: 1 },
      { id: expect.any(String) as string, name: 'Kenia', slug: 'kenia', productCount: 0 },
    ]);
  });

  it('returns 409 for a name that differs only in case', async () => {
    await createOrigin(t.prisma, 'etiopia', 'Etiopia');

    const response = await post({ name: 'ETIOPIA' }).expect(409);

    expect(response.body).toMatchObject({ message: ORIGIN_NAME_TAKEN_MESSAGE });
  });

  it('returns 409 for a slug given by hand that is taken', async () => {
    await createOrigin(t.prisma, 'etiopia', 'Etiopia');

    const response = await post({ name: 'Etiopia Sidamo', slug: 'etiopia' }).expect(409);

    expect(response.body).toMatchObject({ message: ORIGIN_SLUG_TAKEN_MESSAGE });
  });

  it('renames an origin, keeping its slug; its own name in other case is allowed', async () => {
    const id = await createOrigin(t.prisma, 'etiopia', 'Etiopia');

    const response = await patch(id, { name: 'ETIOPIA' }).expect(200);

    expect(response.body).toMatchObject({ name: 'ETIOPIA', slug: 'etiopia' });
  });

  it('returns 409 when renaming to the name of another origin', async () => {
    await createOrigin(t.prisma, 'etiopia', 'Etiopia');
    const id = await createOrigin(t.prisma, 'kenia', 'Kenia');

    await patch(id, { name: 'etiopia' }).expect(409);
  });

  it('returns 404 when updating a missing origin', async () => {
    await patch(MISSING_ID, { slug: 'nowy' }).expect(404);
  });

  it('deletes an unused origin', async () => {
    const id = await createOrigin(t.prisma, 'kenia', 'Kenia');

    await remove(id).expect(204);

    expect(await t.prisma.origin.count()).toBe(0);
  });

  it('returns 409 when deleting an origin used by a product', async () => {
    const id = await originWithProduct();

    const response = await remove(id).expect(409);

    expect(response.body).toMatchObject({
      message: 'Nie można usunąć pochodzenia przypisanego do 1 produktu',
    });
    expect(await t.prisma.origin.count()).toBe(1);
  });

  it('returns 404 when deleting a missing origin', async () => {
    await remove(MISSING_ID).expect(404);
  });
});
