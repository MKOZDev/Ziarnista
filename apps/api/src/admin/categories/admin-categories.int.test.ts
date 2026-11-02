import type { AdminCategory } from '@ziarnista/shared';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createCategory, createProduct } from '../../../test/catalog-fixtures';
import {
  ADMIN_ORIGIN,
  adminSessionCookie,
  createTestApp,
  createUser,
  resetDatabase,
  type TestApp,
} from '../../../test/test-app';
import {
  CATEGORY_CYCLE_MESSAGE,
  CATEGORY_SLUG_TAKEN_MESSAGE,
  PARENT_NOT_FOUND_MESSAGE,
} from './admin-categories.service';

const URL = '/api/v1/admin/categories';
const MISSING_ID = '01923456-789a-7bcd-8ef0-123456789abc';

describe('admin categories (/admin/categories)', () => {
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

  const get = (path = URL) => request(t.server).get(path).set('Cookie', cookie);
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

  describe('POST', () => {
    it('creates a category with a slug generated from a Polish name', async () => {
      const response = await post({ name: 'Łódź Żółta' }).expect(201);

      expect(response.body).toEqual<AdminCategory>({
        id: expect.any(String) as string,
        name: 'Łódź Żółta',
        slug: 'lodz-zolta',
        parentId: null,
        productCount: 0,
        childCount: 0,
      });
    });

    it('adds -2, -3 when the generated slug is taken', async () => {
      const slugs: string[] = [];
      for (let i = 0; i < 3; i++) {
        const response = await post({ name: 'Łódź Żółta' }).expect(201);
        slugs.push((response.body as AdminCategory).slug);
      }

      expect(slugs).toEqual(['lodz-zolta', 'lodz-zolta-2', 'lodz-zolta-3']);
    });

    it('returns 409 when a slug given by hand is taken', async () => {
      await createCategory(t.prisma, 'kawa', 'Kawa');

      const response = await post({ name: 'Inna kawa', slug: 'kawa' }).expect(409);

      expect(response.body).toMatchObject({ message: CATEGORY_SLUG_TAKEN_MESSAGE });
    });

    it('creates a subcategory', async () => {
      const parentId = await createCategory(t.prisma, 'kawa', 'Kawa');

      const response = await post({ name: 'Espresso', parentId }).expect(201);

      expect(response.body).toMatchObject({ slug: 'espresso', parentId });
    });

    it('returns 400 for a parent that does not exist', async () => {
      const response = await post({ name: 'Espresso', parentId: MISSING_ID }).expect(400);

      expect(response.body).toMatchObject({ message: PARENT_NOT_FOUND_MESSAGE });
    });

    it('returns 400 with the field path for invalid input', async () => {
      const response = await post({ name: '' }).expect(400);

      // One message per problem: an empty name is not also reported as "no letters"
      expect(response.body).toMatchObject({ errors: [{ path: 'name', message: 'Podaj nazwę' }] });
    });
  });

  describe('GET', () => {
    it('lists all categories with product and subcategory counts', async () => {
      const kawa = await createCategory(t.prisma, 'kawa', 'Kawa');
      const espresso = await createCategory(t.prisma, 'espresso', 'Espresso', kawa);
      await createProduct(t.prisma, {
        slug: 'szkic',
        name: 'Szkic',
        categoryId: espresso,
        kind: 'ACCESSORY',
        status: 'DRAFT',
        variants: [],
      });

      const response = await get().expect(200);

      expect(response.body).toEqual([
        {
          id: espresso,
          name: 'Espresso',
          slug: 'espresso',
          parentId: kawa,
          productCount: 1,
          childCount: 0,
        },
        { id: kawa, name: 'Kawa', slug: 'kawa', parentId: null, productCount: 0, childCount: 1 },
      ]);
    });
  });

  describe('PATCH', () => {
    it('renames without changing the slug', async () => {
      const id = await createCategory(t.prisma, 'kawa', 'Kawa');

      const response = await patch(id, { name: 'Kawy' }).expect(200);

      expect(response.body).toMatchObject({ name: 'Kawy', slug: 'kawa' });
    });

    it('moves a category to the top level with parentId: null', async () => {
      const kawa = await createCategory(t.prisma, 'kawa', 'Kawa');
      const espresso = await createCategory(t.prisma, 'espresso', 'Espresso', kawa);

      const response = await patch(espresso, { parentId: null }).expect(200);

      expect(response.body).toMatchObject({ parentId: null });
    });

    it('rejects making a category its own parent', async () => {
      const id = await createCategory(t.prisma, 'kawa', 'Kawa');

      const response = await patch(id, { parentId: id }).expect(400);

      expect(response.body).toMatchObject({ message: CATEGORY_CYCLE_MESSAGE });
    });

    it('rejects moving a category under its own descendant', async () => {
      // a > b > c; moving a under c would close the loop a > b > c > a
      const a = await createCategory(t.prisma, 'a', 'A');
      const b = await createCategory(t.prisma, 'b', 'B', a);
      const c = await createCategory(t.prisma, 'c', 'C', b);

      await patch(a, { parentId: c }).expect(400);

      const row = await t.prisma.category.findUniqueOrThrow({ where: { id: a } });
      expect(row.parentId).toBeNull();
    });

    it('allows only one of two concurrent moves that together would form a cycle', async () => {
      const a = await createCategory(t.prisma, 'a', 'A');
      const b = await createCategory(t.prisma, 'b', 'B');

      const responses = await Promise.all([patch(a, { parentId: b }), patch(b, { parentId: a })]);

      expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);
    });

    it('returns 400 for a parent that does not exist', async () => {
      const id = await createCategory(t.prisma, 'kawa', 'Kawa');

      await patch(id, { parentId: MISSING_ID }).expect(400);
    });

    it('returns 409 for a taken slug and 404 for a missing category', async () => {
      await createCategory(t.prisma, 'kawa', 'Kawa');
      const id = await createCategory(t.prisma, 'herbata', 'Herbata');

      await patch(id, { slug: 'kawa' }).expect(409);
      await patch(MISSING_ID, { name: 'X' }).expect(404);
      await patch(MISSING_ID, { parentId: id }).expect(404);
    });
  });

  describe('DELETE', () => {
    it('deletes an empty category', async () => {
      const id = await createCategory(t.prisma, 'kawa', 'Kawa');

      await remove(id).expect(204);

      expect(await t.prisma.category.count()).toBe(0);
    });

    it('returns 409 for a category with a subcategory', async () => {
      const kawa = await createCategory(t.prisma, 'kawa', 'Kawa');
      await createCategory(t.prisma, 'espresso', 'Espresso', kawa);

      const response = await remove(kawa).expect(409);

      expect(response.body).toMatchObject({
        message: 'Nie można usunąć kategorii, która ma 1 podkategorię. Najpierw je przenieś.',
      });
    });

    it('returns 409 for a category with products, archived ones included', async () => {
      const id = await createCategory(t.prisma, 'kawa', 'Kawa');
      for (const slug of ['a', 'b']) {
        await createProduct(t.prisma, {
          slug,
          name: slug,
          categoryId: id,
          kind: 'ACCESSORY',
          status: 'ARCHIVED',
          variants: [{ price: 100 }],
        });
      }

      const response = await remove(id).expect(409);

      expect(response.body).toMatchObject({
        message: 'Nie można usunąć kategorii, która ma 2 produkty. Najpierw je przenieś.',
      });
    });

    it('returns 404 for a missing category', async () => {
      await remove(MISSING_ID).expect(404);
    });

    it('returns 400 for a malformed id, naming the path parameter', async () => {
      const response = await remove('nie-uuid').expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        message: 'Nieprawidłowe dane',
        errors: [{ path: 'id', message: 'Nieprawidłowy identyfikator' }],
      });
    });
  });
});
