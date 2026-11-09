'use client';

import { CircleCheck, CircleX, LoaderCircle, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge, type BadgeProps } from '@ziarnista/ui/badge';
import { fetchApiStatus, type ApiStatus } from '@/lib/api-status';

type StatusView = {
  label: string;
  icon: LucideIcon;
  variant: BadgeProps['variant'];
};

const VIEWS: Record<ApiStatus, StatusView> = {
  loading: { label: 'Sprawdzam…', icon: LoaderCircle, variant: 'neutral' },
  ok: { label: 'API działa', icon: CircleCheck, variant: 'success' },
  'database-down': {
    label: 'Baza danych niedostępna',
    icon: TriangleAlert,
    variant: 'destructive',
  },
  unreachable: { label: 'API niedostępne', icon: CircleX, variant: 'destructive' },
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

  const { label, icon: Icon, variant } = VIEWS[status];
  return (
    <Badge role="status" variant={variant} dot={false}>
      <Icon aria-hidden className={status === 'loading' ? 'animate-spin' : undefined} />
      {label}
    </Badge>
  );
}
