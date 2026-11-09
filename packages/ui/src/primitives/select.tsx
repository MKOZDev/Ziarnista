import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { controlClasses, controlSizes } from '../lib/control';

export const selectVariants = cva(['w-full min-w-0 cursor-pointer px-2.5', controlClasses], {
  variants: { size: controlSizes },
  defaultVariants: { size: 'lg' },
});

export type SelectProps = Omit<ComponentProps<'select'>, 'size'> &
  VariantProps<typeof selectVariants>;

// Native on purpose: best mobile and screen reader support; long or searchable lists use Combobox
export function Select({ size, className, ...props }: SelectProps) {
  return (
    <select data-slot="select" className={cn(selectVariants({ size }), className)} {...props} />
  );
}
