import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { LoginForm } from '@/features/auth/login-form';
import { safeReturnTo } from '@/lib/return-to';
import { SESSION_COOKIE } from '@/lib/session-cookie';

export const metadata: Metadata = { title: 'Logowanie' };

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ returnTo }, cookieStore] = await Promise.all([searchParams, cookies()]);

  return (
    <LoginForm
      returnTo={safeReturnTo(typeof returnTo === 'string' ? returnTo : undefined)}
      hasSessionCookie={cookieStore.has(SESSION_COOKIE)}
    />
  );
}
