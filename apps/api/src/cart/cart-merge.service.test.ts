import { describe, expect, it } from 'vitest';
import { mergedQuantity } from './cart-merge.service';

describe('mergedQuantity', () => {
  it('adds both quantities when the stock allows it', () => {
    expect(mergedQuantity(2, 3, 10)).toBe(5);
  });

  it('caps the sum at the stock', () => {
    expect(mergedQuantity(2, 3, 4)).toBe(4);
  });

  it('caps the sum at 99', () => {
    expect(mergedQuantity(60, 60, 500)).toBe(99);
  });

  it('never lowers what the user already had', () => {
    // The user cart already holds more than the stock; the guest part adds nothing
    expect(mergedQuantity(5, 2, 3)).toBe(5);
    expect(mergedQuantity(1, 4, 0)).toBe(1);
  });
});
