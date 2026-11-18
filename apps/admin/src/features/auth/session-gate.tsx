'use client';

import { Button } from '@ziarnista/ui/button';
import { LoadingState } from '@ziarnista/ui/loading-state';
import { toast } from '@ziarnista/ui/toast';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ApiErrorState } from '@/components/api-error-state';
import { loginPath } from '@/lib/return-to';
import { parseApiError } from '@/store/api-error';
import { baseApi } from '@/store/base-api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSessionStatus } from '@/store/session-slice';
import { useGetMeQuery } from './auth-api';
import { CurrentAdminProvider } from './current-admin';
import { useSignOut } from './use-sign-out';

function GateMessage({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex min-h-screen max-w-content flex-col p-6">{children}</main>;
}

function SignOutButton() {
  const { signOut, isSigningOut } = useSignOut();

  return (
    <Button
      variant="secondary"
      loading={isSigningOut}
      onClick={() => {
        void signOut();
      }}
    >
      Wyloguj
    </Button>
  );
}

/**
 * Real authorization check of the panel (the proxy only sees that a cookie exists).
 * Pages render only after /admin/me succeeds, so they never start requests without a session.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const status = useAppSelector(selectSessionStatus);
  // Skipped once the session is over: resetApiState would otherwise trigger a refetch here
  const { data: admin, error, refetch } = useGetMeQuery(undefined, { skip: status !== 'active' });

  useEffect(() => {
    if (status === 'active') {
      return;
    }
    // Admin data must not outlive the session, e.g. for the next person at this computer
    dispatch(baseApi.util.resetApiState());
    if (status === 'expired') {
      toast.error('Sesja wygasła, zaloguj się ponownie.');
      // Read here and not with useSearchParams: it is needed once, at the moment of the redirect
      router.replace(loginPath(`${window.location.pathname}${window.location.search}`));
    } else {
      router.replace(loginPath());
    }
  }, [status, dispatch, router]);

  if (status === 'active' && admin) {
    return <CurrentAdminProvider value={admin}>{children}</CurrentAdminProvider>;
  }
  if (status === 'active' && error && parseApiError(error).kind !== 'unauthorized') {
    return (
      <GateMessage>
        <ApiErrorState
          error={error}
          onRetry={() => {
            void refetch();
          }}
          forbiddenActions={<SignOutButton />}
        />
      </GateMessage>
    );
  }
  return (
    <GateMessage>
      <LoadingState />
    </GateMessage>
  );
}
