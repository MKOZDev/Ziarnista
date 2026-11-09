import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type PageHeaderProps = {
  title: ReactNode;
  /** Usually a TextLink with variant="back" */
  back?: ReactNode;
  badge?: ReactNode;
  /** Shows the unsaved changes notice */
  isDirty?: boolean;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  back,
  badge,
  isDirty = false,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div data-slot="page-header" className={cn('flex flex-col gap-1.5', className)}>
      {back && <div className="self-start">{back}</div>}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="text-page font-semibold">{title}</h1>
          {badge}
          {/* Always in the DOM: a live region added together with its text is not announced */}
          <span role="status" className="text-label text-warning">
            {isDirty ? 'Niezapisane zmiany' : ''}
          </span>
        </div>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="text-body text-muted-foreground">{description}</p>}
    </div>
  );
}
