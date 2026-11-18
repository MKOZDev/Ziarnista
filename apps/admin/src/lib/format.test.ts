import { describe, expect, it } from 'vitest';
import { formatPrice } from './format';

// Intl puts non-breaking spaces in; compared as plain spaces to keep the tests readable
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('formatPrice', () => {
  it.each([
    [4990, '49,90 zł'],
    [5, '0,05 zł'],
    [123450, '1234,50 zł'],
    [1234500, '12 345,00 zł'],
  ])('formats %i grosze as %s', (grosze, text) => {
    expect(plain(formatPrice(grosze))).toBe(text);
  });
});
