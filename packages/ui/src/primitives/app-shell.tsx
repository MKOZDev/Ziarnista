import type { ReactNode } from 'react';

const MAIN_ID = 'main-content';

export type AppShellProps = {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div data-slot="app-shell" className="flex min-h-screen">
      {/* First in the tab order, so keyboard users can jump over the navigation (WCAG 2.4.1) */}
      <a
        href={`#${MAIN_ID}`}
        className="sr-only rounded-md bg-card text-body font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2"
      >
        Przejdź do treści
      </a>
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {topbar}
        {/* tabIndex -1: the skip link can only move focus to a focusable target */}
        <main
          id={MAIN_ID}
          tabIndex={-1}
          className="mx-auto flex w-full max-w-content flex-1 flex-col gap-5 px-6 pt-6 pb-14 outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
