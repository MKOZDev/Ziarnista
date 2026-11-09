import { CircleAlert } from 'lucide-react';
import { Slot } from 'radix-ui';
import { useId, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type FieldProps = {
  label: ReactNode;
  /** A single control. It must pass id and aria-* props on to its form element. */
  children: ReactElement;
  /** Set when something has to link to the control, e.g. an error summary */
  id?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  counter?: { value: number; max: number };
  className?: string;
};

export function Field({
  label,
  children,
  id,
  hint,
  error,
  required = false,
  counter,
  className,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const counterId = `${controlId}-counter`;

  const describedBy = [error && errorId, hint && hintId, counter && counterId]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-slot="field" className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2 text-label">
        <label htmlFor={controlId} className="font-medium">
          {label}
          {/* The control's aria-required announces this; the asterisk is visual only */}
          {required && (
            <span aria-hidden className="text-destructive">
              {' *'}
            </span>
          )}
        </label>
        {counter && (
          <span
            id={counterId}
            className={cn(
              'tabular-nums',
              counter.value > counter.max
                ? 'font-medium text-destructive'
                : 'text-muted-foreground',
            )}
          >
            <span aria-hidden>
              {counter.value}/{counter.max}
            </span>
            <span className="sr-only">
              Liczba znaków: {counter.value} z {counter.max}
            </span>
          </span>
        )}
      </div>

      {/* Slot merges these props into the child, so Field works with any control without a context */}
      <Slot.Root
        id={controlId}
        // aria-required, not required: errors come from Zod, not from native browser bubbles
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      >
        {children}
      </Slot.Root>

      {hint && (
        <p id={hintId} className="text-label text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1 text-label text-destructive">
          <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function RequiredFieldsNote({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p className={cn('text-label text-muted-foreground', className)} {...props}>
      * pole wymagane
    </p>
  );
}
