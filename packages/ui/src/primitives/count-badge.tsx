import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const countBadgeVariants = cva('text-caption tabular-nums', {
  variants: {
    variant: {
      solid:
        'inline-grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 font-semibold text-primary-foreground',
      muted: 'inline-block rounded-full bg-muted px-1.5 text-muted-foreground',
      plain: 'text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'muted' },
});

export type CountBadgeProps = ComponentProps<'span'> & VariantProps<typeof countBadgeVariants>;

export function CountBadge({ variant, className, ...props }: CountBadgeProps) {
  return (
    <span
      data-slot="count-badge"
      className={cn(countBadgeVariants({ variant }), className)}
      {...props}
    />
  );
}
