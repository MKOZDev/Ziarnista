import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const badgeVariants = cva(
  'inline-flex h-5.5 w-fit shrink-0 items-center gap-1.5 rounded-full px-2 text-caption font-semibold whitespace-nowrap [&>svg]:size-3 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        neutral: 'bg-neutral-soft text-muted-foreground',
        primary: 'bg-primary-soft text-primary-ink',
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-warning',
        info: 'bg-info-soft text-info',
        violet: 'bg-violet-soft text-violet',
        destructive: 'bg-destructive-soft text-destructive',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    // Turn off when the badge carries its own icon
    dot?: boolean;
  };

export function Badge({ variant, dot = true, className, children, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
