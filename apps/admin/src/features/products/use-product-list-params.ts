'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  nextProductListParams,
  parseProductListParams,
  serializeProductListParams,
  type ProductListParams,
} from './product-list-params';

export type ParamsUpdateOptions = {
  /**
   * "replace" for changes that should not get their own Back step, such as each debounced
   * search; "push" (default) for deliberate steps: a filter, a page, a sort.
   */
  history?: 'push' | 'replace';
};

/** Reads the list state from the URL and changes it by navigating, so Back and links work. */
export function useProductListParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = useMemo(
    () => parseProductListParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setParams = useCallback(
    (change: Partial<ProductListParams>, { history = 'push' }: ParamsUpdateOptions = {}) => {
      const query = serializeProductListParams(nextProductListParams(params, change)).toString();
      const href = query === '' ? pathname : `${pathname}?${query}`;
      // scroll: false keeps the filters in view; Next.js scrolls to the top by default
      router[history](href, { scroll: false });
    },
    [params, pathname, router],
  );

  return { params, setParams };
}
