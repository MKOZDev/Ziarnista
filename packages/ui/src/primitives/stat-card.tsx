import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type StatChange = {
  /** Include the sign, e.g. "+12,4%" */
  text: string;
  direction: 'up' | 'down';
  /** Defaults to up being good; set for metrics like returns, where down is the good news */
  isGood?: boolean;
};

export type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  change?: StatChange;
  /** What the change is measured against */
  changeContext?: ReactNode;
  className?: string;
};

export function StatCard({
  label,
  value,
  change,
  changeContext = 'vs poprzedni okres',
  className,
}: StatCardProps) {
  const isGood = change?.isGood ?? change?.direction === 'up';
  const Arrow = change?.direction === 'up' ? ArrowUp : ArrowDown;

  return (
    <div
      data-slot="stat-card"
      className={cn('flex flex-col gap-2 rounded-lg border bg-card p-5', className)}
    >
      <span className="text-label font-medium text-muted-foreground">{label}</span>
      <span className="text-stat font-semibold tabular-nums">{value}</span>
      {change && (
        <span className="flex items-center gap-1 text-label text-muted-foreground">
          {/* The arrow and sign carry the direction, so it is not conveyed by color alone */}
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-semibold tabular-nums',
              isGood ? 'text-success' : 'text-destructive',
            )}
          >
            <Arrow aria-hidden className="size-3.5" />
            {change.text}
          </span>
          {changeContext}
        </span>
      )}
    </div>
  );
}
