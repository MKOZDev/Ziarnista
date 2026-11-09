'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { ToggleGroup } from 'radix-ui';
import { cn } from '../lib/cn';
import { controlSizes } from '../lib/control';

export const segmentedControlVariants = cva(
  'inline-flex w-fit gap-0.5 rounded-md bg-muted p-[3px]',
  {
    variants: { size: controlSizes },
    defaultVariants: { size: 'md' },
  },
);

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string> = VariantProps<
  typeof segmentedControlVariants
> & {
  // Required: the options alone do not say what is being chosen
  'aria-label': string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  size,
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      data-slot="segmented-control"
      type="single"
      value={value}
      // Radix sends '' when the active item is clicked again, but one option must stay selected
      onValueChange={(next) => {
        if (next) onValueChange(next as T);
      }}
      className={cn(segmentedControlVariants({ size }), className)}
      {...props}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          // The border, not just the fill: card on muted is too faint to mark the selection (WCAG 1.4.11)
          className="cursor-pointer rounded-sm border border-transparent px-3 text-label font-medium whitespace-nowrap text-muted-foreground transition-colors duration-(--duration-fast) hover:not-disabled:text-foreground disabled:cursor-not-allowed disabled:opacity-50 data-[state=on]:border-input data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs"
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
