'use client';

import { Check, Minus } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

// One of these is required: a checkbox without a name is unusable with a screen reader
type CheckboxName =
  | { label: ReactNode }
  | { label?: never; 'aria-label': string }
  | { label?: never; 'aria-labelledby': string };

export type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> & CheckboxName;

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  const box = (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // before: extends the 16 px box to a 24 px click target (WCAG 2.5.8); inset counts from inside the 1 px border
        'group relative inline-grid size-4 shrink-0 cursor-pointer place-items-center rounded-sm border border-input bg-card text-primary-foreground transition-colors duration-(--duration-fast) before:absolute before:-inset-[5px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="grid place-items-center">
        <Check
          aria-hidden
          strokeWidth={3}
          className="hidden size-3 group-data-[state=checked]:block"
        />
        <Minus
          aria-hidden
          strokeWidth={3}
          className="hidden size-3 group-data-[state=indeterminate]:block"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (label === undefined) return box;

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-body has-disabled:cursor-not-allowed has-disabled:text-muted-foreground">
      {box}
      <span>{label}</span>
    </label>
  );
}
