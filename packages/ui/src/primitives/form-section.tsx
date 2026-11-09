import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { cardVariants, CardAction, CardDescription, CardHeader, CardTitle } from './card';

export type FormSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FormSection({ title, description, action, children, className }: FormSectionProps) {
  const titleId = useId();

  return (
    <section
      data-slot="form-section"
      aria-labelledby={titleId}
      className={cn(cardVariants(), className)}
    >
      <CardHeader>
        <CardTitle id={titleId}>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
