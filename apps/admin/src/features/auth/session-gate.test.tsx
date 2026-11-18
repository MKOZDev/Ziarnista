import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { useCurrentAdmin } from '@/features/auth/current-admin';
import { SessionGate } from '@/features/auth/session-gate';
import { useSignOut } from '@/features/auth/use-sign-out';
import { baseApi } from '@/store/base-api';
import { navigation } from '@/test/navigation';
import { renderWithProviders } from '@/test/render';
import { adminUser, API, meOk, server } from '@/test/server';

const productsUrl = `${API}/admin/products`;

const testApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getThing: build.query<{ value: string }, void>({ query: () => 'admin/products' }),
    saveThing: build.mutation<void, void>({
      query: () => ({ url: 'admin/products', method: 'POST' }),
    }),
  }),
});

/** A page in the middle of being used: it fetches only when asked to. */
function WorkingPage() {
  const admin = useCurrentAdmin();
  const [load, { data }] = testApi.useLazyGetThingQuery();
  const [save] = testApi.useSaveThingMutation();
  const { signOut } = useSignOut();

  return (
    <>
      <p>Witaj, {admin.name}</p>
      <p>Dane: {data?.value}</p>
      <button onClick={() => void load()}>Wczytaj</button>
      <button onClick={() => void save()}>Zapisz</button>
      <button onClick={() => void signOut()}>Wyloguj</button>
    </>
  );
}

function renderGate() {
  return renderWithProviders(
    <SessionGate>
      <WorkingPage />
    </SessionGate>,
  );
}

const unauthorized = () => HttpResponse.json({ message: 'Sesja wygasła' }, { status: 401 });
const forbidden = () => HttpResponse.json({ message: 'Brak uprawnień' }, { status: 403 });

describe('SessionGate', () => {
  it('renders the page with the admin once /admin/me succeeds', async () => {
    server.use(meOk);
    renderGate();

    expect(screen.getByRole('status')).toHaveTextContent('Wczytywanie danych');
    expect(await screen.findByText(`Witaj, ${adminUser.name}`)).toBeInTheDocument();
  });

  it('redirects with the return path when the session is already gone on load', async () => {
    server.use(http.get(`${API}/admin/me`, unauthorized));
    window.history.replaceState(null, '', '/orders');
    renderGate();

    await waitFor(() => {
      expect(navigation.router.replace).toHaveBeenCalledWith('/login?returnTo=%2Forders');
    });
  });

  it('on a 401 during work: tells the admin, clears the cache and returns to the login', async () => {
    server.use(
      meOk,
      http.get(productsUrl, () => HttpResponse.json({ value: 'poufne' }), { once: true }),
    );
    window.history.replaceState(null, '', '/products?page=2');
    const user = userEvent.setup();
    const { store } = renderGate();
    await user.click(await screen.findByRole('button', { name: 'Wczytaj' }));
    expect(await screen.findByText('Dane: poufne')).toBeInTheDocument();

    server.use(http.get(productsUrl, unauthorized));
    await user.click(screen.getByRole('button', { name: 'Wczytaj' }));

    await waitFor(() => {
      expect(navigation.router.replace).toHaveBeenCalledWith(
        '/login?returnTo=%2Fproducts%3Fpage%3D2',
      );
    });
    expect(await screen.findByText('Sesja wygasła, zaloguj się ponownie.')).toBeInTheDocument();
    expect(screen.queryByText('Dane: poufne')).not.toBeInTheDocument();
    expect(store.getState().api.queries).toEqual({});
    expect(navigation.router.replace).toHaveBeenCalledOnce();
  });

  it('shows ForbiddenState with a way out on a 403, without redirecting', async () => {
    server.use(http.get(`${API}/admin/me`, forbidden));
    renderGate();

    expect(await screen.findByText('Brak uprawnień')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wyloguj' })).toBeInTheDocument();
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });

  it('shows ErrorState on a network failure, keeps the session and retries', async () => {
    server.use(http.get(`${API}/admin/me`, () => HttpResponse.error()));
    const user = userEvent.setup();
    renderGate();

    const retry = await screen.findByRole('button', { name: 'Spróbuj ponownie' });
    expect(screen.getByText('Brak połączenia')).toBeInTheDocument();
    expect(navigation.router.replace).not.toHaveBeenCalled();

    server.use(meOk);
    await user.click(retry);

    expect(await screen.findByText(`Witaj, ${adminUser.name}`)).toBeInTheDocument();
  });

  it('treats the error page of a dead API as a network failure', async () => {
    server.use(
      http.get(`${API}/admin/me`, () => new HttpResponse('<html>Error</html>', { status: 500 })),
    );
    renderGate();

    expect(await screen.findByText('HTTP 500')).toBeInTheDocument();
    expect(navigation.router.replace).not.toHaveBeenCalled();
  });

  it('rejects a /admin/me response that breaks the contract', async () => {
    server.use(http.get(`${API}/admin/me`, () => HttpResponse.json({ id: 'not-a-user' })));
    renderGate();

    expect(await screen.findByText('Nieprawidłowa odpowiedź serwera')).toBeInTheDocument();
  });

  it('raises a toast for a 403 on a mutation and stays on the page', async () => {
    server.use(meOk, http.post(productsUrl, forbidden));
    const user = userEvent.setup();
    renderGate();

    await user.click(await screen.findByRole('button', { name: 'Zapisz' }));

    expect(await screen.findByText(/Nie masz uprawnień/)).toBeInTheDocument();
    expect(screen.getByText(`Witaj, ${adminUser.name}`)).toBeInTheDocument();
  });

  describe('sign out', () => {
    const logoutUrl = `${API}/admin/auth/logout`;

    it('goes to the login page without a return path and clears the cache', async () => {
      server.use(
        meOk,
        http.post(logoutUrl, () => new HttpResponse(null, { status: 204 })),
      );
      const user = userEvent.setup();
      const { store } = renderGate();

      await user.click(await screen.findByRole('button', { name: 'Wyloguj' }));

      await waitFor(() => {
        expect(navigation.router.replace).toHaveBeenCalledWith('/login');
      });
      expect(store.getState().api.queries).toEqual({});
    });

    it('stays logged in and reports it when the API cannot end the session', async () => {
      server.use(
        meOk,
        http.post(logoutUrl, () => HttpResponse.error()),
      );
      const user = userEvent.setup();
      renderGate();

      await user.click(await screen.findByRole('button', { name: 'Wyloguj' }));

      expect(await screen.findByText(/Nie udało się wylogować/)).toBeInTheDocument();
      expect(navigation.router.replace).not.toHaveBeenCalled();
    });
  });
});
