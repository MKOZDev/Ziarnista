import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { controlSizes } from '../lib/control';

export const inputGroupVariants = cva(
  // The ring sits on the wrapper and only follows the input, so a focused button in `end` keeps its own
  'flex w-full min-w-0 items-center rounded-md border border-input bg-card text-body text-foreground transition-colors duration-(--duration-fast) has-aria-invalid:border-destructive has-disabled:cursor-not-allowed has-disabled:border-border has-disabled:bg-muted has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring',
  {
    variants: { size: controlSizes },
    defaultVariants: { size: 'lg' },
  },
);

const innerInputVariants = cva(
  'h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      align: { start: '', end: 'text-right tabular-nums' },
      mono: { true: 'font-mono', false: '' },
    },
    defaultVariants: { align: 'start', mono: false },
  },
);

export type InputGroupProps = Omit<ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputGroupVariants> &
  VariantProps<typeof innerInputVariants> & {
    /** Text in a shaded box before the input, e.g. a URL prefix */
    addon?: string;
    /** Decoration before the input, usually an icon */
    start?: ReactNode;
    /** Content after the input: a unit or a button, which bring their own spacing */
    end?: ReactNode;
  };

// className goes to the wrapper, the remaining props to the input, so Field can target the input
export function InputGroup({
  addon,
  start,
  end,
  size,
  align,
  mono,
  className,
  ...props
}: InputGroupProps) {
  return (
    <div data-slot="input-group" className={cn(inputGroupVariants({ size }), className)}>
      {addon && (
        <span className="flex h-full shrink-0 items-center rounded-l-md border-r bg-muted px-3 text-label text-muted-foreground">
          {addon}
        </span>
      )}
      {start && (
        <span className="flex shrink-0 items-center pl-3 text-muted-foreground [&_svg]:size-4">
          {start}
        </span>
      )}
      <input className={innerInputVariants({ align, mono })} {...props} />
      {end && <span className="flex shrink-0 items-center">{end}</span>}
    </div>
  );
}
