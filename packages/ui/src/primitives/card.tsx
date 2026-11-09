import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const cardVariants = cva('flex flex-col rounded-lg border bg-card text-card-foreground', {
  variants: {
    variant: {
      default: 'shadow-xs',
      dashed: 'border-dashed border-border-strong',
    },
    padding: {
      md: 'gap-4 p-5',
      // For content that reaches the edges, e.g. a table
      none: 'overflow-hidden',
    },
  },
  defaultVariants: { variant: 'default', padding: 'md' },
});

export type CardProps = ComponentProps<'div'> & VariantProps<typeof cardVariants>;

export function Card({ variant, padding, className, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'grid auto-rows-min items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className,
      )}
      {...props}
    />
  );
}

export type CardTitleProps = ComponentProps<'h2'> & {
  // A page has a single h1, so cards start at h2; nested cards can go lower
  as?: 'h2' | 'h3' | 'h4';
};

export function CardTitle({ as: Heading = 'h2', className, ...props }: CardTitleProps) {
  return (
    <Heading
      data-slot="card-title"
      className={cn('text-title font-semibold', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('col-start-1 text-label text-muted-foreground', className)}
      {...props}
    />
  );
}

export function CardAction({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start', className)}
      {...props}
    />
  );
}

export function CardContent(props: ComponentProps<'div'>) {
  return <div data-slot="card-content" {...props} />;
}
