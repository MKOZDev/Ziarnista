import { describe, expect, it } from 'vitest';
import { countPl, type PolishForms } from './plural-pl';

const PRODUCTS: PolishForms = ['produkt', 'produkty', 'produktów'];

describe('countPl', () => {
  it.each([
    [0, '0 produktów'],
    [1, '1 produkt'],
    [2, '2 produkty'],
    [4, '4 produkty'],
    [5, '5 produktów'],
    [12, '12 produktów'],
    [14, '14 produktów'],
    [21, '21 produktów'],
    [22, '22 produkty'],
    [112, '112 produktów'],
    [124, '124 produkty'],
  ])('%i → %s', (count, expected) => {
    expect(countPl(count, PRODUCTS)).toBe(expected);
  });
});
