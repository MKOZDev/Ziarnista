import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { StatePanel } from '../lib/state-panel';

export type ForbiddenStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function ForbiddenState({
  title = 'Brak uprawnień',
  description = 'Nie masz dostępu do tej części panelu.',
  actions,
  className,
}: ForbiddenStateProps) {
  return (
    <StatePanel
      data-slot="forbidden-state"
      tone="neutral"
      frame="solid"
      icon={<Lock />}
      title={title}
      description={description}
      className={className}
    >
      {actions && <div className="mt-1.5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </StatePanel>
  );
}
