import type {
  AdminProductDetail,
  AdminProductListItem,
  AdminProductListResponse,
} from '@ziarnista/shared';
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
import { PUBLISH_BLOCKED_MESSAGE } from './publication-rules';

const URL = '/api/v1/admin/products';
const MISSING_ID = '01923456-789a-7bcd-8ef0-123456789abc';

describe('admin products (/admin/products)', () => {
  let t: TestApp;
  let cookie: string;
  let kawaId: string;
  let przelewId: string;
  let akcesoriaId: string;
  let etiopiaId: string;

  beforeEach(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    const admin = await createUser(t.prisma, {
      email: 'admin@example.com',
      password: 'haslo-admina-123',
      role: 'ADMIN',
    });
    cookie = await adminSessionCookie(t.prisma, admin.id);
    kawaId = await createCategory(t.prisma, 'kawa', 'Kawa');
    przelewId = await createCategory(t.prisma, 'przelew', 'Przelew', kawaId);
    akcesoriaId = await createCategory(t.prisma, 'akcesoria', 'Akcesoria');
    etiopiaId = await createOrigin(t.prisma, 'etiopia', 'Etiopia');
  });

  afterEach(async () => {
    await t.app.close();
  });

  const get = (path: string) => request(t.server).get(`${URL}${path}`).set('Cookie', cookie);
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

  function coffeeInput(overrides: object = {}) {
    return {
      kind: 'COFFEE',
      name: 'Etiopia Guji',
      categoryId: przelewId,
      originId: etiopiaId,
      roastLevel: 'LIGHT',
      flavorNotes: ['Jaśmin', 'bergamotka'],
      brewMethods: ['POUR_OVER'],
      variants: [
        { sku: 'eth-guji-250-z', label: '250 g / ziarno', price: 4900, stock: 10 },
        { sku: 'ETH-GUJI-1000-Z', label: '1 kg / ziarno', price: 15900, stock: 3 },
      ],
      ...overrides,
    };
  }

  async function createViaApi(overrides: object = {}): Promise<AdminProductDetail> {
    const response = await post(coffeeInput(overrides)).expect(201);
    return response.body as AdminProductDetail;
  }

  describe('POST', () => {
    it('creates a draft with its variants and minPrice in one request', async () => {
      const product = await createViaApi();

      expect(product).toMatchObject({
        kind: 'COFFEE',
        status: 'DRAFT',
        name: 'Etiopia Guji',
        slug: 'etiopia-guji',
        description: '',
        metaTitle: null,
        categoryId: przelewId,
        originId: etiopiaId,
        roastLevel: 'LIGHT',
        flavorNotes: ['jaśmin', 'bergamotka'],
        minPrice: 4900,
        images: [],
      });
      expect(product.variants).toEqual([
        expect.objectContaining({ sku: 'ETH-GUJI-250-Z', price: 4900, isActive: true }),
        expect.objectContaining({ sku: 'ETH-GUJI-1000-Z', price: 15900, isActive: true }),
      ]);
      expect(await t.prisma.productVariant.count()).toBe(2);
    });

    it('computes minPrice from active variants only (null when none is active)', async () => {
      const product = await createViaApi({
        variants: [{ sku: 'X-1', label: 'x', price: 100, stock: 1, isActive: false }],
      });

      expect(product.minPrice).toBeNull();
    });

    it('generates a slug from Polish letters and adds -2, -3 on collisions', async () => {
      const slugs: string[] = [];
      for (let i = 0; i < 3; i++) {
        const product = await createViaApi({
          name: 'Łyżka Żółta',
          kind: 'ACCESSORY',
          categoryId: akcesoriaId,
          originId: null,
          roastLevel: null,
          variants: [{ sku: `LYZKA-${i}`, label: 'sztuka', price: 1500, stock: 5 }],
        });
        slugs.push(product.slug);
      }

      expect(slugs).toEqual(['lyzka-zolta', 'lyzka-zolta-2', 'lyzka-zolta-3']);
    });

    it('returns 409 for a slug given by hand that is taken', async () => {
      await createViaApi();

      await post(
        coffeeInput({
          slug: 'etiopia-guji',
          variants: [{ sku: 'OTHER-1', label: 'x', price: 100, stock: 1 }],
        }),
      ).expect(409);
    });

    it('rolls back the product when a variant SKU belongs to another product', async () => {
      await createProduct(t.prisma, {
        slug: 'kenia',
        name: 'Kenia',
        categoryId: przelewId,
        originId: etiopiaId,
        variants: [{ price: 5900 }],
      });
      const response = await post(
        coffeeInput({
          variants: [
            { sku: 'NEW-1', label: 'nowy', price: 4900, stock: 1 },
            // createProduct names SKUs "<SLUG>-<index>"; lowercase input is normalized
            { sku: 'kenia-0', label: 'zajęty', price: 5900, stock: 1 },
          ],
        }),
      ).expect(409);

      expect(response.body).toMatchObject({
        message: 'SKU już zajęte: KENIA-0',
        errors: [{ path: 'variants.1.sku', message: 'SKU jest już zajęte' }],
      });
      // Neither the product nor its first (valid) variant was left behind
      expect(await t.prisma.product.count({ where: { slug: 'etiopia-guji' } })).toBe(0);
      expect(await t.prisma.productVariant.count({ where: { sku: 'NEW-1' } })).toBe(0);
    });

    it('returns 400 for a coffee without origin and an accessory with one', async () => {
      const coffee = await post(coffeeInput({ originId: null })).expect(400);
      const accessory = await post(
        coffeeInput({ kind: 'ACCESSORY', roastLevel: null, categoryId: akcesoriaId }),
      ).expect(400);

      expect(coffee.body).toMatchObject({ errors: [{ path: 'originId' }] });
      expect(accessory.body).toMatchObject({
        errors: [{ path: 'originId', message: 'Akcesorium nie może mieć pochodzenia' }],
      });
    });

    it('returns 400 for a category or origin that does not exist', async () => {
      const category = await post(coffeeInput({ categoryId: MISSING_ID })).expect(400);
      const origin = await post(coffeeInput({ originId: MISSING_ID })).expect(400);

      expect(category.body).toMatchObject({ errors: [{ path: 'categoryId' }] });
      expect(origin.body).toMatchObject({ errors: [{ path: 'originId' }] });
      expect(await t.prisma.product.count()).toBe(0);
    });
  });

  describe('GET /:id', () => {
    it('returns inactive variants and images ordered by position', async () => {
      const id = await createProduct(t.prisma, {
        slug: 'kenia',
        name: 'Kenia',
        categoryId: przelewId,
        originId: etiopiaId,
        variants: [{ price: 5900 }, { price: 100, isActive: false }],
        images: ['/a.webp', '/b.webp'],
      });

      const response = await get(`/${id}`).expect(200);
      const product = response.body as AdminProductDetail;

      expect(product.variants.map((variant) => variant.isActive)).toEqual([true, false]);
      expect(product.images.map((image) => [image.url, image.position])).toEqual([
        ['/a.webp', 0],
        ['/b.webp', 1],
      ]);
    });

    it('returns 404 for a missing product', async () => {
      await get(`/${MISSING_ID}`).expect(404);
    });
  });

  describe('PATCH', () => {
    it('updates fields without changing the slug', async () => {
      const product = await createViaApi();

      const response = await patch(product.id, {
        name: 'Etiopia Guji Hambela',
        description: 'Kwiatowa',
        metaTitle: '',
      }).expect(200);

      expect(response.body).toMatchObject({
        name: 'Etiopia Guji Hambela',
        slug: 'etiopia-guji',
        description: 'Kwiatowa',
        metaTitle: null,
      });
    });

    it('checks the coffee rule against the stored product', async () => {
      const accessory = await createViaApi({
        kind: 'ACCESSORY',
        categoryId: akcesoriaId,
        originId: null,
        roastLevel: null,
      });

      const response = await patch(accessory.id, { kind: 'COFFEE' }).expect(400);

      expect(response.body).toMatchObject({
        errors: [
          { path: 'originId', message: 'Kawa musi mieć pochodzenie' },
          { path: 'roastLevel', message: 'Kawa musi mieć stopień palenia' },
        ],
      });
      await patch(accessory.id, { kind: 'COFFEE', originId: etiopiaId, roastLevel: 'DARK' }).expect(
        200,
      );
    });

    it('returns 409 for a taken slug', async () => {
      await createViaApi();
      const other = await createViaApi({
        name: 'Kenia',
        variants: [{ sku: 'KENIA-1', label: 'x', price: 100, stock: 1 }],
      });

      await patch(other.id, { slug: 'etiopia-guji' }).expect(409);
    });

    it('returns 404 for a missing product', async () => {
      await patch(MISSING_ID, { name: 'X' }).expect(404);
    });

    describe('publishing (status ACTIVE)', () => {
      it('requires an image', async () => {
        const product = await createViaApi();

        const response = await patch(product.id, { status: 'ACTIVE' }).expect(400);

        expect(response.body).toEqual({
          statusCode: 400,
          message: PUBLISH_BLOCKED_MESSAGE,
          errors: [{ path: 'images', message: 'Dodaj co najmniej jedno zdjęcie' }],
        });
      });

      it('reports a missing active variant and image together', async () => {
        const product = await createViaApi({
          variants: [{ sku: 'X-1', label: 'x', price: 100, stock: 1, isActive: false }],
        });

        const response = await patch(product.id, { status: 'ACTIVE' }).expect(400);

        expect((response.body as { errors: { path: string }[] }).errors.map((e) => e.path)).toEqual(
          ['variants', 'images'],
        );
      });

      it('publishes a product with an active variant and an image', async () => {
        const id = await createProduct(t.prisma, {
          slug: 'kenia',
          name: 'Kenia',
          categoryId: przelewId,
          originId: etiopiaId,
          status: 'DRAFT',
          variants: [{ price: 5900 }],
          images: ['/kenia.webp'],
        });

        const response = await patch(id, { status: 'ACTIVE' }).expect(200);

        expect(response.body).toMatchObject({ status: 'ACTIVE' });
        // Visible in the public catalog right away
        await request(t.server).get('/api/v1/products/kenia').expect(200);
      });

      it('restores an archived product as a draft', async () => {
        const product = await createViaApi();
        await remove(product.id).expect(204);

        await patch(product.id, { status: 'DRAFT' }).expect(200);
      });
    });
  });

  describe('DELETE', () => {
    it('archives the product, keeping it and its variants; repeated calls are fine', async () => {
      const product = await createViaApi();

      await remove(product.id).expect(204);
      await remove(product.id).expect(204);

      const row = await t.prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(row.status).toBe('ARCHIVED');
      expect(await t.prisma.productVariant.count({ where: { productId: product.id } })).toBe(2);
    });

    it('returns 404 for a missing product', async () => {
      await remove(MISSING_ID).expect(404);
    });
  });

  describe('GET (list)', () => {
    // newest last:  slug           status    kind       category   minPrice  SKUs
    //               etiopia-guji   ACTIVE    COFFEE     przelew    4900      etiopia-guji-0
    //               kawa-szkic     DRAFT     COFFEE     kawa       null      kawa-szkic-0 (inactive)
    //               v60-procent    ARCHIVED  ACCESSORY  akcesoria  2900      v60-procent-0
    beforeEach(async () => {
      const base = new Date('2026-01-01T00:00:00Z').getTime();
      await createProduct(t.prisma, {
        slug: 'etiopia-guji',
        name: 'Etiopia Guji',
        categoryId: przelewId,
        originId: etiopiaId,
        variants: [
          { price: 4900, stock: 7 },
          { price: 6900, stock: 3 },
          { price: 100, stock: 50, isActive: false },
        ],
        images: ['/guji.webp'],
        createdAt: new Date(base),
      });
      await createProduct(t.prisma, {
        slug: 'kawa-szkic',
        name: 'Kawa szkic',
        categoryId: kawaId,
        originId: etiopiaId,
        status: 'DRAFT',
        variants: [{ price: 3900, isActive: false }],
        createdAt: new Date(base + 1000),
      });
      await createProduct(t.prisma, {
        slug: 'v60-procent',
        name: 'Drip V60 100%',
        kind: 'ACCESSORY',
        categoryId: akcesoriaId,
        status: 'ARCHIVED',
        variants: [{ price: 2900 }],
        createdAt: new Date(base + 2000),
      });
    });

    async function list(query: string): Promise<AdminProductListResponse> {
      const response = await get(query).expect(200);
      return response.body as AdminProductListResponse;
    }

    const slugs = (body: AdminProductListResponse) => body.items.map((item) => item.slug);

    it('lists all statuses with counts, stock of active variants and a thumbnail', async () => {
      const body = await list('?sort=newest');

      expect(slugs(body)).toEqual(['v60-procent', 'kawa-szkic', 'etiopia-guji']);
      expect(body).toMatchObject({ page: 1, pageSize: 20, total: 3, totalPages: 1 });
      expect(body.items.find((item) => item.slug === 'etiopia-guji')).toEqual<AdminProductListItem>(
        {
          id: expect.any(String) as string,
          kind: 'COFFEE',
          status: 'ACTIVE',
          name: 'Etiopia Guji',
          slug: 'etiopia-guji',
          category: { id: przelewId, name: 'Przelew' },
          minPrice: 4900,
          variantCount: 3,
          activeVariantCount: 2,
          totalStock: 10,
          image: { url: '/guji.webp', alt: 'Etiopia Guji 0' },
          updatedAt: expect.any(String) as string,
        },
      );
    });

    it('filters by status and kind', async () => {
      expect(slugs(await list('?status=DRAFT'))).toEqual(['kawa-szkic']);
      expect(slugs(await list('?kind=ACCESSORY'))).toEqual(['v60-procent']);
    });

    it('filters by category including subcategories', async () => {
      const body = await list(`?categoryId=${kawaId}&sort=newest`);

      expect(slugs(body)).toEqual(['kawa-szkic', 'etiopia-guji']);
    });

    it('searches name, slug and SKU, case-insensitively', async () => {
      expect(slugs(await list('?q=GUJI'))).toEqual(['etiopia-guji']);
      expect(slugs(await list('?q=v60-procent-0'))).toEqual(['v60-procent']);
    });

    it('matches % literally, not as a wildcard', async () => {
      expect(slugs(await list(`?q=${encodeURIComponent('100%')}`))).toEqual(['v60-procent']);
      expect(slugs(await list(`?q=${encodeURIComponent('%')}`))).toEqual(['v60-procent']);
    });

    it('sorts by price with products without an active variant last', async () => {
      expect(slugs(await list('?sort=price_asc'))).toEqual([
        'v60-procent',
        'etiopia-guji',
        'kawa-szkic',
      ]);
      expect(slugs(await list('?sort=price_desc'))).toEqual([
        'etiopia-guji',
        'v60-procent',
        'kawa-szkic',
      ]);
    });

    it('paginates', async () => {
      const body = await list('?sort=newest&pageSize=2&page=2');

      expect(slugs(body)).toEqual(['etiopia-guji']);
      expect(body).toMatchObject({ total: 3, totalPages: 2 });
    });

    it('rejects unknown params', async () => {
      await get('?category=kawa').expect(400);
    });
  });
});
