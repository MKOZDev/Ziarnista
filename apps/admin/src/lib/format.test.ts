import { describe, expect, it } from 'vitest';
import { formatCount, formatPrice } from './format';

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

describe('formatCount', () => {
  const products = { one: 'produkt', few: 'produkty', many: 'produktów' };

  it.each([
    [1, '1 produkt'],
    [2, '2 produkty'],
    [4, '4 produkty'],
    [5, '5 produktów'],
    [12, '12 produktów'],
    [22, '22 produkty'],
    [0, '0 produktów'],
  ])('%i → %s', (count, text) => {
    expect(formatCount(count, products)).toBe(text);
  });
});
