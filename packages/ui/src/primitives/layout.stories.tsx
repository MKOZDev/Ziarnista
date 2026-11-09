import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutDashboard, LogOut, Moon, Package, Search, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { expect, within } from 'storybook/test';
import { AppShell } from './app-shell';
import { AuthCard } from './auth-card';
import { Badge } from './badge';
import { Button } from './button';
import { CountBadge } from './count-badge';
import { Field } from './field';
import { FormSection } from './form-section';
import { IconButton } from './icon-button';
import { Input } from './input';
import { InputGroup } from './input-group';
import { PageHeader } from './page-header';
import { Sidebar, SidebarBrand, SidebarLink, SidebarNav, SidebarProfile } from './sidebar';
import { TextLink } from './text-link';
import { Topbar } from './topbar';

const meta = {
  title: 'Sections/Layout',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const panelSidebar = (
  <Sidebar
    brand={<SidebarBrand name="Ziarnista" badge="Admin" />}
    footer={
      <SidebarProfile
        name="Anna Kowalczyk"
        role="Administrator"
        action={
          <IconButton variant="ghost" size="sm" aria-label="Wyloguj">
            <LogOut aria-hidden />
          </IconButton>
        }
      />
    }
  >
    <SidebarNav aria-label="Główna">
      <SidebarLink href="#dashboard" active icon={<LayoutDashboard aria-hidden />}>
        Dashboard
      </SidebarLink>
      <SidebarLink
        href="#produkty"
        icon={<Package aria-hidden />}
        count={<CountBadge variant="plain">18</CountBadge>}
      >
        Produkty
      </SidebarLink>
      <SidebarLink
        asChild
        icon={<ShoppingBag aria-hidden />}
        count={<CountBadge variant="solid">3</CountBadge>}
      >
        <a href="#zamowienia">Zamówienia</a>
      </SidebarLink>
    </SidebarNav>
  </Sidebar>
);

const panelTopbar = (
  <Topbar
    search={
      <InputGroup
        size="md"
        type="search"
        aria-label="Szukaj"
        placeholder="Szukaj produktu lub zamówienia"
        start={<Search aria-hidden />}
      />
    }
    actions={
      <IconButton aria-label="Zmień motyw">
        <Moon aria-hidden />
      </IconButton>
    }
  />
);

export const Shell: Story = {
  render: () => (
    <AppShell sidebar={panelSidebar} topbar={panelTopbar}>
      <PageHeader title="Dashboard" description="Podsumowanie sprzedaży." />
    </AppShell>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('main')).toBeInTheDocument();
    await expect(canvas.getByRole('banner')).toBeInTheDocument();
    await expect(canvas.getByRole('complementary')).toBeInTheDocument();
    await expect(canvas.getByRole('navigation', { name: 'Główna' })).toBeInTheDocument();

    // The skip link is the first stop and is visible once focused
    await userEvent.tab();
    const skip = canvas.getByRole('link', { name: 'Przejdź do treści' });
    await expect(skip).toHaveFocus();
    await expect(skip.getBoundingClientRect().width).toBeGreaterThan(50);
    await expect(getComputedStyle(skip).paddingLeft).toBe('12px');
    await expect(skip).toHaveAttribute('href', `#${canvas.getByRole('main').id}`);
  },
};

export const SidebarActivePage: Story = {
  render: () => panelSidebar,
  play: async ({ canvas }) => {
    const active = canvas.getByRole('link', { name: 'Dashboard' });
    await expect(active).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('link', { name: /Produkty/ })).not.toHaveAttribute(
      'aria-current',
    );
    // A shape, not only a color, marks the current page
    await expect(getComputedStyle(active, '::before').width).toBe('3px');
  },
};

export const SidebarLinkAsChild: Story = {
  render: () => panelSidebar,
  play: async ({ canvas }) => {
    const nav = within(canvas.getByRole('navigation'));
    const link = nav.getByRole('link', { name: /Zamówienia/ });
    await expect(link).toHaveAttribute('href', '#zamowienia');
    // The icon and the count are inside the one real link
    await expect(link.querySelector('svg')).toBeInTheDocument();
    await expect(link).toHaveTextContent('3');
    await expect(nav.getAllByRole('link')).toHaveLength(3);
  },
};

export const SidebarDecorativeAvatar: Story = {
  render: () => panelSidebar,
  play: async ({ canvas }) => {
    // The name is already written next to it
    await expect(canvas.queryByRole('img', { name: 'Anna Kowalczyk' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Wyloguj' })).toBeInTheDocument();
  },
};

export const PageHeaderMinimal: Story = {
  render: () => <PageHeader title="Produkty" />,
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Produkty');
    await expect(canvas.getByRole('status')).toBeEmptyDOMElement();
  },
};

export const PageHeaderFull: Story = {
  render: () => (
    <PageHeader
      title="Etiopia Guji"
      back={
        <TextLink variant="back" href="#produkty">
          Produkty
        </TextLink>
      }
      badge={<Badge variant="success">Aktywny</Badge>}
      isDirty
      description="Edytuj dane produktu i warianty."
      actions={
        <>
          <Button variant="secondary">Anuluj</Button>
          <Button>Zapisz produkt</Button>
        </>
      }
    />
  ),
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Niezapisane zmiany');
    await expect(canvas.getByRole('link', { name: 'Produkty' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Zapisz produkt' })).toBeInTheDocument();
  },
};

export const FormSectionFull: Story = {
  render: () => (
    <FormSection
      title="Warianty"
      description="Gramatura, cena i stan magazynu."
      action={
        <Button variant="secondary" size="sm">
          Dodaj wariant
        </Button>
      }
    >
      <Field label="Nazwa wariantu">
        <Input />
      </Field>
      <Field label="SKU">
        <Input mono />
      </Field>
    </FormSection>
  ),
  decorators: [
    (Story) => (
      <div className="max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'Warianty' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('Warianty');
    await expect(canvas.getAllByRole('textbox')).toHaveLength(2);
  },
};

function LoginForm({ error }: { error?: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <AuthCard
      brand="Ziarnista"
      subtitle="Panel administracyjny"
      title="Zaloguj się"
      description="Użyj konta administratora sklepu."
      error={error}
      onSubmit={(event) => {
        event.preventDefault();
        setLoading(true);
      }}
    >
      <Field label="E-mail">
        <Input type="email" autoComplete="username" />
      </Field>
      <Field label="Hasło">
        <Input type="password" autoComplete="current-password" />
      </Field>
      <Button type="submit" size="lg" loading={loading}>
        Zaloguj się
      </Button>
    </AuthCard>
  );
}

export const Login: Story = {
  render: () => <LoginForm />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Zaloguj się');
    await expect(canvas.getByRole('main')).toBeInTheDocument();
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    await expect(canvasElement.querySelector('form')).toHaveAttribute('novalidate');

    const submit = canvas.getByRole('button', { name: 'Zaloguj się' });
    await userEvent.click(submit);
    await expect(submit).toHaveAttribute('aria-busy', 'true');
  },
};

export const LoginWithError: Story = {
  render: () => <LoginForm error="Nieprawidłowy e-mail lub hasło." />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Nieprawidłowy e-mail lub hasło.');
  },
};
