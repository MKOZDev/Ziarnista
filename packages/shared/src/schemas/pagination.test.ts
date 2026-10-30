import { describe, expect, it } from 'vitest';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
  paginationQuerySchema,
} from './pagination';

describe('paginationQuerySchema', () => {
  it('applies defaults when params are missing', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: PAGINATION_DEFAULT_LIMIT });
  });

  it('coerces numeric strings from the query string', () => {
    expect(paginationQuerySchema.parse({ page: '3', limit: '50' })).toEqual({ page: 3, limit: 50 });
  });

  it.each([
    { page: '0' },
    { page: '1.5' },
    { page: 'abc' },
    { limit: '0' },
    { limit: String(PAGINATION_MAX_LIMIT + 1) },
  ])('rejects invalid input %o', (input) => {
    expect(paginationQuerySchema.safeParse(input).success).toBe(false);
  });
});
