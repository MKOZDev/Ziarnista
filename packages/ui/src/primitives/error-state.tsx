'use client';

import { TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { StatePanel } from '../lib/state-panel';
import { Button } from './button';

export type ErrorStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Technical detail to quote when reporting the problem, e.g. "HTTP 503" */
  code?: string;
  onRetry?: () => void;
  /** Without the frame, for use inside a table or a card */
  plain?: boolean;
  className?: string;
};

export function ErrorState({
  title = 'Nie udało się wczytać danych',
  description = 'Serwer nie odpowiedział. Twoje dane są bezpieczne, spróbuj ponownie za chwilę.',
  code,
  onRetry,
  plain,
  className,
}: ErrorStateProps) {
  return (
    <StatePanel
      data-slot="error-state"
      role="alert"
      tone="destructive"
      frame={plain ? 'none' : 'solid'}
      icon={<TriangleAlert />}
      title={title}
      description={description}
      className={className}
    >
      {code && (
        <code className="rounded-sm bg-muted px-2 py-0.5 font-mono text-caption text-muted-foreground">
          {code}
        </code>
      )}
      {onRetry && (
        <Button variant="secondary" className="mt-1.5" onClick={onRetry}>
          Spróbuj ponownie
        </Button>
      )}
    </StatePanel>
  );
}
