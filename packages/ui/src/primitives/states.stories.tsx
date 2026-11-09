import type { Meta, StoryObj } from '@storybook/react-vite';
import { Coffee } from 'lucide-react';
import { expect, fn } from 'storybook/test';
import { Button } from './button';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { ForbiddenState } from './forbidden-state';
import { LoadingState } from './loading-state';

const meta = {
  title: 'Composites/States',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmptyWithAction: Story = {
  render: () => (
    <EmptyState
      icon={<Coffee />}
      title="Brak produktów"
      description="Dodaj pierwszy produkt, aby zacząć sprzedaż."
      action={<Button>Dodaj produkt</Button>}
    />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('Brak produktów');
    await expect(canvas.getByRole('button', { name: 'Dodaj produkt' })).toBeInTheDocument();
  },
};

export const EmptyWithoutAction: Story = {
  render: () => <EmptyState title="Brak wyników" description="Zmień filtry." />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
  },
};

export const EmptyPlain: Story = {
  render: () => <EmptyState plain title="Brak wyników" />,
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('[data-slot="empty-state"]') as HTMLElement;
    await expect(getComputedStyle(panel).borderTopWidth).toBe('0px');
  },
};

const onRetry = fn();

export const ErrorWithRetry: Story = {
  render: () => <ErrorState code="HTTP 503 · req_7f3a91c2" onRetry={onRetry} />,
  play: async ({ canvas, userEvent }) => {
    onRetry.mockClear();
    await expect(canvas.getByRole('alert')).toHaveTextContent('Nie udało się wczytać danych');
    await expect(canvas.getByText('HTTP 503 · req_7f3a91c2')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Spróbuj ponownie' }));
    await expect(onRetry).toHaveBeenCalledOnce();
  },
};

export const ErrorWithoutRetry: Story = {
  render: () => <ErrorState title="Nie znaleziono" description="Produkt nie istnieje." />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('code')).not.toBeInTheDocument();
  },
};

export const Forbidden: Story = {
  render: () => (
    <ForbiddenState actions={<Button variant="secondary">Wróć do dashboardu</Button>} />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading')).toHaveTextContent('Brak uprawnień');
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

export const LoadingList: Story = {
  render: () => <LoadingState rows={3} />,
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Wczytywanie danych…');
    await expect(canvasElement.querySelector('[data-slot="loading-state"]')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  },
};

export const LoadingDashboard: Story = {
  render: () => <LoadingState variant="dashboard" rows={2} />,
};
