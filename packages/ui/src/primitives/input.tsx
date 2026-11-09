import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { controlClasses, controlSizes } from '../lib/control';

export const inputVariants = cva(['w-full min-w-0 px-3', controlClasses], {
  variants: {
    size: controlSizes,
    align: { start: '', end: 'text-right tabular-nums' },
    mono: { true: 'font-mono', false: '' },
  },
  defaultVariants: { size: 'lg', align: 'start', mono: false },
});

export type InputProps = Omit<ComponentProps<'input'>, 'size'> & VariantProps<typeof inputVariants>;

export function Input({ size, align, mono, className, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      className={cn(inputVariants({ size, align, mono }), className)}
      {...props}
    />
  );
}
