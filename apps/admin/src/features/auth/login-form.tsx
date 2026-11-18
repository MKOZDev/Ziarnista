'use client';

import { loginSchema, type FieldIssue } from '@ziarnista/shared';
import { AuthCard } from '@ziarnista/ui/auth-card';
import { Button } from '@ziarnista/ui/button';
import { Field } from '@ziarnista/ui/field';
import { Input } from '@ziarnista/ui/input';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { parseApiError } from '@/store/api-error';
import { useGetMeQuery, useLoginMutation } from './auth-api';

type FieldErrors = { email?: string; password?: string };

const UNAVAILABLE_MESSAGE = 'Nie udało się połączyć z serwerem. Spróbuj ponownie.';
const FALLBACK_MESSAGE = 'Nie udało się zalogować. Spróbuj ponownie.';

function toFieldErrors(issues: FieldIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const { path, message } of issues) {
    if (path === 'email' || path === 'password') {
      // The first problem of a field is the one to fix first
      errors[path] ??= message;
    }
  }
  return errors;
}

export type LoginFormProps = {
  /** Already validated with safeReturnTo */
  returnTo: string;
  /** Without the cookie /admin/me can only answer 401, so the request is not sent at all */
  hasSessionCookie: boolean;
};

export function LoginForm({ returnTo, hasSessionCookie }: LoginFormProps) {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const { data: admin } = useGetMeQuery(undefined, { skip: !hasSessionCookie });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // The cookie turned out to be valid: this admin has nothing to do on the login page
  useEffect(() => {
    if (admin) {
      router.replace(returnTo);
    }
  }, [admin, returnTo, router]);

  function showFieldErrors(errors: FieldErrors) {
    setFieldErrors(errors);
    // WCAG 3.3.1: the keyboard and screen reader user lands on the first thing to fix
    if (errors.email) {
      emailRef.current?.focus();
    } else if (errors.password) {
      passwordRef.current?.focus();
    }
  }

  async function submit() {
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      showFieldErrors(
        toFieldErrors(
          parsed.error.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
        ),
      );
      return;
    }
    setFieldErrors({});

    try {
      await login(parsed.data).unwrap();
      router.replace(returnTo);
    } catch (error) {
      const { kind, message, fieldIssues } = parseApiError(error);
      const errors = toFieldErrors(fieldIssues);
      if (Object.keys(errors).length > 0) {
        showFieldErrors(errors);
      } else {
        // 401 stays at form level: the API deliberately does not say which field is wrong
        setFormError(kind === 'unavailable' ? UNAVAILABLE_MESSAGE : (message ?? FALLBACK_MESSAGE));
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoading) {
      void submit();
    }
  }

  return (
    <AuthCard
      brand="Ziarnista"
      subtitle="Panel administracyjny"
      title="Zaloguj się"
      error={formError}
      onSubmit={handleSubmit}
    >
      <Field label="Email" error={fieldErrors.email}>
        <Input
          ref={emailRef}
          type="email"
          name="email"
          autoComplete="username"
          placeholder="imie@ziarnista.pl"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      </Field>
      <Field label="Hasło" error={fieldErrors.password}>
        <Input
          ref={passwordRef}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
      </Field>
      <Button type="submit" size="lg" loading={isLoading}>
        Zaloguj się
      </Button>
    </AuthCard>
  );
}
