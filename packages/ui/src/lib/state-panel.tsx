import { cva } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from './cn';

const iconTileVariants = cva('grid size-12 place-items-center rounded-lg [&_svg]:size-5.5', {
  variants: {
    tone: {
      primary: 'bg-primary-soft text-primary-ink',
      destructive: 'bg-destructive-soft text-destructive',
      neutral: 'bg-muted text-muted-foreground',
    },
  },
});

const frameVariants = cva('flex flex-col items-center gap-3 px-6 py-12 text-center', {
  variants: {
    frame: {
      solid: 'rounded-lg border bg-card',
      dashed: 'rounded-lg border border-dashed border-border-strong bg-card',
      // Inside something that is already framed, e.g. a table cell
      none: '',
    },
  },
});

type StatePanelProps = Omit<ComponentProps<'div'>, 'title'> & {
  tone: 'primary' | 'destructive' | 'neutral';
  frame: 'solid' | 'dashed' | 'none';
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
};

/** Shared layout of the empty, error and forbidden states */
export function StatePanel({
  tone,
  frame,
  icon,
  title,
  description,
  className,
  children,
  ...props
}: StatePanelProps) {
  return (
    <div className={cn(frameVariants({ frame }), className)} {...props}>
      <div aria-hidden className={iconTileVariants({ tone })}>
        {icon}
      </div>
      <h2 className="text-title font-semibold">{title}</h2>
      {description && (
        <p className="max-w-105 text-body text-pretty text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}
