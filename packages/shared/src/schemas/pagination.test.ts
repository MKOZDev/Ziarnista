import { describe, expect, it } from 'vitest';
import {
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
  pageCount,
  paginationQuery,
  paginationQuerySchema,
} from './pagination';

describe('paginationQuerySchema', () => {
  it('applies defaults when params are missing', () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: PAGINATION_DEFAULT_PAGE_SIZE,
    });
  });

  it('coerces numeric strings from the query string', () => {
    expect(paginationQuerySchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it.each([
    { page: '0' },
    { page: '1.5' },
    { page: 'abc' },
    { pageSize: '0' },
    { pageSize: String(PAGINATION_MAX_PAGE_SIZE + 1) },
  ])('rejects invalid input %o', (input) => {
    expect(paginationQuerySchema.safeParse(input).success).toBe(false);
  });
});

describe('paginationQuery', () => {
  it('uses the given default and maximum page size', () => {
    const schema = paginationQuery({ defaultPageSize: 24, maxPageSize: 48 });
    expect(schema.parse({})).toEqual({ page: 1, pageSize: 24 });
    expect(schema.safeParse({ pageSize: '48' }).success).toBe(true);
    expect(schema.safeParse({ pageSize: '49' }).success).toBe(false);
  });
});

describe('pageCount', () => {
  it.each([
    { total: 0, pageSize: 24, expected: 0 },
    { total: 1, pageSize: 24, expected: 1 },
    { total: 24, pageSize: 24, expected: 1 },
    { total: 25, pageSize: 24, expected: 2 },
  ])('$total items / $pageSize per page = $expected pages', ({ total, pageSize, expected }) => {
    expect(pageCount(total, pageSize)).toBe(expected);
  });
});
