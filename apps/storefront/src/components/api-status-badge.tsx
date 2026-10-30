'use client';

import { useEffect, useState } from 'react';
import { fetchApiStatus, type ApiStatus } from '@/lib/api-status';

const LABELS: Record<ApiStatus, string> = {
  loading: 'Sprawdzam połączenie z API…',
  ok: 'API działa',
  'database-down': 'API działa, baza danych niedostępna',
  unreachable: 'API niedostępne',
};

const DOT_CLASSES: Record<ApiStatus, string> = {
  loading: 'bg-espresso/30 animate-pulse',
  ok: 'bg-sage',
  'database-down': 'bg-terracotta',
  unreachable: 'bg-terracotta',
};

export function ApiStatusBadge() {
  const [status, setStatus] = useState<ApiStatus>('loading');

  useEffect(() => {
    const controller = new AbortController();
    fetchApiStatus(controller.signal).then(setStatus, () => {
      // Aborted on unmount: nothing to update
    });
    return () => controller.abort();
  }, []);

  return (
    <p
      role="status"
      className="inline-flex items-center gap-2 rounded-full border border-espresso/15 px-4 py-1.5 text-sm"
    >
      <span aria-hidden className={`size-2 rounded-full ${DOT_CLASSES[status]}`} />
      {LABELS[status]}
    </p>
  );
}
