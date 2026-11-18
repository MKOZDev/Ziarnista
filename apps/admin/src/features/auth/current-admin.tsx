'use client';

import type { AuthUser } from '@ziarnista/shared';
import { createContext, useContext } from 'react';

const CurrentAdminContext = createContext<AuthUser | null>(null);

// RTK Query owns the data; the context only says "SessionGate has already loaded it",
// so components below the gate get an AuthUser instead of handling undefined and loading
export const CurrentAdminProvider = CurrentAdminContext.Provider;

export function useCurrentAdmin(): AuthUser {
  const admin = useContext(CurrentAdminContext);
  if (!admin) {
    throw new Error('useCurrentAdmin must be used inside SessionGate');
  }
  return admin;
}
