import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PanelShell } from '@/components/panel-shell';
import { CurrentAdminProvider } from '@/features/auth/current-admin';
import { navigation } from '@/test/navigation';
import { renderWithProviders } from '@/test/render';
import { adminUser } from '@/test/server';

function renderShell() {
  return renderWithProviders(
    <CurrentAdminProvider value={adminUser}>
      <PanelShell>
        <h1>Treść strony</h1>
      </PanelShell>
    </CurrentAdminProvider>,
  );
}

describe('PanelShell', () => {
  it('moves through the page with Tab in reading order, starting at the skip link', async () => {
    const user = userEvent.setup();
    renderShell();

    const expected = [
      screen.getByRole('link', { name: 'Przejdź do treści' }),
      ...['Dashboard', 'Produkty', 'Kategorie', 'Pochodzenia', 'Zamówienia'].map((name) =>
        screen.getByRole('link', { name }),
      ),
      screen.getByRole('button', { name: 'Wyloguj' }),
      screen.getByRole('button', { name: 'Włącz ciemny motyw' }),
    ];

    for (const element of expected) {
      await user.tab();
      expect(element).toHaveFocus();
    }
  });

  it('points the skip link at a focusable main region', () => {
    renderShell();

    const main = screen.getByRole('main');
    expect(screen.getByRole('link', { name: 'Przejdź do treści' })).toHaveAttribute(
      'href',
      `#${main.id}`,
    );
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it.each([
    ['/', 'Dashboard'],
    ['/products', 'Produkty'],
    ['/products/123', 'Produkty'],
  ])('at %s marks only %s as the current page', (pathname, label) => {
    navigation.pathname = pathname;
    renderShell();

    const nav = screen.getByRole('navigation', { name: 'Główna nawigacja' });
    const current = within(nav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((link) => link.textContent)).toEqual([label]);
  });

  it('switches the theme from the keyboard', async () => {
    const user = userEvent.setup();
    renderShell();

    screen.getByRole('button', { name: 'Włącz ciemny motyw' }).focus();
    await user.keyboard('{Enter}');

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Włącz jasny motyw' })).toHaveFocus();
  });

  it('shows who is logged in', () => {
    renderShell();

    expect(screen.getByText(adminUser.name)).toBeInTheDocument();
  });
});
