import type { ReactNode } from 'react';
import { PanelShell } from '@/components/panel-shell';
import { SessionGate } from '@/features/auth/session-gate';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <PanelShell>{children}</PanelShell>
    </SessionGate>
  );
}
