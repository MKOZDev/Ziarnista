import { describe, expect, it } from 'vitest';
import {
  adminProductListQuerySchema,
  createProductSchema,
  createVariantSchema,
  updateProductSchema,
} from './admin-products';

const CATEGORY_ID = '01923456-789a-7bcd-8ef0-123456789abc';
const ORIGIN_ID = '01923456-789a-7bcd-8ef0-123456789abd';

const variant = { sku: 'eth-guji-250-z', label: '250 g / ziarno', price: 4900, stock: 10 };

const coffee = {
  kind: 'COFFEE',
  name: 'Etiopia Guji',
  categoryId: CATEGORY_ID,
  originId: ORIGIN_ID,
  roastLevel: 'LIGHT',
  variants: [variant],
};

function issuePaths(result: { error?: { issues: { path: PropertyKey[] }[] } }): string[] {
  return (result.error?.issues ?? []).map((issue) => issue.path.join('.'));
}

describe('createProductSchema', () => {
  it('applies defaults and normalizes the SKU to uppercase', () => {
    expect(createProductSchema.parse(coffee)).toEqual({
      ...coffee,
      description: '',
      metaTitle: null,
      metaDescription: null,
      flavorNotes: [],
      brewMethods: [],
      variants: [{ ...variant, sku: 'ETH-GUJI-250-Z', isActive: true }],
    });
  });

  it('lets an accessory leave out the coffee fields', () => {
    const accessory = createProductSchema.parse({
      kind: 'ACCESSORY',
      name: 'Drip V60',
      categoryId: CATEGORY_ID,
      variants: [variant],
    });

    expect(accessory).toMatchObject({ originId: null, roastLevel: null });
  });

  it('requires origin and roast level for a coffee', () => {
    const result = createProductSchema.safeParse({ ...coffee, originId: null, roastLevel: null });

    expect(issuePaths(result)).toEqual(['originId', 'roastLevel']);
  });

  it('requires at least one variant', () => {
    expect(issuePaths(createProductSchema.safeParse({ ...coffee, variants: [] }))).toEqual([
      'variants',
    ]);
  });

  it('reports a SKU repeated within the request on the repeated variant', () => {
    const result = createProductSchema.safeParse({
      ...coffee,
      variants: [variant, { ...variant, sku: 'ETH-GUJI-250-Z', label: 'inna' }],
    });

    expect(issuePaths(result)).toEqual(['variants.1.sku']);
  });

  it('stores empty meta fields as null', () => {
    const result = createProductSchema.parse({ ...coffee, metaTitle: '  ', metaDescription: '' });

    expect(result).toMatchObject({ metaTitle: null, metaDescription: null });
  });

  it('rejects a status: new products always start as drafts', () => {
    expect(createProductSchema.safeParse({ ...coffee, status: 'ACTIVE' }).success).toBe(false);
  });
});

describe('createVariantSchema', () => {
  it.each([
    ['a fractional price', { price: 49.9 }],
    ['a zero price', { price: 0 }],
    ['a negative stock', { stock: -1 }],
    ['a SKU with spaces', { sku: 'ETH GUJI' }],
    ['an empty label', { label: ' ' }],
  ])('rejects %s', (_, override) => {
    expect(createVariantSchema.safeParse({ ...variant, ...override }).success).toBe(false);
  });
});

describe('updateProductSchema', () => {
  it('keeps only the fields that were sent', () => {
    expect(updateProductSchema.parse({ status: 'ACTIVE', originId: null })).toEqual({
      status: 'ACTIVE',
      originId: null,
    });
  });

  it('does not accept variants', () => {
    expect(updateProductSchema.safeParse({ variants: [variant] }).success).toBe(false);
  });
});

describe('adminProductListQuerySchema', () => {
  it('defaults to the most recently updated products, 20 per page', () => {
    expect(adminProductListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      sort: 'updated',
    });
  });

  it('rejects unknown params', () => {
    expect(adminProductListQuerySchema.safeParse({ category: 'kawa' }).success).toBe(false);
  });
});
