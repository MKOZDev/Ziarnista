import type { ReactNode } from 'react';

export type TopbarProps = {
  /** The global search field */
  search?: ReactNode;
  /** Controls on the right, e.g. the theme toggle */
  actions?: ReactNode;
};

export function Topbar({ search, actions }: TopbarProps) {
  return (
    <header
      data-slot="topbar"
      className="sticky top-0 z-5 flex h-topbar flex-none items-center gap-3 border-b bg-card px-6"
    >
      {search && <div className="max-w-95 flex-1">{search}</div>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
