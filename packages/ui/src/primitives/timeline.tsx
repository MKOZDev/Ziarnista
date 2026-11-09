import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type TimelineItem = {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  note?: ReactNode;
  /** The current state; the dot is not its only cue, the title is heavier too */
  active?: boolean;
};

export type TimelineProps = {
  items: readonly TimelineItem[];
  className?: string;
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol data-slot="timeline" className={cn('flex flex-col', className)}>
      {items.map((item, index) => (
        <li
          key={item.id}
          aria-current={item.active ? 'step' : undefined}
          className="grid grid-cols-[18px_minmax(0,1fr)] gap-3"
        >
          <div aria-hidden className="flex flex-col items-center">
            <span
              className={cn(
                'mt-1.5 size-2.5 flex-none rounded-full',
                item.active ? 'bg-primary' : 'bg-border-strong',
              )}
            />
            {index < items.length - 1 && <span className="w-px flex-1 bg-border" />}
          </div>
          <div className={cn('flex flex-col gap-0.5', index < items.length - 1 && 'pb-4')}>
            <span className={cn('text-body', item.active ? 'font-semibold' : 'font-medium')}>
              {item.title}
            </span>
            {item.meta && <span className="text-label text-muted-foreground">{item.meta}</span>}
            {item.note && (
              <span className="mt-1 rounded-md bg-muted px-2.5 py-2 text-label">{item.note}</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
