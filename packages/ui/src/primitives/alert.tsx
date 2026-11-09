import { CircleAlert } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export function Alert({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-md bg-destructive-soft px-3 py-2 text-label text-destructive',
        className,
      )}
      {...props}
    >
      {/* The icon means the error is not conveyed by color alone (WCAG 1.4.1) */}
      <CircleAlert aria-hidden className="mt-px size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
