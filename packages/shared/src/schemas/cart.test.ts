import { describe, expect, it } from 'vitest';
import {
  addCartItemSchema,
  calculateTotals,
  cartLineProblem,
  maxCartQuantity,
  updateCartItemSchema,
} from './cart';

describe('calculateTotals', () => {
  it('charges 14,99 zł below 150 zł', () => {
    expect(calculateTotals(14_999)).toEqual({
      subtotal: 14_999,
      shippingCost: 1499,
      total: 16_498,
      amountToFreeShipping: 1,
    });
  });

  it('ships for free from exactly 150 zł', () => {
    expect(calculateTotals(15_000)).toEqual({
      subtotal: 15_000,
      shippingCost: 0,
      total: 15_000,
      amountToFreeShipping: 0,
    });
  });

  it('charges nothing for an empty cart', () => {
    expect(calculateTotals(0)).toMatchObject({ shippingCost: 0, total: 0 });
  });
});

const sellable = { variantActive: true, productStatus: 'ACTIVE' as const, stock: 5 };

describe('cartLineProblem', () => {
  it('accepts a line within the stock', () => {
    expect(cartLineProblem({ ...sellable, quantity: 5 })).toBeNull();
  });

  it.each([
    ['an inactive variant', { variantActive: false }, 'UNAVAILABLE'],
    ['a draft product', { productStatus: 'DRAFT' as const }, 'UNAVAILABLE'],
    [
      'an archived product with no stock',
      { productStatus: 'ARCHIVED' as const, stock: 0 },
      'UNAVAILABLE',
    ],
    ['no stock', { stock: 0 }, 'OUT_OF_STOCK'],
    ['less stock than the quantity', { stock: 2 }, 'INSUFFICIENT_STOCK'],
  ])('flags %s', (_, override, code) => {
    expect(cartLineProblem({ ...sellable, quantity: 3, ...override })?.code).toBe(code);
  });

  it('tells how many are left', () => {
    expect(cartLineProblem({ ...sellable, stock: 2, quantity: 3 })?.message).toBe(
      'Dostępne tylko 2 szt.',
    );
  });
});

describe('maxCartQuantity', () => {
  it('is the stock, capped at 99, and 0 when the variant cannot be bought', () => {
    expect(maxCartQuantity(sellable)).toBe(5);
    expect(maxCartQuantity({ ...sellable, stock: 500 })).toBe(99);
    expect(maxCartQuantity({ ...sellable, variantActive: false })).toBe(0);
    expect(maxCartQuantity({ ...sellable, stock: -1 })).toBe(0);
  });
});

describe('cart item schemas', () => {
  const VARIANT = '01923456-789a-7bcd-8ef0-123456789abc';

  it('adds one unit by default', () => {
    expect(addCartItemSchema.parse({ variantId: VARIANT })).toEqual({
      variantId: VARIANT,
      quantity: 1,
    });
  });

  it('accepts 1 to 99 whole units', () => {
    expect(updateCartItemSchema.safeParse({ quantity: 99 }).success).toBe(true);
    for (const quantity of [0, 100, 1.5, '2']) {
      expect(updateCartItemSchema.safeParse({ quantity }).success).toBe(false);
    }
  });
});
