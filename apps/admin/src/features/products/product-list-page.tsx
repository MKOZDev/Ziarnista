'use client';

import { Button } from '@ziarnista/ui/button';
import { Card } from '@ziarnista/ui/card';
import type { DataTableProps } from '@ziarnista/ui/data-table';
import { EmptyState } from '@ziarnista/ui/empty-state';
import { PageHeader } from '@ziarnista/ui/page-header';
import { Pagination } from '@ziarnista/ui/pagination';
import type { AdminProductListItem, AdminProductListResponse } from '@ziarnista/shared';
import { Plus, SearchX } from 'lucide-react';
import Link from 'next/link';
import { ApiErrorState } from '@/components/api-error-state';
import { ProductBulkActions } from './product-bulk-actions';
import { ProductListFilters } from './product-list-filters';
import {
  clearedFilters,
  columnToSort,
  hasActiveFilters,
  sortToColumn,
  type ProductListParams,
} from './product-list-params';
import { ProductTable } from './product-table';
import { useGetProductsQuery } from './products-api';
import { useProductListParams } from './use-product-list-params';
import { useProductSelection } from './use-product-selection';

const EMPTY_ROWS: AdminProductListItem[] = [];

type TableStatus = NonNullable<DataTableProps<unknown>['status']>;

type ListQueryState = {
  data?: AdminProductListResponse;
  currentData?: AdminProductListResponse;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
};

/**
 * While new params load, the previous rows stay visible under a progress bar ("refreshing"),
 * so the table does not jump. Previous rows that were empty would show the empty state for
 * filters that no longer apply, so then it is a skeleton instead.
 */
function tableStatus({ data, currentData, isLoading, isFetching, isError }: ListQueryState) {
  const status: TableStatus = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : !isFetching
        ? 'ready'
        : currentData === undefined && data?.items.length === 0
          ? 'loading'
          : 'refreshing';
  return status;
}

type EmptyStateProps = {
  params: ProductListParams;
  total: number;
  onChange: (change: Partial<ProductListParams>) => void;
};

/** Three different situations, each with its own way out */
function ProductListEmpty({ params, total, onChange }: EmptyStateProps) {
  if (total > 0) {
    // e.g. an old link to page 9 after products were archived
    return (
      <EmptyState
        plain
        title="Ta strona jest pusta"
        description="Lista ma mniej stron niż w adresie."
        action={<Button onClick={() => onChange({ page: 1 })}>Przejdź na pierwszą stronę</Button>}
      />
    );
  }
  if (hasActiveFilters(params)) {
    return (
      <EmptyState
        plain
        icon={<SearchX />}
        title="Brak produktów spełniających kryteria"
        description="Zmień wyszukiwanie lub filtry."
        action={
          <Button variant="secondary" onClick={() => onChange(clearedFilters())}>
            Wyczyść filtry
          </Button>
        }
      />
    );
  }
  return (
    <EmptyState
      plain
      title="Nie masz jeszcze produktów"
      description="Dodaj pierwszą kawę lub akcesorium. Produkt zapisze się jako szkic."
      action={
        <Button asChild>
          <Link href="/products/new">
            <Plus aria-hidden />
            Dodaj produkt
          </Link>
        </Button>
      }
    />
  );
}

export function ProductListPage() {
  const { params, setParams } = useProductListParams();
  const query = useGetProductsQuery(params);
  const { data, error, refetch } = query;
  const rows = data?.items ?? EMPTY_ROWS;
  const selection = useProductSelection(params, rows);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Produkty"
        actions={
          <Button asChild>
            <Link href="/products/new">
              <Plus aria-hidden />
              Dodaj produkt
            </Link>
          </Button>
        }
      />
      <ProductListFilters params={params} onChange={setParams} />
      <Card padding="none" className="overflow-hidden">
        <ProductBulkActions
          selection={selection.items}
          onOtherPages={selection.onOtherPages}
          onClear={selection.clear}
        />
        <ProductTable
          rows={rows}
          selection={{
            selectedIds: selection.selectedIds,
            onSelectedIdsChange: selection.setSelectedIds,
            getRowLabel: (product) => product.name,
          }}
          status={tableStatus(query)}
          sort={sortToColumn(params.sort)}
          onSortChange={(sort) => setParams({ sort: columnToSort(sort) })}
          emptyState={
            <ProductListEmpty params={params} total={data?.total ?? 0} onChange={setParams} />
          }
          errorState={<ApiErrorState error={error} onRetry={() => void refetch()} />}
        />
      </Card>
      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={(page) => setParams({ page })}
        />
      )}
    </div>
  );
}
