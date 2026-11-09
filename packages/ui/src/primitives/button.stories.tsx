import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { expect, fn } from 'storybook/test';
import { Button, type ButtonProps } from './button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Zapisz produkt', onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Zapisz produkt' });
    // Default type guards against accidental form submission
    await expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

const VARIANTS: { variant: ButtonProps['variant']; label: string }[] = [
  { variant: 'primary', label: 'Główny' },
  { variant: 'secondary', label: 'Drugorzędny' },
  { variant: 'ghost', label: 'Tekstowy' },
  { variant: 'destructive', label: 'Niszczący' },
  { variant: 'destructive-outline', label: 'Niszczący z obrysem' },
];

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {VARIANTS.map(({ variant, label }) => (
        <Button key={label} variant={variant}>
          {label}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">Mały</Button>
      <Button size="md">Średni</Button>
      <Button size="lg">Duży</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const height = (name: string) =>
      canvas.getByRole('button', { name }).getBoundingClientRect().height;
    await expect(height('Mały')).toBe(32);
    await expect(height('Średni')).toBe(36);
    await expect(height('Duży')).toBe(40);
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus aria-hidden />
        Dodaj produkt
      </>
    ),
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {VARIANTS.map(({ variant, label }) => (
        <Button key={label} variant={variant} onClick={args.onClick} disabled>
          {label}
        </Button>
      ))}
    </div>
  ),
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Główny' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Zapisz produkt' });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();

    // Stays focusable so keyboard users do not lose their place
    await expect(button).not.toBeDisabled();
    await expect(button).toHaveFocus();
  },
};

const onSubmit = fn((event: React.FormEvent) => {
  event.preventDefault();
});

export const LoadingBlocksSubmit: Story = {
  render: () => (
    <form onSubmit={onSubmit}>
      <Button type="submit" loading>
        Zaloguj się
      </Button>
    </form>
  ),
  play: async ({ canvas, userEvent }) => {
    onSubmit.mockClear();
    await userEvent.click(canvas.getByRole('button', { name: 'Zaloguj się' }));
    await expect(onSubmit).not.toHaveBeenCalled();
  },
};

export const LoadingKeepsWidth: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button data-testid="idle">Zapisz produkt</Button>
      <Button data-testid="loading" loading>
        Zapisz produkt
      </Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const width = (id: string) => canvas.getByTestId(id).getBoundingClientRect().width;
    await expect(width('loading')).toBe(width('idle'));
  },
};

export const AsLink: Story = {
  render: () => (
    <Button asChild variant="secondary">
      <a href="#produkty">Wróć do listy</a>
    </Button>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Wróć do listy' });
    await expect(link).not.toHaveAttribute('type');
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
  },
};
