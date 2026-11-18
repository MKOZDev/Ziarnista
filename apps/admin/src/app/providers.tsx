'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/features/theme/theme-context';
import { StoreProvider } from '@/store/store-provider';

// A separate client component, so the root layout stays a Server Component and can export metadata
export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </StoreProvider>
  );
}
