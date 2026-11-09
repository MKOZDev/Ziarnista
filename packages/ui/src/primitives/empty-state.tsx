import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { StatePanel } from '../lib/state-panel';

export type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  /** Without the frame, for use inside a table or a card */
  plain?: boolean;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  plain,
  className,
}: EmptyStateProps) {
  return (
    <StatePanel
      data-slot="empty-state"
      tone="primary"
      frame={plain ? 'none' : 'dashed'}
      icon={icon ?? <Inbox />}
      title={title}
      description={description}
      className={className}
    >
      {action && <div className="mt-1.5">{action}</div>}
    </StatePanel>
  );
}
