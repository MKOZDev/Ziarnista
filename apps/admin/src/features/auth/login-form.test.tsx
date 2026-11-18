import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { LoginForm } from '@/features/auth/login-form';
import { selectSessionStatus } from '@/store/session-slice';
import { navigation } from '@/test/navigation';
import { renderWithProviders } from '@/test/render';
import { adminUser, API, meOk, server } from '@/test/server';

const loginUrl = `${API}/admin/auth/login`;

function renderForm(props: Partial<Parameters<typeof LoginForm>[0]> = {}) {
  return renderWithProviders(<LoginForm returnTo="/" hasSessionCookie={false} {...props} />);
}

async function submit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText('Hasło'), password);
  await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));
}

describe('LoginForm', () => {
  it('logs in, normalizes the email and goes to the return path', async () => {
    let body: unknown;
    server.use(
      http.post(loginUrl, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(adminUser);
      }),
    );
    renderForm({ returnTo: '/products?page=2' });

    await submit(' Admin@Ziarnista.pl', 'tajne-haslo-123');

    await waitFor(() => {
      expect(navigation.router.replace).toHaveBeenCalledWith('/products?page=2');
    });
    expect(body).toEqual({ email: 'admin@ziarnista.pl', password: 'tajne-haslo-123' });
  });

  it('shows wrong credentials at form level and keeps the session state untouched', async () => {
    server.use(
      http.post(loginUrl, () =>
        HttpResponse.json({ message: 'Nieprawidłowy email lub hasło' }, { status: 401 }),
      ),
    );
    const { store } = renderForm();

    await submit('admin@ziarnista.pl', 'zle-haslo');

    expect(await screen.findByRole('alert')).toHaveTextContent('Nieprawidłowy email lub hasło');
    // A 401 here means a wrong password, so the global "session lost" path must not run
    expect(selectSessionStatus(store.getState())).toBe('active');
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });

  it('validates with Zod before calling the API and focuses the first bad field', async () => {
    // No handler: onUnhandledFrame would fail the test if the form sent a request
    renderForm();

    await submit('', '');

    const email = screen.getByLabelText('Email');
    expect(email).toHaveAccessibleDescription('Nieprawidłowy adres email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveFocus();
    expect(screen.getByLabelText('Hasło')).toHaveAccessibleDescription('Podaj hasło');
  });

  it('shows API validation errors next to the field', async () => {
    server.use(
      http.post(loginUrl, () =>
        HttpResponse.json(
          {
            message: 'Nieprawidłowe dane',
            errors: [{ path: 'password', message: 'Hasło jest za długie' }],
          },
          { status: 400 },
        ),
      ),
    );
    renderForm();

    await submit('admin@ziarnista.pl', 'haslo');

    const password = screen.getByLabelText('Hasło');
    await waitFor(() => {
      expect(password).toHaveAccessibleDescription('Hasło jest za długie');
    });
    expect(password).toHaveFocus();
  });

  it('shows the rate limit message from the API', async () => {
    const message = 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.';
    server.use(http.post(loginUrl, () => HttpResponse.json({ message }, { status: 429 })));
    renderForm();

    await submit('admin@ziarnista.pl', 'haslo');

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('explains a network failure', async () => {
    server.use(http.post(loginUrl, () => HttpResponse.error()));
    renderForm();

    await submit('admin@ziarnista.pl', 'haslo');

    expect(await screen.findByRole('alert')).toHaveTextContent('Nie udało się połączyć');
  });

  it('leaves the page when the existing cookie turns out to be valid', async () => {
    server.use(meOk);
    renderForm({ hasSessionCookie: true, returnTo: '/orders' });

    await waitFor(() => {
      expect(navigation.router.replace).toHaveBeenCalledWith('/orders');
    });
  });

  it('stays on the form when the existing cookie is stale', async () => {
    let meCalled = false;
    server.use(
      http.get(`${API}/admin/me`, () => {
        meCalled = true;
        return HttpResponse.json({ message: 'Sesja wygasła' }, { status: 401 });
      }),
    );
    renderForm({ hasSessionCookie: true });

    await waitFor(() => {
      expect(meCalled).toBe(true);
    });
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument();
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });
});
