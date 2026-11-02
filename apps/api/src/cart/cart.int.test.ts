import type { Cart, CartQuantityError } from '@ziarnista/shared';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createCategory, createOrigin, createProduct } from '../../test/catalog-fixtures';
import {
  createTestApp,
  createUser,
  findSetCookie,
  resetDatabase,
  STOREFRONT_ORIGIN,
  type TestApp,
} from '../../test/test-app';
import { hashSessionToken } from '../auth/session-token';
import { CART_COOKIE } from './cart-cookies';

const MISSING_ID = '01923456-789a-7bcd-8ef0-123456789abc';
const customer = { email: 'jan@example.com', password: 'dlugie-haslo-123' };

type Agent = ReturnType<typeof request.agent>;

describe('cart (/cart)', () => {
  let t: TestApp;
  /** Variant ids: guji 4900 (stock 5), guji1kg 15900 (stock 100), v60 2900 (stock 500) */
  let guji: string;
  let guji1kg: string;
  let v60: string;
  let gujiProductId: string;

  beforeEach(async () => {
    t = await createTestApp();
    await resetDatabase(t.prisma);
    const categoryId = await createCategory(t.prisma, 'kawa', 'Kawa');
    const originId = await createOrigin(t.prisma, 'etiopia', 'Etiopia');
    gujiProductId = await createProduct(t.prisma, {
      slug: 'etiopia-guji',
      name: 'Etiopia Guji',
      categoryId,
      originId,
      variants: [
        { price: 4900, stock: 5 },
        { price: 15900, stock: 100 },
      ],
      images: ['products/guji/front.webp'],
    });
    await createProduct(t.prisma, {
      slug: 'drip-v60',
      name: 'Drip V60',
      kind: 'ACCESSORY',
      categoryId,
      variants: [{ price: 2900, stock: 500 }],
    });
    const sku = async (value: string) =>
      (await t.prisma.productVariant.findUniqueOrThrow({ where: { sku: value } })).id;
    guji = await sku('ETIOPIA-GUJI-0');
    guji1kg = await sku('ETIOPIA-GUJI-1');
    v60 = await sku('DRIP-V60-0');
  });

  afterEach(async () => {
    await t.app.close();
  });

  /** A browser: keeps cookies between requests and sends the storefront Origin */
  function browser() {
    const agent = request.agent(t.server);
    return {
      agent,
      get: () => agent.get('/api/v1/cart'),
      add: (variantId: string, quantity?: number) =>
        agent
          .post('/api/v1/cart/items')
          .set('Origin', STOREFRONT_ORIGIN)
          .send(quantity === undefined ? { variantId } : { variantId, quantity }),
      update: (itemId: string, quantity: number) =>
        agent
          .patch(`/api/v1/cart/items/${itemId}`)
          .set('Origin', STOREFRONT_ORIGIN)
          .send({ quantity }),
      remove: (itemId: string) =>
        agent.delete(`/api/v1/cart/items/${itemId}`).set('Origin', STOREFRONT_ORIGIN),
    };
  }

  async function login(agent: Agent, path = '/api/v1/auth/login') {
    return agent.post(path).set('Origin', STOREFRONT_ORIGIN).send(customer).expect(200);
  }

  const cartOf = (response: { body: unknown }) => response.body as Cart;
  const conflictOf = (response: { body: unknown }) => response.body as CartQuantityError;

  describe('guest', () => {
    it('reads an empty cart without creating one or setting a cookie', async () => {
      const response = await browser().get().expect(200);

      expect(cartOf(response)).toEqual<Cart>({
        items: [],
        itemCount: 0,
        subtotal: 0,
        shippingCost: 0,
        total: 0,
        freeShippingThreshold: 15_000,
        amountToFreeShipping: 15_000,
        canCheckout: false,
      });
      expect(findSetCookie(response.headers, CART_COOKIE)).toBeNull();
      expect(await t.prisma.cart.count()).toBe(0);
    });

    it('creates the cart on the first add, with an httpOnly cookie holding a random token', async () => {
      const response = await browser().add(guji, 2).expect(200);

      const cookie = findSetCookie(response.headers, CART_COOKIE);
      expect(cookie?.raw).toMatch(/HttpOnly/);
      expect(cookie?.raw).toMatch(/SameSite=Lax/);
      // Only the hash is stored: the database never sees the cookie value
      const cart = await t.prisma.cart.findFirstOrThrow();
      expect(cart.guestToken).toBe(hashSessionToken(cookie?.value ?? ''));
      expect(cart.userId).toBeNull();

      expect(cartOf(response)).toMatchObject({
        items: [
          {
            variantId: guji,
            productSlug: 'etiopia-guji',
            productName: 'Etiopia Guji',
            sku: 'ETIOPIA-GUJI-0',
            unitPrice: 4900,
            quantity: 2,
            lineTotal: 9800,
            maxQuantity: 5,
            available: true,
            problem: null,
            image: { alt: 'Etiopia Guji 0', width: 1600, height: 1067 },
          },
        ],
        itemCount: 2,
        subtotal: 9800,
        shippingCost: 1499,
        total: 11_299,
        amountToFreeShipping: 5200,
        canCheckout: true,
      });
    });

    it('increases the quantity of the line when the same variant is added again', async () => {
      const b = browser();
      await b.add(guji, 2).expect(200);

      const response = await b.add(guji).expect(200);

      expect(cartOf(response).items).toHaveLength(1);
      expect(cartOf(response).items[0]?.quantity).toBe(3);
    });

    it('ships for free from 150 zł', async () => {
      const response = await browser().add(guji1kg, 1).expect(200);

      expect(cartOf(response)).toMatchObject({
        subtotal: 15_900,
        shippingCost: 0,
        total: 15_900,
        amountToFreeShipping: 0,
      });
    });

    it('refuses to add over the stock with 409 and how many can still be added', async () => {
      const b = browser();
      await b.add(guji, 3).expect(200);

      const response = await b.add(guji, 4).expect(409);

      expect(conflictOf(response)).toEqual<CartQuantityError>({
        statusCode: 409,
        code: 'INSUFFICIENT_STOCK',
        available: 2,
        message: 'Możesz dodać jeszcze 2 szt. (w koszyku masz już 3 szt.)',
        errors: [{ path: 'quantity', message: expect.any(String) as string }],
      });
      expect(cartOf(await b.get()).items[0]?.quantity).toBe(3);
    });

    it('never exceeds the stock under concurrent adds, and loses no update', async () => {
      const b = browser();
      await b.add(v60).expect(200); // creates the cart, so all requests use the same one

      // 10 × 1 unit at a stock of 5: the cart lock serializes each check-and-write, so
      // exactly 5 succeed and the line holds exactly 5 (no lost update, no overflow)
      const statuses = await Promise.all(
        Array.from({ length: 10 }, () => b.add(guji, 1).then((response) => response.status)),
      );

      expect(statuses.filter((status) => status === 200)).toHaveLength(5);
      expect(statuses.filter((status) => status === 409)).toHaveLength(5);
      const line = cartOf(await b.get()).items.find((item) => item.variantId === guji);
      expect(line?.quantity).toBe(5);
    });

    it('caps a line at 99 units even with more in stock', async () => {
      const b = browser();
      await b.add(v60, 99).expect(200);

      const response = await b.add(v60, 1).expect(409);

      expect(conflictOf(response)).toMatchObject({ code: 'CART_LIMIT', available: 0 });
    });

    it('rejects a variant that cannot be bought and one that does not exist', async () => {
      await t.prisma.productVariant.update({ where: { id: guji }, data: { isActive: false } });
      await t.prisma.productVariant.update({ where: { id: guji1kg }, data: { stock: 0 } });
      const b = browser();

      const inactive = await b.add(guji).expect(409);
      const outOfStock = await b.add(guji1kg).expect(409);
      await b.add(MISSING_ID).expect(404);

      expect(conflictOf(inactive)).toMatchObject({ code: 'UNAVAILABLE', available: 0 });
      expect(conflictOf(outOfStock)).toMatchObject({ code: 'OUT_OF_STOCK', available: 0 });
    });

    it('sets a line quantity, refusing more than the stock with 409 and the maximum', async () => {
      const b = browser();
      const itemId = cartOf(await b.add(guji, 1)).items[0]?.id ?? '';

      const ok = await b.update(itemId, 4).expect(200);
      const tooMany = await b.update(itemId, 6).expect(409);

      expect(cartOf(ok).items[0]?.quantity).toBe(4);
      expect(conflictOf(tooMany)).toMatchObject({
        code: 'INSUFFICIENT_STOCK',
        available: 5,
        message: 'Dostępne tylko 5 szt.',
      });
      expect(cartOf(await b.get()).items[0]?.quantity).toBe(4);
    });

    it('deletes a line and answers with the cart', async () => {
      const b = browser();
      await b.add(v60);
      const itemId = cartOf(await b.add(guji)).items[1]?.id ?? '';

      const response = await b.remove(itemId).expect(200);

      expect(cartOf(response).items.map((item) => item.variantId)).toEqual([v60]);
    });

    it("cannot see or change another cart's lines (404)", async () => {
      const owner = browser();
      const itemId = cartOf(await owner.add(guji, 2)).items[0]?.id ?? '';
      const stranger = browser();
      await stranger.add(v60);

      await stranger.update(itemId, 1).expect(404);
      await stranger.remove(itemId).expect(404);
      // Without any cart too
      await browser().remove(itemId).expect(404);

      expect(cartOf(await owner.get()).items[0]?.quantity).toBe(2);
    });

    it('treats an unknown cart cookie as no cart', async () => {
      const response = await request(t.server)
        .get('/api/v1/cart')
        .set('Cookie', `${CART_COOKIE}=nie-istnieje`)
        .expect(200);

      expect(cartOf(response).items).toEqual([]);
    });
  });

  describe('lines that can no longer be bought', () => {
    it('stay in the cart with a flag and message, out of the totals, blocking checkout', async () => {
      const b = browser();
      await b.add(guji, 4);
      await b.add(guji1kg, 1);
      await b.add(v60, 2);
      // After adding: the stock drops, a variant sells out, a product gets archived
      await t.prisma.productVariant.update({ where: { id: guji }, data: { stock: 3 } });
      await t.prisma.productVariant.update({ where: { id: guji1kg }, data: { stock: 0 } });
      await t.prisma.product.updateMany({
        where: { slug: 'drip-v60' },
        data: { status: 'ARCHIVED' },
      });

      const cart = cartOf(await b.get().expect(200));

      expect(cart.items.map((item) => [item.variantId, item.available, item.problem])).toEqual([
        [guji, false, { code: 'INSUFFICIENT_STOCK', message: 'Dostępne tylko 3 szt.' }],
        [guji1kg, false, { code: 'OUT_OF_STOCK', message: 'Produkt chwilowo niedostępny' }],
        [v60, false, { code: 'UNAVAILABLE', message: 'Produkt jest niedostępny' }],
      ]);
      expect(cart).toMatchObject({ itemCount: 0, subtotal: 0, total: 0, canCheckout: false });
    });

    it('count again once fixed', async () => {
      const b = browser();
      const itemId = cartOf(await b.add(guji, 4)).items[0]?.id ?? '';
      await b.add(v60, 1);
      await t.prisma.productVariant.update({ where: { id: guji }, data: { stock: 3 } });

      const fixed = cartOf(await b.update(itemId, 3).expect(200));

      expect(fixed).toMatchObject({ subtotal: 3 * 4900 + 2900, canCheckout: true });
    });

    it('can be deleted even when unavailable', async () => {
      const b = browser();
      const itemId = cartOf(await b.add(guji)).items[0]?.id ?? '';
      await t.prisma.product.update({ where: { id: gujiProductId }, data: { status: 'DRAFT' } });

      await b.update(itemId, 1).expect(409);
      const response = await b.remove(itemId).expect(200);

      expect(cartOf(response).items).toEqual([]);
    });
  });

  describe('logged-in customer', () => {
    it('keeps the cart by user id, without a cart cookie', async () => {
      const user = await createUser(t.prisma, { ...customer, role: 'CUSTOMER' });
      const b = browser();
      await login(b.agent);

      const response = await b.add(guji, 2).expect(200);

      expect(findSetCookie(response.headers, CART_COOKIE)).toBeNull();
      const cart = await t.prisma.cart.findUniqueOrThrow({ where: { userId: user.id } });
      expect(cart.guestToken).toBeNull();

      // The same cart from another device after logging in there
      const other = browser();
      await login(other.agent);
      expect(cartOf(await other.get()).items[0]?.quantity).toBe(2);
    });
  });

  describe('merging the guest cart on login', () => {
    it('adds up quantities of the same variant up to the stock and moves the rest', async () => {
      const user = await createUser(t.prisma, { ...customer, role: 'CUSTOMER' });
      const userCart = await t.prisma.cart.create({ data: { userId: user.id } });
      await t.prisma.cartItem.create({
        data: { cartId: userCart.id, variantId: guji, quantity: 4 },
      });
      const b = browser();
      await b.add(guji, 3);
      await b.add(v60, 2);

      const response = await login(b.agent);

      // The guest cart is gone and the browser is told to drop its cookie
      expect(findSetCookie(response.headers, CART_COOKIE)?.raw).toMatch(/Expires=Thu, 01 Jan 1970/);
      expect(await t.prisma.cart.count()).toBe(1);
      const cart = cartOf(await b.get());
      expect(cart.items.map((item) => [item.variantId, item.quantity])).toEqual([
        [guji, 5], // 4 + 3, capped at the stock of 5
        [v60, 2],
      ]);
    });

    it('moves the guest cart into a new account on registration', async () => {
      const b = browser();
      await b.add(v60, 3);

      const response = await b.agent
        .post('/api/v1/auth/register')
        .set('Origin', STOREFRONT_ORIGIN)
        .send({ ...customer, name: 'Jan' })
        .expect(201);

      expect(findSetCookie(response.headers, CART_COOKIE)?.raw).toMatch(/Expires=Thu, 01 Jan 1970/);
      const user = await t.prisma.user.findUniqueOrThrow({ where: { email: customer.email } });
      const cart = await t.prisma.cart.findUniqueOrThrow({
        where: { userId: user.id },
        include: { items: true },
      });
      expect(cart.items.map((item) => item.quantity)).toEqual([3]);
      expect(await t.prisma.cart.count()).toBe(1);
    });

    it('keeps a line the guest added that cannot be bought, flagged', async () => {
      await createUser(t.prisma, { ...customer, role: 'CUSTOMER' });
      const b = browser();
      await b.add(guji, 2);
      await t.prisma.productVariant.update({ where: { id: guji }, data: { isActive: false } });

      await login(b.agent);

      const cart = cartOf(await b.get());
      expect(cart.items[0]).toMatchObject({ quantity: 2, problem: { code: 'UNAVAILABLE' } });
    });

    it('does not touch the guest cart on an admin panel login', async () => {
      await createUser(t.prisma, { ...customer, role: 'ADMIN' });
      const b = browser();
      await b.add(v60);

      const response = await b.agent
        .post('/api/v1/admin/auth/login')
        .set('Origin', 'http://localhost:3001')
        .send(customer)
        .expect(200);

      expect(findSetCookie(response.headers, CART_COOKIE)).toBeNull();
      const cart = await t.prisma.cart.findFirstOrThrow();
      expect(cart.userId).toBeNull();
    });
  });
});
