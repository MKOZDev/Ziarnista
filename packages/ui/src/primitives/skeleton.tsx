import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const skeletonVariants = cva('animate-skeleton bg-muted', {
  variants: {
    shape: {
      rect: 'rounded-lg',
      line: 'h-3 rounded-sm',
      pill: 'h-5 rounded-full',
    },
  },
  defaultVariants: { shape: 'rect' },
});

export type SkeletonProps = ComponentProps<'div'> & VariantProps<typeof skeletonVariants>;

// Hidden from assistive technology: the surrounding region announces loading with aria-busy
export function Skeleton({ shape, className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(skeletonVariants({ shape }), className)}
      {...props}
    />
  );
}
