import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const iconButtonVariants = cva(
  'inline-grid shrink-0 cursor-pointer place-items-center rounded-md transition-colors duration-(--duration-fast) disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        outline:
          'border bg-card text-muted-foreground hover:not-disabled:bg-muted hover:not-disabled:text-foreground',
        ghost:
          'text-muted-foreground hover:not-disabled:bg-muted hover:not-disabled:text-foreground',
        'ghost-destructive':
          'text-muted-foreground hover:not-disabled:bg-destructive-soft hover:not-disabled:text-destructive',
        // On photos: the colors are inverted per theme, so the icon always contrasts with its disc
        overlay:
          'rounded-full bg-foreground/70 text-background hover:not-disabled:bg-foreground/85',
      },
      size: {
        sm: 'size-control-sm',
        md: 'size-control-md',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export type IconButtonProps = ComponentProps<'button'> &
  VariantProps<typeof iconButtonVariants> & {
    // Required: an icon alone gives assistive technology nothing to announce
    'aria-label': string;
  };

export function IconButton({
  variant,
  size,
  type = 'button',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      data-slot="icon-button"
      type={type}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
