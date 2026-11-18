'use client';

import { ErrorState } from '@ziarnista/ui/error-state';
import { ForbiddenState } from '@ziarnista/ui/forbidden-state';
import type { ReactNode } from 'react';
import { parseApiError } from '@/store/api-error';

export type ApiErrorStateProps = {
  error: unknown;
  onRetry: () => void;
  /** Shown with ForbiddenState, where retrying would not help */
  forbiddenActions?: ReactNode;
};

/** What a page shows when its query fails. A 401 never gets here for long: SessionGate redirects. */
export function ApiErrorState({ error, onRetry, forbiddenActions }: ApiErrorStateProps) {
  const { kind, code } = parseApiError(error);

  if (kind === 'forbidden') {
    return <ForbiddenState actions={forbiddenActions} />;
  }
  return <ErrorState code={code} onRetry={onRetry} />;
}
