import { describe, expect, it } from 'vitest';
import { computeMinPrice } from './min-price';

describe('computeMinPrice', () => {
  it('returns the lowest price among active variants', () => {
    const variants = [
      { price: 5900, isActive: true },
      { price: 4900, isActive: true },
      { price: 19900, isActive: true },
    ];
    expect(computeMinPrice(variants)).toBe(4900);
  });

  it('ignores inactive variants even when they are cheaper', () => {
    const variants = [
      { price: 1000, isActive: false },
      { price: 4900, isActive: true },
    ];
    expect(computeMinPrice(variants)).toBe(4900);
  });

  it('allows a free variant', () => {
    expect(computeMinPrice([{ price: 0, isActive: true }])).toBe(0);
  });

  it.each([
    { case: 'no variants', variants: [] },
    { case: 'only inactive variants', variants: [{ price: 4900, isActive: false }] },
  ])('returns null for $case', ({ variants }) => {
    expect(computeMinPrice(variants)).toBeNull();
  });
});
