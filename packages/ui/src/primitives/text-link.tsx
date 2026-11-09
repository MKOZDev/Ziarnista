import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronLeft } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const textLinkVariants = cva(
  'rounded-sm transition-colors duration-(--duration-fast) [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Underlined: a link inside text must not be told apart by color alone (WCAG 1.4.1)
        inline: 'text-primary-ink underline underline-offset-2 hover:decoration-2',
        back: 'inline-flex min-h-6 items-center gap-1 text-label text-muted-foreground hover:text-foreground',
      },
    },
    defaultVariants: { variant: 'inline' },
  },
);

export type TextLinkProps = ComponentProps<'a'> &
  VariantProps<typeof textLinkVariants> & { asChild?: boolean };

// Not called Link, so it can be imported next to next/link without an alias
export function TextLink({
  asChild = false,
  variant = 'inline',
  className,
  children,
  ...props
}: TextLinkProps) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp data-slot="text-link" className={cn(textLinkVariants({ variant }), className)} {...props}>
      {variant === 'back' && <ChevronLeft aria-hidden />}
      {/* Slottable: the chevron ends up inside the child link, not next to it */}
      <Slot.Slottable>{children}</Slot.Slottable>
    </Comp>
  );
}
