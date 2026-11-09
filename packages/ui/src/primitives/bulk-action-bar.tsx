import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';

export type BulkActionBarProps = {
  count: number;
  onClear: () => void;
  /** Action buttons, usually small and secondary */
  children: ReactNode;
  className?: string;
};

export function BulkActionBar({ count, onClear, children, className }: BulkActionBarProps) {
  return (
    <div className={cn(count === 0 && 'contents', className)}>
      {/* Always in the DOM: a live region added together with its text is not announced */}
      <div role="status" className={cn(count === 0 && 'sr-only')}>
        {count > 0 && (
          <div
            data-slot="bulk-action-bar"
            className="flex flex-wrap items-center gap-2 border-b bg-primary-soft px-4 py-2.5"
          >
            <span className="mr-2 text-label font-semibold text-primary-ink tabular-nums">
              Zaznaczono: {count}
            </span>
            {children}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={onClear}>
              Odznacz
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
