'use client';

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Checkbox } from './checkbox';
import { Skeleton } from './skeleton';

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Makes the column sortable; the value is what the API expects */
  sortKey?: string;
  align?: 'start' | 'end';
  /** Any CSS width, e.g. "120px" */
  width?: string;
};

export type SortState = { key: string; direction: 'asc' | 'desc' };

export type DataTableSelection<T> = {
  selectedIds: ReadonlySet<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  /** Names the row's checkbox for screen readers */
  getRowLabel: (row: T) => string;
};

export type DataTableProps<T> = {
  /** Names the table for screen readers */
  caption: string;
  columns: readonly Column<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  density?: 'comfortable' | 'compact';
  sort?: SortState | null;
  onSortChange?: (sort: SortState) => void;
  selection?: DataTableSelection<T>;
  status?: 'ready' | 'loading' | 'refreshing' | 'error';
  skeletonRows?: number;
  emptyState?: ReactNode;
  errorState?: ReactNode;
  className?: string;
};

const ROW_HEIGHT = {
  comfortable: 'h-15',
  compact: 'h-11',
};

const ALIGN = {
  start: 'text-left',
  end: 'text-right',
};

function SortIcon({ direction }: { direction: SortState['direction'] | undefined }) {
  if (direction === 'asc') return <ArrowUp aria-hidden className="size-3.5" />;
  if (direction === 'desc') return <ArrowDown aria-hidden className="size-3.5" />;
  return <ChevronsUpDown aria-hidden className="size-3.5 opacity-60" />;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  density = 'comfortable',
  sort,
  onSortChange,
  selection,
  status = 'ready',
  skeletonRows = 6,
  emptyState,
  errorState,
  className,
}: DataTableProps<T>) {
  const isBusy = status === 'loading' || status === 'refreshing';
  const columnCount = columns.length + (selection ? 1 : 0);
  const showsMessage = status === 'error' || (status !== 'loading' && rows.length === 0);

  const pageIds = rows.map(getRowId);
  // Other pages are deliberately ignored: the header checkbox only describes what is visible
  const selectedOnPage = pageIds.filter((id) => selection?.selectedIds.has(id)).length;
  const isPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;

  function togglePage() {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    for (const id of pageIds) {
      if (isPageSelected) next.delete(id);
      else next.add(id);
    }
    selection.onSelectedIdsChange(next);
  }

  function toggleRow(id: string) {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    if (!next.delete(id)) next.add(id);
    selection.onSelectedIdsChange(next);
  }

  function toggleSort(key: string) {
    const direction = sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange?.({ key, direction });
  }

  return (
    <div data-slot="data-table" className={cn('relative overflow-x-auto', className)}>
      <div role="status" className="sr-only">
        {isBusy ? 'Wczytywanie danych…' : ''}
      </div>
      {/* A bar, not dimmed rows: fading the text would break its contrast (WCAG 1.4.3) */}
      {status === 'refreshing' && (
        <div
          aria-hidden
          data-slot="refresh-indicator"
          className="absolute inset-x-0 top-0 h-0.5 animate-skeleton bg-primary"
        />
      )}
      <table aria-busy={isBusy || undefined} className="w-full border-collapse text-body">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          {selection && <col style={{ width: '44px' }} />}
          {columns.map((column) => (
            <col key={column.id} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {selection && (
              <th scope="col" className="h-10 border-b bg-muted pl-4">
                <span className="flex">
                  <Checkbox
                    aria-label="Zaznacz wszystkie na stronie"
                    disabled={status === 'loading' || rows.length === 0}
                    checked={isPageSelected ? true : selectedOnPage > 0 ? 'indeterminate' : false}
                    onCheckedChange={togglePage}
                  />
                </span>
              </th>
            )}
            {columns.map((column) => {
              const direction = sort?.key === column.sortKey ? sort?.direction : undefined;
              const align = column.align ?? 'start';
              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={
                    direction ? (direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                  className={cn(
                    'h-10 border-b bg-muted px-4 text-caption font-semibold tracking-[0.04em] whitespace-nowrap text-muted-foreground uppercase',
                    ALIGN[align],
                  )}
                >
                  {column.sortKey ? (
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-1 rounded-sm font-[inherit] tracking-[inherit] uppercase hover:text-foreground"
                      onClick={() => toggleSort(column.sortKey as string)}
                    >
                      {column.header}
                      <SortIcon direction={direction} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {status === 'loading' &&
            Array.from({ length: skeletonRows }, (_, index) => (
              <tr key={index} className={cn('border-b last:border-b-0', ROW_HEIGHT[density])}>
                {selection && <td className="pl-4" />}
                {columns.map((column) => (
                  <td key={column.id} className="px-4">
                    <Skeleton shape="line" />
                  </td>
                ))}
              </tr>
            ))}

          {showsMessage && (
            <tr>
              <td colSpan={columnCount} className="p-0">
                {status === 'error' ? errorState : emptyState}
              </td>
            </tr>
          )}

          {!showsMessage &&
            status !== 'loading' &&
            rows.map((row) => {
              const id = getRowId(row);
              const isSelected = selection?.selectedIds.has(id) ?? false;
              return (
                <tr
                  key={id}
                  className={cn(
                    'border-b transition-colors duration-(--duration-fast) last:border-b-0',
                    ROW_HEIGHT[density],
                    // Separate hover colors, so hovering never hides that a row is selected
                    isSelected ? 'bg-primary-soft hover:bg-primary-soft/70' : 'hover:bg-muted',
                  )}
                >
                  {selection && (
                    <td className="pl-4">
                      <span className="flex">
                        <Checkbox
                          aria-label={`Zaznacz: ${selection.getRowLabel(row)}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(id)}
                        />
                      </span>
                    </td>
                  )}
                  {columns.map((column) => {
                    const align = column.align ?? 'start';
                    return (
                      <td
                        key={column.id}
                        className={cn('px-4', ALIGN[align], align === 'end' && 'tabular-nums')}
                      >
                        {column.cell(row)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
