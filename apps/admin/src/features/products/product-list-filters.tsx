'use client';

import { Button } from '@ziarnista/ui/button';
import { Combobox } from '@ziarnista/ui/combobox';
import { InputGroup } from '@ziarnista/ui/input-group';
import { Select } from '@ziarnista/ui/select';
import { ToggleChip } from '@ziarnista/ui/toggle-chip';
import {
  ADMIN_SEARCH_MAX_LENGTH,
  adminProductSortSchema,
  LOW_STOCK_THRESHOLD,
  productKindSchema,
  productStatusSchema,
} from '@ziarnista/shared';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { categoryOptions } from '@/features/catalog/category-options';
import { useGetCategoriesQuery } from '@/features/catalog/catalog-api';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { KIND_LABELS, SORT_LABELS, STATUS_LABELS } from './product-labels';
import { clearedFilters, hasActiveFilters, type ProductListParams } from './product-list-params';
import type { ParamsUpdateOptions } from './use-product-list-params';

export const SEARCH_DEBOUNCE_MS = 300;

/** What the API accepts as q: trimmed, without empty text */
function toQuery(text: string): string | undefined {
  const query = text.trim();
  return query === '' ? undefined : query;
}

type SearchFilterProps = {
  value: string | undefined;
  onSearch: (q: string | undefined) => void;
};

function SearchFilter({ value, onSearch }: SearchFilterProps) {
  const [text, setText] = useState(value ?? '');
  const debounced = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);

  // URL → input, when the query changes from outside: Back, "Wyczyść filtry".
  // Skipped when it already matches, so a trailing space being typed is not removed.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (toQuery(text) !== value) setText(value ?? '');
  }

  // Input → URL, once typing has paused. `debounced === text` skips a stale debounced value
  // left over from before the URL changed from outside, which would bring the old query back.
  useEffect(() => {
    const query = toQuery(debounced);
    if (debounced === text && query !== value) {
      onSearch(query);
    }
  }, [debounced, text, value, onSearch]);

  return (
    <InputGroup
      type="search"
      aria-label="Szukaj produktów"
      placeholder="Nazwa, slug lub SKU"
      maxLength={ADMIN_SEARCH_MAX_LENGTH}
      start={<Search aria-hidden />}
      value={text}
      onChange={(event) => setText(event.target.value)}
      className="w-full sm:w-72"
    />
  );
}

export type ProductListFiltersProps = {
  params: ProductListParams;
  onChange: (change: Partial<ProductListParams>, options?: ParamsUpdateOptions) => void;
};

export function ProductListFilters({ params, onChange }: ProductListFiltersProps) {
  const categories = useGetCategoriesQuery();
  const options = useMemo(() => categoryOptions(categories.data ?? []), [categories.data]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchFilter
        value={params.q}
        // replace: one Back step should undo the search, not each pause in typing
        onSearch={(q) => onChange({ q }, { history: 'replace' })}
      />
      <Select
        size="md"
        aria-label="Status"
        className="w-auto"
        value={params.status ?? ''}
        onChange={(event) =>
          onChange({ status: productStatusSchema.safeParse(event.target.value).data })
        }
      >
        <option value="">Wszystkie statusy</option>
        {productStatusSchema.options.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
      <Select
        size="md"
        aria-label="Rodzaj"
        className="w-auto"
        value={params.kind ?? ''}
        onChange={(event) =>
          onChange({ kind: productKindSchema.safeParse(event.target.value).data })
        }
      >
        <option value="">Wszystkie rodzaje</option>
        {productKindSchema.options.map((kind) => (
          <option key={kind} value={kind}>
            {KIND_LABELS[kind]}
          </option>
        ))}
      </Select>
      <Combobox
        size="md"
        aria-label="Kategoria"
        placeholder="Wszystkie kategorie"
        className="w-full sm:w-56"
        options={options}
        loading={categories.isLoading}
        emptyMessage={categories.isError ? 'Nie udało się wczytać kategorii' : 'Brak kategorii'}
        value={params.categoryId ?? null}
        onValueChange={(categoryId) => onChange({ categoryId: categoryId ?? undefined })}
      />
      <ToggleChip
        pressed={params.lowStock === true}
        title={`Aktywny wariant poniżej ${LOW_STOCK_THRESHOLD} szt.`}
        onPressedChange={(pressed) => onChange({ lowStock: pressed ? true : undefined })}
      >
        Niski stan
      </ToggleChip>
      {hasActiveFilters(params) && (
        <Button variant="ghost" onClick={() => onChange(clearedFilters())}>
          Wyczyść filtry
        </Button>
      )}
      <Select
        size="md"
        aria-label="Sortowanie"
        className="w-auto sm:ml-auto"
        value={params.sort}
        onChange={(event) => {
          const sort = adminProductSortSchema.safeParse(event.target.value);
          if (sort.success) onChange({ sort: sort.data });
        }}
      >
        {adminProductSortSchema.options.map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABELS[sort]}
          </option>
        ))}
      </Select>
    </div>
  );
}
