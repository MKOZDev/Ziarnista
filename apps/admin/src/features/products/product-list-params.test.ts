import { describe, expect, it } from 'vitest';
import {
  clearedFilters,
  columnToSort,
  hasActiveFilters,
  nextProductListParams,
  parseProductListParams,
  serializeProductListParams,
  sortToColumn,
  type ProductListParams,
} from './product-list-params';

const CATEGORY_ID = '01923456-789a-7bcd-8ef0-123456789abc';
const DEFAULTS: ProductListParams = { page: 1, pageSize: 20, sort: 'updated' };

const parse = (query: string) => parseProductListParams(new URLSearchParams(query));

describe('parseProductListParams', () => {
  it('reads every param with the API schema', () => {
    expect(
      parse(
        `q=guji&status=DRAFT&kind=COFFEE&categoryId=${CATEGORY_ID}&lowStock=true&sort=price_desc&page=3`,
      ),
    ).toEqual({
      ...DEFAULTS,
      q: 'guji',
      status: 'DRAFT',
      kind: 'COFFEE',
      categoryId: CATEGORY_ID,
      lowStock: true,
      sort: 'price_desc',
      page: 3,
    });
  });

  it('falls back to the default for each invalid param, keeping the valid ones', () => {
    expect(
      parse('status=PUBLISHED&page=-1&sort=random&categoryId=kawa&lowStock=yes&kind=COFFEE'),
    ).toEqual({ ...DEFAULTS, kind: 'COFFEE' });
  });

  it('ignores unknown params and blank search', () => {
    expect(parse('utm_source=newsletter&q=%20%20')).toEqual(DEFAULTS);
  });
});

describe('serializeProductListParams', () => {
  it('leaves defaults out, so the default view is a bare /products', () => {
    expect(serializeProductListParams(DEFAULTS).toString()).toBe('');
  });

  it('round-trips through the URL', () => {
    const params: ProductListParams = {
      ...DEFAULTS,
      q: 'kenia aa',
      status: 'ACTIVE',
      lowStock: true,
      sort: 'name_desc',
      page: 2,
    };

    const query = serializeProductListParams(params).toString();

    expect(query).toBe('page=2&q=kenia+aa&status=ACTIVE&lowStock=true&sort=name_desc');
    expect(parse(query)).toEqual(params);
  });
});

describe('nextProductListParams', () => {
  const onPage3: ProductListParams = { ...DEFAULTS, page: 3, status: 'DRAFT' };

  it('goes back to page 1 when anything but the page changes', () => {
    expect(nextProductListParams(onPage3, { kind: 'ACCESSORY' })).toEqual({
      ...onPage3,
      kind: 'ACCESSORY',
      page: 1,
    });
    expect(nextProductListParams(onPage3, { sort: 'name' }).page).toBe(1);
  });

  it('keeps the filters when changing the page', () => {
    expect(nextProductListParams(onPage3, { page: 4 })).toEqual({ ...onPage3, page: 4 });
  });

  it('clears all filters but keeps the sort', () => {
    const filtered: ProductListParams = { ...onPage3, q: 'x', lowStock: true, sort: 'name' };

    const next = nextProductListParams(filtered, clearedFilters());

    expect(hasActiveFilters(next)).toBe(false);
    expect(serializeProductListParams(next).toString()).toBe('sort=name');
  });
});

describe('sort ↔ column', () => {
  it.each([
    ['name', { key: 'name', direction: 'asc' }],
    ['name_desc', { key: 'name', direction: 'desc' }],
    ['price_asc', { key: 'price', direction: 'asc' }],
    ['price_desc', { key: 'price', direction: 'desc' }],
  ] as const)('maps %s both ways', (sort, column) => {
    expect(sortToColumn(sort)).toEqual(column);
    expect(columnToSort(column)).toBe(sort);
  });

  it('marks no column for orders without one', () => {
    expect(sortToColumn('updated')).toBeNull();
    expect(sortToColumn('newest')).toBeNull();
  });
});
