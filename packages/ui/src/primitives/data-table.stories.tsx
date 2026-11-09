import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, within } from 'storybook/test';
import { DataTable, type Column, type DataTableProps, type SortState } from './data-table';

// Acceptance tests for DataTable: sorting, paging and selection stay with the parent

type Product = { id: string; name: string; status: string; stock: number };

const PRODUCTS: Product[] = [
  { id: 'a', name: 'Etiopia Guji', status: 'Aktywny', stock: 42 },
  { id: 'b', name: 'Kenia AA', status: 'Szkic', stock: 3 },
  { id: 'c', name: 'Kolumbia Huila', status: 'Aktywny', stock: 17 },
];

const COLUMNS: Column<Product>[] = [
  {
    id: 'name',
    header: 'Produkt',
    sortKey: 'name',
    cell: (row) => <a href={`#${row.id}`}>{row.name}</a>,
  },
  { id: 'status', header: 'Status', cell: (row) => row.status, width: '140px' },
  { id: 'stock', header: 'Stan', sortKey: 'stock', align: 'end', cell: (row) => row.stock },
];

type HarnessProps = Omit<DataTableProps<Product>, 'selection'> & {
  selectable?: boolean;
  initialSelection?: string[];
  onSelect?: (ids: Set<string>) => void;
};

function Harness({
  selectable = false,
  initialSelection = [],
  onSelect,
  sort: initialSort = null,
  onSortChange,
  ...props
}: HarnessProps) {
  const [sort, setSort] = useState<SortState | null>(initialSort);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set(initialSelection));
  return (
    <>
      <DataTable
        {...props}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          onSortChange?.(next);
        }}
        selection={
          selectable
            ? {
                selectedIds,
                getRowLabel: (row) => row.name,
                onSelectedIdsChange: (ids) => {
                  setSelectedIds(ids);
                  onSelect?.(ids);
                },
              }
            : undefined
        }
      />
      <span data-testid="selected">{[...selectedIds].sort().join(',')}</span>
    </>
  );
}

const meta = {
  title: 'Composites/DataTable',
  component: Harness,
  args: {
    caption: 'Produkty',
    columns: COLUMNS,
    rows: PRODUCTS,
    getRowId: (row) => row.id,
    onSortChange: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof Harness>;

export default meta;

type Story = StoryObj<typeof meta>;

const body = () => within(document.body).getAllByRole('rowgroup')[1] as HTMLElement;

export const SemanticTable: Story = {
  play: async ({ canvas, canvasElement }) => {
    const table = canvas.getByRole('table', { name: 'Produkty' });
    await expect(table.tagName).toBe('TABLE');
    await expect(canvas.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Produkt',
      'Status',
      'Stan',
    ]);
    await expect(within(body()).getAllByRole('row')).toHaveLength(3);
    await expect(canvas.getByRole('cell', { name: 'Kenia AA' })).toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: 'Status' })).toHaveAttribute(
      'scope',
      'col',
    );
    await expect(canvasElement.querySelectorAll('colgroup col')[1]).toHaveStyle({ width: '140px' });
  },
};

export const CellsRenderAnyContent: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Kenia AA' })).toHaveAttribute('href', '#b');
  },
};

export const AlignedColumn: Story = {
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByRole('cell', { name: '42' })).textAlign).toBe(
      'right',
    );
    await expect(
      getComputedStyle(canvas.getByRole('columnheader', { name: 'Stan' })).textAlign,
    ).toBe('right');
  },
};

export const OnlySortableColumnsHaveButtons: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Produkt' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Status' })).not.toBeInTheDocument();
  },
};

export const SortingCycle: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const name = canvas.getByRole('columnheader', { name: 'Produkt' });
    const stock = canvas.getByRole('columnheader', { name: 'Stan' });
    await expect(name).not.toHaveAttribute('aria-sort');

    await userEvent.click(canvas.getByRole('button', { name: 'Produkt' }));
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'asc' });
    await expect(name).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(canvas.getByRole('button', { name: 'Produkt' }));
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'desc' });
    await expect(name).toHaveAttribute('aria-sort', 'descending');

    await userEvent.click(canvas.getByRole('button', { name: 'Stan' }));
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ key: 'stock', direction: 'asc' });
    await expect(stock).toHaveAttribute('aria-sort', 'ascending');
    await expect(name).not.toHaveAttribute('aria-sort');
  },
};

export const SortWithKeyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    canvas.getByRole('button', { name: 'Stan' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onSortChange).toHaveBeenCalledWith({ key: 'stock', direction: 'asc' });
  },
};

export const InitialSort: Story = {
  args: { sort: { key: 'stock', direction: 'desc' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('columnheader', { name: 'Stan' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  },
};

export const RowSelection: Story = {
  args: { selectable: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Zaznacz: Kenia AA' }));
    await expect(canvas.getByTestId('selected')).toHaveTextContent('b');
    await expect(args.onSelect).toHaveBeenCalledOnce();

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Zaznacz: Kenia AA' }));
    await expect(canvas.getByTestId('selected')).toBeEmptyDOMElement();
  },
};

export const SelectAllStates: Story = {
  args: { selectable: true },
  play: async ({ canvas, userEvent }) => {
    const all = canvas.getByRole('checkbox', { name: 'Zaznacz wszystkie na stronie' });
    await expect(all).not.toBeChecked();

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Zaznacz: Kenia AA' }));
    await expect(all).toBePartiallyChecked();

    await userEvent.click(all);
    await expect(all).toBeChecked();
    await expect(canvas.getByTestId('selected')).toHaveTextContent('a,b,c');

    await userEvent.click(all);
    await expect(all).not.toBeChecked();
    await expect(canvas.getByTestId('selected')).toBeEmptyDOMElement();
  },
};

export const SelectionSurvivesOtherPages: Story = {
  args: { selectable: true, initialSelection: ['from-page-2'] },
  play: async ({ canvas, userEvent }) => {
    const all = canvas.getByRole('checkbox', { name: 'Zaznacz wszystkie na stronie' });
    // Only rows on this page count towards the header checkbox
    await expect(all).not.toBeChecked();

    await userEvent.click(all);
    await expect(canvas.getByTestId('selected')).toHaveTextContent('a,b,c,from-page-2');

    await userEvent.click(all);
    await expect(canvas.getByTestId('selected')).toHaveTextContent(/^from-page-2$/);
  },
};

export const SelectedRowsStandOut: Story = {
  args: { selectable: true, initialSelection: ['a'] },
  play: async () => {
    const rows = within(body()).getAllByRole('row');
    await expect(getComputedStyle(rows[0] as HTMLElement).backgroundColor).not.toBe(
      getComputedStyle(rows[1] as HTMLElement).backgroundColor,
    );
  },
};

export const Loading: Story = {
  args: { status: 'loading', rows: [], selectable: true, skeletonRows: 4 },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByRole('status')).toHaveTextContent('Wczytywanie danych…');
    await expect(within(body()).getAllByRole('row')).toHaveLength(4);
    await expect(canvasElement.querySelector('tbody [data-slot="skeleton"]')).toBeInTheDocument();
    await expect(
      canvas.getByRole('checkbox', { name: 'Zaznacz wszystkie na stronie' }),
    ).toBeDisabled();
  },
};

export const Refreshing: Story = {
  args: { status: 'refreshing' },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByRole('status')).toHaveTextContent('Wczytywanie danych…');
    await expect(
      canvasElement.querySelector('[data-slot="refresh-indicator"]'),
    ).toBeInTheDocument();
    // Old data stays visible, so the table does not jump between pages
    await expect(canvas.getByRole('cell', { name: 'Kenia AA' })).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { rows: [], selectable: true, emptyState: <p>Brak produktów</p> },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Brak produktów')).toBeInTheDocument();
    await expect(canvas.getByRole('table')).not.toHaveAttribute('aria-busy');
    await expect(
      canvas.getByRole('checkbox', { name: 'Zaznacz wszystkie na stronie' }),
    ).toBeDisabled();
    // Spans the whole table, including the selection column
    await expect(canvas.getByRole('cell', { name: 'Brak produktów' })).toHaveAttribute(
      'colspan',
      '4',
    );
  },
};

export const ErrorState: Story = {
  args: { status: 'error', rows: [], errorState: <p>Nie udało się wczytać</p>, skeletonRows: 4 },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText('Nie udało się wczytać')).toBeInTheDocument();
    await expect(canvas.getByRole('table')).not.toHaveAttribute('aria-busy');
    await expect(canvasElement.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();
  },
};

export const Density: Story = {
  render: (args) => (
    <div className="grid gap-4" data-testid="tables">
      <Harness {...args} caption="Wygodna" density="comfortable" />
      <Harness {...args} caption="Zwarta" density="compact" />
    </div>
  ),
  play: async ({ canvas }) => {
    const rowHeight = (name: string) =>
      within(canvas.getByRole('table', { name })).getAllByRole('row')[1]?.getBoundingClientRect()
        .height ?? 0;
    await expect(rowHeight('Zwarta')).toBeLessThan(rowHeight('Wygodna'));
  },
};
