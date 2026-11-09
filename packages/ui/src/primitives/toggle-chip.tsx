'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Plus } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const toggleChipVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-label font-medium whitespace-nowrap transition-colors duration-(--duration-fast) disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-ink [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      size: {
        sm: 'h-control-sm',
        md: 'h-control-md',
      },
      pressed: {
        true: '',
        false: 'bg-card text-foreground hover:not-disabled:bg-muted',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export type ToggleChipProps = Omit<ComponentProps<'button'>, 'onChange'> &
  Pick<VariantProps<typeof toggleChipVariants>, 'size'> & {
    pressed: boolean;
    onPressedChange: (pressed: boolean) => void;
    /** Shows a plus when off, for chips that add something to a selection */
    showAddIcon?: boolean;
  };

export function ToggleChip({
  pressed,
  onPressedChange,
  showAddIcon = false,
  size,
  type = 'button',
  className,
  children,
  onClick,
  ...props
}: ToggleChipProps) {
  return (
    <button
      data-slot="toggle-chip"
      type={type}
      aria-pressed={pressed}
      className={cn(toggleChipVariants({ size, pressed }), className)}
      onClick={(event) => {
        onClick?.(event);
        onPressedChange(!pressed);
      }}
      {...props}
    >
      {/* The check means the state is not conveyed by color alone (WCAG 1.4.1) */}
      {pressed ? <Check aria-hidden /> : showAddIcon && <Plus aria-hidden />}
      {children}
    </button>
  );
}
