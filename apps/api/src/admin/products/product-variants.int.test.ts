import type { AdminProductDetail } from '@ziarnista/shared';
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
import { LAST_ACTIVE_VARIANT_MESSAGE } from './publication-rules';

const MISSING_ID = '01923456-789a-7bcd-8ef0-123456789abc';

describe('admin product variants (/admin/products/:id/variants)', () => {
  let t: TestApp;
  let cookie: string;
  let categoryId: string;
  let originId: string;

  beforeEach(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    const admin = await createUser(t.prisma, {
      email: 'admin@example.com',
      password: 'haslo-admina-123',
      role: 'ADMIN',
    });
    cookie = await adminSessionCookie(t.prisma, admin.id);
    categoryId = await createCategory(t.prisma, 'kawa', 'Kawa');
    originId = await createOrigin(t.prisma, 'etiopia', 'Etiopia');
  });

  afterEach(async () => {
    await t.app.close();
  });

  const addVariant = (productId: string, body: object) =>
    request(t.server)
      .post(`/api/v1/admin/products/${productId}/variants`)
      .set('Cookie', cookie)
      .set('Origin', ADMIN_ORIGIN)
      .send(body);
  const updateVariant = (productId: string, variantId: string, body: object) =>
    request(t.server)
      .patch(`/api/v1/admin/products/${productId}/variants/${variantId}`)
      .set('Cookie', cookie)
      .set('Origin', ADMIN_ORIGIN)
      .send(body);

  /** Product with variants priced as given (all active), in creation order */
  async function product(
    prices: number[],
    status: 'DRAFT' | 'ACTIVE' = 'DRAFT',
  ): Promise<{ id: string; variantIds: string[] }> {
    const id = await createProduct(t.prisma, {
      slug: 'etiopia-guji',
      name: 'Etiopia Guji',
      categoryId,
      originId,
      status,
      variants: prices.map((price) => ({ price })),
      images: ['guji.webp'],
    });
    const variants = await t.prisma.productVariant.findMany({
      where: { productId: id },
      orderBy: { price: 'asc' },
      select: { id: true },
    });
    return { id, variantIds: variants.map((variant) => variant.id) };
  }

  async function storedMinPrice(productId: string): Promise<number | null> {
    const row = await t.prisma.product.findUniqueOrThrow({ where: { id: productId } });
    return row.minPrice;
  }

  describe('minPrice', () => {
    it('drops when a cheaper variant is added', async () => {
      const { id } = await product([4900]);

      const response = await addVariant(id, {
        sku: 'eth-guji-100',
        label: '100 g',
        price: 2500,
        stock: 5,
      }).expect(201);

      expect(response.body).toMatchObject({ minPrice: 2500 });
      expect((response.body as AdminProductDetail).variants.at(-1)).toMatchObject({
        sku: 'ETH-GUJI-100',
        isActive: true,
      });
      expect(await storedMinPrice(id)).toBe(2500);
    });

    it('ignores an inactive new variant', async () => {
      const { id } = await product([4900]);

      await addVariant(id, {
        sku: 'X-1',
        label: 'x',
        price: 100,
        stock: 0,
        isActive: false,
      }).expect(201);

      expect(await storedMinPrice(id)).toBe(4900);
    });

    it('follows a price change', async () => {
      const { id, variantIds } = await product([4900, 6900]);

      await updateVariant(id, variantIds[1] ?? '', { price: 3900 }).expect(200);

      expect(await storedMinPrice(id)).toBe(3900);
    });

    it('moves to the next variant when the cheapest one is deactivated', async () => {
      const { id, variantIds } = await product([4900, 6900]);

      const response = await updateVariant(id, variantIds[0] ?? '', { isActive: false }).expect(
        200,
      );

      expect(response.body).toMatchObject({ minPrice: 6900 });
    });

    it('becomes null when a draft has no active variant left', async () => {
      const { id, variantIds } = await product([4900]);

      await updateVariant(id, variantIds[0] ?? '', { isActive: false }).expect(200);

      expect(await storedMinPrice(id)).toBeNull();
    });

    it('stays consistent under concurrent changes to different variants', async () => {
      const { id, variantIds } = await product([1000, 2000, 3000]);

      // Each change alone would leave a different minimum; together only 3000 stays active
      await Promise.all([
        updateVariant(id, variantIds[0] ?? '', { isActive: false }).expect(200),
        updateVariant(id, variantIds[1] ?? '', { isActive: false }).expect(200),
      ]);

      expect(await storedMinPrice(id)).toBe(3000);
    });
  });

  describe('published product (ACTIVE)', () => {
    it('cannot lose its last active variant', async () => {
      const { id, variantIds } = await product([4900], 'ACTIVE');

      const response = await updateVariant(id, variantIds[0] ?? '', { isActive: false }).expect(
        400,
      );

      expect(response.body).toMatchObject({
        message: LAST_ACTIVE_VARIANT_MESSAGE,
        errors: [{ path: 'isActive' }],
      });
      // The transaction rolled back: the variant and minPrice are unchanged
      const variant = await t.prisma.productVariant.findUniqueOrThrow({
        where: { id: variantIds[0] },
      });
      expect(variant.isActive).toBe(true);
      expect(await storedMinPrice(id)).toBe(4900);
    });

    it('can deactivate a variant while another stays active', async () => {
      const { id, variantIds } = await product([4900, 6900], 'ACTIVE');

      await updateVariant(id, variantIds[0] ?? '', { isActive: false }).expect(200);
    });
  });

  describe('errors', () => {
    it('returns 409 with the field for a SKU of another variant', async () => {
      const { id, variantIds } = await product([4900, 6900]);
      const [first] = await t.prisma.productVariant.findMany({
        where: { id: variantIds[0] },
        select: { sku: true },
      });

      const response = await updateVariant(id, variantIds[1] ?? '', {
        sku: first?.sku ?? '',
      }).expect(409);

      expect(response.body).toMatchObject({ errors: [{ path: 'sku' }] });
      expect(
        await addVariant(id, { sku: first?.sku, label: 'x', price: 1, stock: 0 }),
      ).toMatchObject({ status: 409 });
    });

    it('returns 404 for a variant of another product', async () => {
      const { id } = await product([4900]);
      const otherId = await createProduct(t.prisma, {
        slug: 'kenia',
        name: 'Kenia',
        categoryId,
        originId,
        variants: [{ price: 5900 }],
      });
      const otherVariant = await t.prisma.productVariant.findFirstOrThrow({
        where: { productId: otherId },
      });

      await updateVariant(id, otherVariant.id, { price: 1 }).expect(404);

      expect(
        (await t.prisma.productVariant.findUniqueOrThrow({ where: { id: otherVariant.id } })).price,
      ).toBe(5900);
    });

    it('returns 404 for a missing product', async () => {
      await addVariant(MISSING_ID, { sku: 'X-1', label: 'x', price: 100, stock: 0 }).expect(404);
      await updateVariant(MISSING_ID, MISSING_ID, { price: 100 }).expect(404);
    });

    it('names the malformed path parameter: product id or variant id', async () => {
      const badProduct = await updateVariant('nie-uuid', MISSING_ID, { price: 100 }).expect(400);
      const badVariant = await updateVariant(MISSING_ID, 'nie-uuid', { price: 100 }).expect(400);

      expect(badProduct.body).toMatchObject({ errors: [{ path: 'id' }] });
      expect(badVariant.body).toMatchObject({
        errors: [{ path: 'variantId', message: 'Nieprawidłowy identyfikator' }],
      });
    });

    it('returns 400 for a fractional price', async () => {
      const { id } = await product([4900]);

      const response = await addVariant(id, {
        sku: 'X-1',
        label: 'x',
        price: 49.9,
        stock: 0,
      }).expect(400);

      expect(response.body).toMatchObject({ errors: [{ path: 'price' }] });
    });
  });
});
