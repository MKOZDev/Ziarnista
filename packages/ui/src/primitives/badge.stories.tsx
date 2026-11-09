import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleCheck } from 'lucide-react';
import { expect } from 'storybook/test';
import { Badge, type BadgeProps } from './badge';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  args: { children: 'Szkic' },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const VARIANTS: { variant: BadgeProps['variant']; label: string }[] = [
  { variant: 'neutral', label: 'Zarchiwizowany' },
  { variant: 'primary', label: 'Nowe' },
  { variant: 'success', label: 'Aktywny' },
  { variant: 'warning', label: 'Oczekuje' },
  { variant: 'info', label: 'Opłacone' },
  { variant: 'violet', label: 'Wysłane' },
  { variant: 'destructive', label: 'Anulowane' },
];

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {VARIANTS.map(({ variant, label }) => (
        <Badge key={label} variant={variant}>
          {label}
        </Badge>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    variant: 'success',
    dot: false,
    children: (
      <>
        <CircleCheck aria-hidden />
        API działa
      </>
    ),
  },
  play: async ({ canvas }) => {
    const badge = canvas.getByText('API działa');
    await expect(badge.querySelectorAll('svg')).toHaveLength(1);
    await expect(badge.querySelector('[aria-hidden].rounded-full')).not.toBeInTheDocument();
  },
};
