'use client';

import { Badge } from '@ziarnista/ui/badge';
import { DataTable, type Column, type DataTableProps } from '@ziarnista/ui/data-table';
import { Thumbnail } from '@ziarnista/ui/thumbnail';
import { LOW_STOCK_THRESHOLD, type AdminProductListItem } from '@ziarnista/shared';
import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { KIND_LABELS, STATUS_BADGES, STATUS_LABELS } from './product-labels';

function StockCell({ product }: { product: AdminProductListItem }) {
  if (product.activeVariantCount === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (!product.hasLowStock) {
    return <>{product.totalStock} szt.</>;
  }
  // Icon and text, not color alone (WCAG 1.4.1); the total can be high while one variant runs out
  return (
    <Badge variant="warning" dot={false} title={`Wariant poniżej ${LOW_STOCK_THRESHOLD} szt.`}>
      <TriangleAlert aria-hidden />
      {product.totalStock} szt.
      <span className="sr-only">, niski stan</span>
    </Badge>
  );
}

const COLUMNS: readonly Column<AdminProductListItem>[] = [
  {
    id: 'image',
    header: 'Zdjęcie',
    width: '72px',
    // The name is right next to it, so the image itself adds nothing for a screen reader
    cell: (product) => <Thumbnail name={product.name} src={product.image?.url} />,
  },
  {
    id: 'name',
    header: 'Nazwa',
    sortKey: 'name',
    cell: (product) => (
      <div className="flex flex-col py-2">
        <Link
          href={`/products/${product.id}`}
          className="rounded-sm font-medium text-foreground hover:underline"
        >
          {product.name}
        </Link>
        <span className="text-caption text-muted-foreground">
          {KIND_LABELS[product.kind]} · {product.slug}
        </span>
      </div>
    ),
  },
  { id: 'category', header: 'Kategoria', cell: (product) => product.category.name },
  {
    id: 'status',
    header: 'Status',
    width: '150px',
    cell: (product) => (
      <Badge variant={STATUS_BADGES[product.status]}>{STATUS_LABELS[product.status]}</Badge>
    ),
  },
  {
    id: 'price',
    header: 'Cena od',
    sortKey: 'price',
    align: 'end',
    width: '120px',
    cell: (product) =>
      product.minPrice === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        formatPrice(product.minPrice)
      ),
  },
  {
    id: 'stock',
    header: 'Stan',
    align: 'end',
    width: '130px',
    cell: (product) => <StockCell product={product} />,
  },
];

export type ProductTableProps = Omit<
  DataTableProps<AdminProductListItem>,
  'caption' | 'columns' | 'getRowId'
>;

export function ProductTable(props: ProductTableProps) {
  return (
    <DataTable caption="Produkty" columns={COLUMNS} getRowId={(product) => product.id} {...props} />
  );
}
