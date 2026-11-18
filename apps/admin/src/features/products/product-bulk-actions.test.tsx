import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { navigation } from '@/test/navigation';
import { page, product, serveProducts } from '@/test/product-fixtures';
import { renderWithProviders } from '@/test/render';
import { API, server } from '@/test/server';
import { ProductListPage } from './product-list-page';
import { BULK_CONCURRENCY } from './products-api';

const guji = product({ name: 'Etiopia Guji' });
const kenia = product({ name: 'Kenia AA' });
const kolumbia = product({ name: 'Kolumbia Huila' });

/** Two pages: Guji and Kenia on page 1, Kolumbia on page 2 */
function serveTwoPages() {
  return serveProducts((search) =>
    search.get('page') === '2'
      ? page([kolumbia], { page: 2, pageSize: 2, total: 3, totalPages: 2 })
      : page([guji, kenia], { pageSize: 2, total: 3, totalPages: 2 }),
  );
}

async function renderList(url = '/products') {
  navigation.setUrl(url);
  const result = renderWithProviders(<ProductListPage />);
  await screen.findByRole('row', { name: /Etiopia Guji/ });
  return result;
}

const checkbox = (name: string) => screen.getByRole('checkbox', { name: `Zaznacz: ${name}` });
const bar = () =>
  screen.getAllByRole('status').find((region) => /Zaznaczono/.test(region.textContent ?? ''));

describe('product selection', () => {
  it('keeps the selection across pages and says how much of it is elsewhere', async () => {
    serveTwoPages();
    await renderList();

    await userEvent.click(checkbox('Etiopia Guji'));
    await userEvent.click(screen.getByRole('button', { name: /następn/i }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Zaznacz: Kolumbia Huila' }));

    expect(bar()).toHaveTextContent('Zaznaczono: 2');
    expect(bar()).toHaveTextContent('w tym 1 na innych stronach');

    await userEvent.click(screen.getByRole('button', { name: /poprzedni/i }));
    await screen.findByRole('row', { name: /Etiopia Guji/ });
    expect(checkbox('Etiopia Guji')).toBeChecked();
    expect(checkbox('Kenia AA')).not.toBeChecked();
  });

  it('clears the selection when the filters change, also after going back to them', async () => {
    serveTwoPages();
    await renderList();
    await userEvent.click(checkbox('Etiopia Guji'));

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'DRAFT');
    expect(bar()).toBeUndefined();

    // Back: the old filters return, the old selection does not
    navigation.setUrl('/products');
    await screen.findByRole('row', { name: /Etiopia Guji/ });
    expect(checkbox('Etiopia Guji')).not.toBeChecked();
  });

  it('clears the selection when the sort changes', async () => {
    serveTwoPages();
    await renderList();
    await userEvent.click(checkbox('Kenia AA'));

    await userEvent.click(screen.getByRole('button', { name: 'Nazwa' }));

    await waitFor(() => expect(checkbox('Kenia AA')).not.toBeChecked());
  });
});

describe('bulk actions', () => {
  it('archives every selected product, from all pages, after confirming', async () => {
    const requests = serveTwoPages();
    const archived: string[] = [];
    server.use(
      http.delete(`${API}/admin/products/:id`, ({ params }) => {
        archived.push(params.id as string);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await renderList();
    await userEvent.click(checkbox('Etiopia Guji'));
    await userEvent.click(screen.getByRole('button', { name: /następn/i }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Zaznacz: Kolumbia Huila' }));
    const listRequests = requests.length;

    await userEvent.click(screen.getByRole('button', { name: 'Archiwizuj' }));

    const dialog = screen.getByRole('alertdialog', { name: 'Zarchiwizować 2 produkty?' });
    expect(dialog).toHaveTextContent('Etiopia Guji, Kolumbia Huila.');
    expect(dialog).toHaveTextContent('W tym 1 z innych stron listy.');
    // Nothing happens before confirming
    expect(archived).toEqual([]);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Archiwizuj' }));

    expect(await screen.findByText('Zarchiwizowano: 2 produkty.')).toBeInTheDocument();
    expect([...archived].sort()).toEqual([guji.id, kolumbia.id].sort());
    expect(bar()).toBeUndefined();
    // One refetch for the whole batch, not one per product
    await waitFor(() => expect(requests.length).toBe(listRequests + 1));
  });

  it('sends nothing when the dialog is dismissed', async () => {
    serveTwoPages();
    let calls = 0;
    server.use(
      http.patch(`${API}/admin/products/:id`, () => {
        calls++;
        return HttpResponse.json({});
      }),
    );
    await renderList();
    await userEvent.click(checkbox('Kenia AA'));

    await userEvent.click(screen.getByRole('button', { name: 'Przenieś do szkiców' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wróć' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(calls).toBe(0);
    expect(checkbox('Kenia AA')).toBeChecked();
  });

  it('reports which products could not be published and keeps them selected', async () => {
    serveTwoPages();
    const bodies: unknown[] = [];
    server.use(
      http.patch(`${API}/admin/products/:id`, async ({ params, request }) => {
        bodies.push(await request.json());
        if (params.id === kenia.id) {
          return HttpResponse.json(
            {
              statusCode: 400,
              message: 'Produktu nie można opublikować.',
              errors: [{ path: 'images', message: 'Dodaj co najmniej jedno zdjęcie.' }],
            },
            { status: 400 },
          );
        }
        return HttpResponse.json({});
      }),
    );
    await renderList();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Zaznacz wszystkie na stronie' }));

    await userEvent.click(screen.getByRole('button', { name: 'Ustaw jako aktywne' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Ustawić status „Aktywny”?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ustaw „Aktywny”' }));

    expect(
      await screen.findByText('Zmieniono status na „Aktywny”: 1 produkt.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Nie udało się: 1 produkt (pozostają zaznaczone). Kenia AA: Dodaj co najmniej jedno zdjęcie.',
      ),
    ).toBeInTheDocument();
    expect(bodies).toEqual([{ status: 'ACTIVE' }, { status: 'ACTIVE' }]);
    expect(checkbox('Kenia AA')).toBeChecked();
    expect(checkbox('Etiopia Guji')).not.toBeChecked();
  });

  it(`runs at most ${BULK_CONCURRENCY} requests at once`, async () => {
    const many = Array.from({ length: 10 }, (_, index) => product({ name: `Kawa ${index + 1}` }));
    serveProducts(() => page(many));
    let running = 0;
    let peak = 0;
    server.use(
      http.delete(`${API}/admin/products/:id`, async () => {
        running++;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 10));
        running--;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    navigation.setUrl('/products');
    renderWithProviders(<ProductListPage />);
    await screen.findByRole('row', { name: /Kawa 10/ });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Zaznacz wszystkie na stronie' }));
    await userEvent.click(screen.getByRole('button', { name: 'Archiwizuj' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Archiwizuj' }),
    );

    expect(await screen.findByText('Zarchiwizowano: 10 produktów.')).toBeInTheDocument();
    expect(peak).toBe(BULK_CONCURRENCY);
  });
});
