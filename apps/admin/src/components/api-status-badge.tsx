'use client';

import { CircleCheck, CircleX, LoaderCircle, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';
import { fetchApiStatus, type ApiStatus } from '@/lib/api-status';

type StatusView = {
  label: string;
  icon: LucideIcon;
  variant: ComponentProps<typeof Badge>['variant'];
};

const VIEWS: Record<ApiStatus, StatusView> = {
  loading: { label: 'Sprawdzam…', icon: LoaderCircle, variant: 'outline' },
  ok: { label: 'API działa', icon: CircleCheck, variant: 'secondary' },
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
    <Badge role="status" variant={variant}>
      <Icon aria-hidden className={status === 'loading' ? 'animate-spin' : undefined} />
      {label}
    </Badge>
  );
}
