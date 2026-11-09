import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ComponentProps, MouseEvent } from 'react';
import { cn } from '../lib/cn';

export const buttonVariants = cva(
  'relative inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md whitespace-nowrap transition-colors duration-(--duration-fast) disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary font-semibold text-primary-foreground hover:not-disabled:bg-primary-hover',
        secondary: 'border bg-card font-medium text-foreground hover:not-disabled:bg-muted',
        ghost: 'font-medium text-foreground hover:not-disabled:bg-muted',
        destructive:
          'bg-destructive font-semibold text-destructive-foreground hover:not-disabled:bg-destructive/90',
        'destructive-outline':
          'border bg-card font-medium text-destructive hover:not-disabled:bg-destructive-soft',
      },
      size: {
        sm: 'h-control-sm px-3 text-label',
        md: 'h-control-md px-4 text-body',
        lg: 'h-control-lg px-4 text-body',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

type NativeButtonProps = ComponentProps<'button'> &
  ButtonVariantProps & { asChild?: false; loading?: boolean };

// The child (usually a link) sets the semantics, and a link has no disabled or loading state
type AsChildButtonProps = Omit<ComponentProps<'button'>, 'disabled' | 'type'> &
  ButtonVariantProps & { asChild: true; loading?: never; disabled?: never; type?: never };

export type ButtonProps = NativeButtonProps | AsChildButtonProps;

function preventClick(event: MouseEvent) {
  event.preventDefault();
}

export function Button({
  asChild = false,
  loading = false,
  variant,
  size,
  type = 'button',
  className,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot.Root data-slot="button" className={classes} onClick={onClick} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      type={type}
      className={classes}
      // aria-disabled, not disabled: a disabled button would drop keyboard focus mid-request
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? preventClick : onClick}
      {...props}
    >
      {loading ? (
        <>
          {/* Transparent, not removed: keeps the width and the accessible name */}
          <span className="inline-flex items-center gap-1.5 opacity-0">{children}</span>
          <LoaderCircle aria-hidden className="absolute animate-spin" />
        </>
      ) : (
        children
      )}
    </button>
  );
}
