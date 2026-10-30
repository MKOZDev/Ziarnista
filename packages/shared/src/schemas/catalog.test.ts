import { describe, expect, it } from 'vitest';
import {
  CATALOG_DEFAULT_PAGE_SIZE,
  CATALOG_MAX_PAGE_SIZE,
  categoryNodeSchema,
  productListQuerySchema,
} from './catalog';

describe('productListQuerySchema', () => {
  it('applies defaults when params are missing', () => {
    expect(productListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: CATALOG_DEFAULT_PAGE_SIZE,
      sort: 'newest',
    });
  });

  it('parses a full query string', () => {
    expect(
      productListQuerySchema.parse({
        page: '2',
        pageSize: '48',
        category: 'kawa',
        kind: 'COFFEE',
        origin: 'etiopia',
        roastLevel: 'LIGHT',
        brewMethod: ['POUR_OVER', 'AEROPRESS'],
        priceMin: '3000',
        priceMax: '8000',
        q: '  Guji ',
        sort: 'price_asc',
      }),
    ).toEqual({
      page: 2,
      pageSize: 48,
      category: 'kawa',
      kind: 'COFFEE',
      origin: 'etiopia',
      roastLevel: 'LIGHT',
      brewMethod: ['POUR_OVER', 'AEROPRESS'],
      priceMin: 3000,
      priceMax: 8000,
      q: 'Guji',
      sort: 'price_asc',
    });
  });

  it('wraps a single brewMethod in an array', () => {
    expect(productListQuerySchema.parse({ brewMethod: 'MOKA' }).brewMethod).toEqual(['MOKA']);
  });

  it('accepts equal priceMin and priceMax', () => {
    expect(productListQuerySchema.safeParse({ priceMin: '5000', priceMax: '5000' }).success).toBe(
      true,
    );
  });

  it.each([
    { roastLevel: 'BLONDE' },
    { kind: 'coffee' },
    { brewMethod: ['ESPRESSO', 'SIPHON'] },
    { sort: 'price' },
    { pageSize: String(CATALOG_MAX_PAGE_SIZE + 1) },
    { page: '0' },
    { priceMin: '-1' },
    { priceMin: '12.5' },
    { priceMin: '9000', priceMax: '1000' },
    { category: 'Kawa Ziarnista' },
    { category: ['kawa', 'akcesoria'] },
    { q: '   ' },
    { q: 'x'.repeat(101) },
    { pricemin: '100' },
  ])('rejects invalid input %o', (input) => {
    expect(productListQuerySchema.safeParse(input).success).toBe(false);
  });
});

describe('categoryNodeSchema', () => {
  it('validates nested children', () => {
    const leaf = {
      id: '019a3b2c-0000-7000-8000-000000000002',
      slug: 'espresso',
      name: 'Espresso',
      productCount: 3,
      children: [],
    };
    const root = { ...leaf, id: '019a3b2c-0000-7000-8000-000000000001', children: [leaf] };
    expect(categoryNodeSchema.parse(root)).toEqual(root);
    expect(
      categoryNodeSchema.safeParse({ ...root, children: [{ ...leaf, productCount: -1 }] }).success,
    ).toBe(false);
  });
});
