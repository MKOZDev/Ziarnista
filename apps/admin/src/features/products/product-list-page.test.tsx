import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  AdminCategory,
  AdminProductListItem,
  AdminProductListResponse,
} from '@ziarnista/shared';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { navigation } from '@/test/navigation';
import { renderWithProviders } from '@/test/render';
import { API, server } from '@/test/server';
import { ProductListPage } from './product-list-page';

const KAWA_ID = '01923456-789a-7bcd-8ef0-000000000001';

const categories: AdminCategory[] = [
  { id: KAWA_ID, name: 'Kawa', slug: 'kawa', parentId: null, productCount: 2, childCount: 0 },
];

let nextId = 1;
function product(overrides: Partial<AdminProductListItem> = {}): AdminProductListItem {
  const id = `01923456-789a-7bcd-8ef0-${String(nextId++).padStart(12, '0')}`;
  return {
    id,
    kind: 'COFFEE',
    status: 'ACTIVE',
    name: 'Etiopia Guji',
    slug: 'etiopia-guji',
    category: { id: KAWA_ID, name: 'Kawa' },
    minPrice: 4900,
    variantCount: 2,
    activeVariantCount: 2,
    totalStock: 25,
    hasLowStock: false,
    image: null,
    updatedAt: '2026-11-18T10:00:00.000Z',
    ...overrides,
  };
}

function page(items: AdminProductListItem[], overrides: Partial<AdminProductListResponse> = {}) {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1, ...overrides };
}

/** Serves the list and records the query string of every list request */
function serveProducts(respond: (search: URLSearchParams) => AdminProductListResponse) {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(`${API}/admin/categories`, () => HttpResponse.json(categories)),
    http.get(`${API}/admin/products`, ({ request }) => {
      const search = new URL(request.url).searchParams;
      requests.push(search);
      return HttpResponse.json(respond(search));
    }),
  );
  return requests;
}

function renderList(url = '/products') {
  navigation.setUrl(url);
  return renderWithProviders(<ProductListPage />);
}

const rows = () => within(screen.getAllByRole('rowgroup')[1] as HTMLElement).getAllByRole('row');

describe('ProductListPage', () => {
  it('shows each product with its status, price and stock', async () => {
    serveProducts(() =>
      page([
        product({ name: 'Etiopia Guji' }),
        product({
          name: 'Kenia AA',
          status: 'DRAFT',
          minPrice: null,
          activeVariantCount: 0,
          totalStock: 0,
        }),
        product({ name: 'Kolumbia', totalStock: 42, hasLowStock: true }),
      ]),
    );
    renderList();

    const guji = await screen.findByRole('row', { name: /Etiopia Guji/ });
    expect(within(guji).getByRole('link', { name: 'Etiopia Guji' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/products\/01923456-/) as string,
    );
    expect(guji).toHaveTextContent('Aktywny');
    // Intl separates the currency with a non-breaking space
    expect(guji.textContent).toMatch(/49,00\s*zł/);
    expect(guji).toHaveTextContent('25 szt.');

    const kenia = screen.getByRole('row', { name: /Kenia AA/ });
    expect(kenia).toHaveTextContent('Szkic');
    expect(within(kenia).getAllByText('—')).toHaveLength(2);

    // The total looks fine, but some variant is below the threshold
    expect(screen.getByRole('row', { name: /Kolumbia/ })).toHaveTextContent('42 szt., niski stan');
  });

  describe('state in the URL', () => {
    it('sends the filters from the URL to the API, skipping invalid ones', async () => {
      const requests = serveProducts(() => page([product()]));
      renderList(`/products?status=DRAFT&kind=WRONG&categoryId=${KAWA_ID}&lowStock=true&page=2`);

      await screen.findByRole('row', { name: /Etiopia Guji/ });

      expect(requests.at(-1)?.toString()).toBe(
        `page=2&status=DRAFT&categoryId=${KAWA_ID}&lowStock=true`,
      );
      expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('DRAFT');
      expect(screen.getByRole('combobox', { name: 'Rodzaj' })).toHaveValue('');
      expect(screen.getByRole('button', { name: 'Niski stan' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('puts a chosen filter in the URL and goes back to page 1', async () => {
      const requests = serveProducts(() => page([product()]));
      renderList('/products?page=3');
      await screen.findByRole('row', { name: /Etiopia Guji/ });

      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'DRAFT');

      expect(navigation.router.push).toHaveBeenLastCalledWith('/products?status=DRAFT', {
        scroll: false,
      });
      await waitFor(() => expect(requests.at(-1)?.get('status')).toBe('DRAFT'));
      expect(requests.at(-1)?.get('page')).toBeNull();
    });

    it('toggles the low stock filter', async () => {
      serveProducts(() => page([product()]));
      renderList();
      await screen.findByRole('row', { name: /Etiopia Guji/ });

      await userEvent.click(screen.getByRole('button', { name: 'Niski stan' }));
      expect(navigation.search).toBe('lowStock=true');

      await userEvent.click(screen.getByRole('button', { name: 'Niski stan' }));
      expect(navigation.search).toBe('');
    });

    it('sorts by a column header in both directions, as the API supports', async () => {
      serveProducts(() => page([product()]));
      renderList();
      await screen.findByRole('row', { name: /Etiopia Guji/ });

      await userEvent.click(screen.getByRole('button', { name: 'Nazwa' }));
      expect(navigation.search).toBe('sort=name');
      expect(screen.getByRole('columnheader', { name: 'Nazwa' })).toHaveAttribute(
        'aria-sort',
        'ascending',
      );

      await userEvent.click(screen.getByRole('button', { name: 'Nazwa' }));
      expect(navigation.search).toBe('sort=name_desc');
      expect(screen.getByRole('combobox', { name: 'Sortowanie' })).toHaveValue('name_desc');
    });

    it('changes the page, keeping the filters', async () => {
      const requests = serveProducts((search) =>
        page([product({ name: `Strona ${search.get('page') ?? '1'}` })], {
          page: Number(search.get('page') ?? '1'),
          total: 45,
          totalPages: 3,
        }),
      );
      renderList('/products?kind=COFFEE');
      await screen.findByRole('row', { name: /Strona 1/ });

      await userEvent.click(screen.getByRole('button', { name: /następn/i }));

      expect(navigation.search).toBe('page=2&kind=COFFEE');
      expect(await screen.findByRole('row', { name: /Strona 2/ })).toBeInTheDocument();
      expect(requests.at(-1)?.toString()).toBe('page=2&kind=COFFEE');
    });
  });

  describe('search', () => {
    it('sends one request after typing stops, without a Back step per pause', async () => {
      const requests = serveProducts(() => page([product()]));
      renderList();
      await screen.findByRole('row', { name: /Etiopia Guji/ });

      await userEvent.type(screen.getByRole('searchbox', { name: 'Szukaj produktów' }), ' guji ');

      await waitFor(() => expect(navigation.search).toBe('q=guji'));
      await waitFor(() => expect(requests.at(-1)?.get('q')).toBe('guji'));
      // Six keystrokes, one search: none of "g", "gu", "guj" reached the API
      expect(requests.filter((search) => search.has('q'))).toHaveLength(1);
      expect(navigation.router.replace).toHaveBeenCalledOnce();
      expect(navigation.router.push).not.toHaveBeenCalled();
    });

    it('empties the field when the filters are cleared', async () => {
      serveProducts((search) => page(search.has('q') ? [] : [product()]));
      renderList('/products?q=zzz&status=DRAFT');

      expect(await screen.findByText('Brak produktów spełniających kryteria')).toBeInTheDocument();
      const search = screen.getByRole('searchbox', { name: 'Szukaj produktów' });
      expect(search).toHaveValue('zzz');

      // The empty state's button; the toolbar has one too
      await userEvent.click(
        screen.getAllByRole('button', { name: 'Wyczyść filtry' })[1] as HTMLElement,
      );

      expect(navigation.search).toBe('');
      expect(search).toHaveValue('');
      await screen.findByRole('row', { name: /Etiopia Guji/ });
      // The old text must not come back once the debounce delay has passed
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(navigation.search).toBe('');
    });
  });

  describe('states', () => {
    it('shows skeleton rows while loading', async () => {
      serveProducts(() => page([product()]));
      renderList();

      expect(screen.getByRole('table', { name: 'Produkty' })).toHaveAttribute('aria-busy', 'true');
      await screen.findByRole('row', { name: /Etiopia Guji/ });
      expect(screen.getByRole('table', { name: 'Produkty' })).not.toHaveAttribute('aria-busy');
    });

    it('invites to add the first product when there are none at all', async () => {
      serveProducts(() => page([]));
      renderList();

      expect(await screen.findByText('Nie masz jeszcze produktów')).toBeInTheDocument();
      const cta = within(rows()[0] as HTMLElement).getByRole('link', { name: 'Dodaj produkt' });
      expect(cta).toHaveAttribute('href', '/products/new');
    });

    it('offers a way back from a page past the end', async () => {
      serveProducts((search) =>
        search.has('page') ? page([], { page: 9, total: 3 }) : page([product()], { total: 3 }),
      );
      renderList('/products?page=9');

      await userEvent.click(
        await screen.findByRole('button', { name: 'Przejdź na pierwszą stronę' }),
      );

      expect(navigation.search).toBe('');
      expect(await screen.findByRole('row', { name: /Etiopia Guji/ })).toBeInTheDocument();
    });

    it('shows an error with retry when the API fails', async () => {
      let fail = true;
      server.use(
        http.get(`${API}/admin/categories`, () => HttpResponse.json(categories)),
        http.get(`${API}/admin/products`, () =>
          fail ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(page([product()])),
        ),
      );
      renderList();

      expect(await screen.findByText('Nie udało się wczytać danych')).toBeInTheDocument();
      fail = false;
      await userEvent.click(screen.getByRole('button', { name: /spróbuj ponownie/i }));

      expect(await screen.findByRole('row', { name: /Etiopia Guji/ })).toBeInTheDocument();
    });

    it('keeps the old rows visible while new ones load', async () => {
      let release: () => void = () => undefined;
      server.use(
        http.get(`${API}/admin/categories`, () => HttpResponse.json(categories)),
        http.get(`${API}/admin/products`, async ({ request }) => {
          if (new URL(request.url).searchParams.has('kind')) {
            await new Promise<void>((resolve) => {
              release = resolve;
            });
            return HttpResponse.json(page([product({ name: 'Drip V60', kind: 'ACCESSORY' })]));
          }
          return HttpResponse.json(page([product()]));
        }),
      );
      renderList();
      await screen.findByRole('row', { name: /Etiopia Guji/ });

      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rodzaj' }), 'ACCESSORY');

      await waitFor(() =>
        expect(screen.getByRole('table', { name: 'Produkty' })).toHaveAttribute(
          'aria-busy',
          'true',
        ),
      );
      expect(screen.getByRole('row', { name: /Etiopia Guji/ })).toBeInTheDocument();

      release();
      expect(await screen.findByRole('row', { name: /Drip V60/ })).toBeInTheDocument();
    });
  });
});
