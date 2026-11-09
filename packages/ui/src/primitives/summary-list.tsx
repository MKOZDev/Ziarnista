import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type SummaryItem = {
  label: ReactNode;
  value: ReactNode;
  /** The bottom line, e.g. the order total */
  emphasized?: boolean;
};

export type SummaryListProps = {
  items: readonly SummaryItem[];
  className?: string;
};

export function SummaryList({ items, className }: SummaryListProps) {
  return (
    <dl data-slot="summary-list" className={cn('flex flex-col gap-2 text-body', className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'flex justify-between gap-3',
            item.emphasized && 'border-t pt-2 text-title font-semibold',
          )}
        >
          <dt className={cn(!item.emphasized && 'text-muted-foreground')}>{item.label}</dt>
          <dd className={cn('tabular-nums', !item.emphasized && 'font-medium')}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
