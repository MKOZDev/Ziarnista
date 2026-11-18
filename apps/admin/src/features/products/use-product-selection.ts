'use client';

import type { AdminProductListItem } from '@ziarnista/shared';
import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectionScope, type ProductListParams } from './product-list-params';
import {
  productSelectionChanged,
  productSelectionCleared,
  selectProductSelection,
  selectSelectionScope,
} from './product-selection-slice';

/**
 * The selection of the list described by `params`, with `rows` being its current page.
 * Changing filters, search or sort changes the scope, which empties the selection at once
 * (the selector) and for good (the effect), so Back to the old filters does not bring it back.
 */
export function useProductSelection(
  params: ProductListParams,
  rows: readonly AdminProductListItem[],
) {
  const dispatch = useAppDispatch();
  const scope = selectionScope(params);
  const storedScope = useAppSelector(selectSelectionScope);
  const items = useAppSelector((state) => selectProductSelection(state, scope));

  useEffect(() => {
    if (storedScope !== scope) dispatch(productSelectionCleared({ scope }));
  }, [dispatch, scope, storedScope]);

  const selectedIds = useMemo(() => new Set(Object.keys(items)), [items]);

  const setSelectedIds = useCallback(
    (ids: ReadonlySet<string>) => {
      const names = new Map(rows.map((row) => [row.id, row.name]));
      const next: Record<string, string> = {};
      for (const id of ids) {
        next[id] = items[id] ?? names.get(id) ?? id;
      }
      dispatch(productSelectionChanged({ scope, items: next }));
    },
    [dispatch, items, rows, scope],
  );

  const clear = useCallback(() => dispatch(productSelectionCleared({ scope })), [dispatch, scope]);

  const onPage = rows.filter((row) => row.id in items).length;

  return {
    items,
    selectedIds,
    setSelectedIds,
    clear,
    /** Selected, but not visible: the bar says so, so a bulk action never surprises */
    onOtherPages: selectedIds.size - onPage,
  };
}
