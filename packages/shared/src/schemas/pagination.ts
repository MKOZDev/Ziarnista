import { z } from 'zod';

export const PAGINATION_DEFAULT_PAGE_SIZE = 20;
export const PAGINATION_MAX_PAGE_SIZE = 100;

type PaginationOptions = { defaultPageSize: number; maxPageSize: number };

/**
 * Offset pagination params (?page=2&pageSize=24). Every list endpoint uses the same names;
 * only the default and maximum page size differ (e.g. the catalog caps it at 48).
 * Query params arrive as strings, hence z.coerce.
 */
export function paginationQuery({ defaultPageSize, maxPageSize }: PaginationOptions) {
  return z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(maxPageSize).default(defaultPageSize),
  });
}

export const paginationQuerySchema = paginationQuery({
  defaultPageSize: PAGINATION_DEFAULT_PAGE_SIZE,
  maxPageSize: PAGINATION_MAX_PAGE_SIZE,
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Response body of a paginated list; a page past the end is valid and has no items. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  });
}

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** 0 when there are no results, so "page 1 of 0" never shows an empty page as existing. */
export function pageCount(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}
