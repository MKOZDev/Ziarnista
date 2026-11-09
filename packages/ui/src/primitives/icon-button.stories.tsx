import type { Meta, StoryObj } from '@storybook/react-vite';
import { Moon, Trash2, X } from 'lucide-react';
import { expect, fn } from 'storybook/test';
import { IconButton } from './icon-button';

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  args: { 'aria-label': 'Zmień motyw', children: <Moon aria-hidden />, onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Outline: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Zmień motyw' });
    await expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Ghost: Story = { args: { variant: 'ghost' } };

export const GhostDestructive: Story = {
  args: {
    variant: 'ghost-destructive',
    'aria-label': 'Wyłącz wariant',
    children: <Trash2 aria-hidden />,
  },
};

export const Overlay: Story = {
  args: {
    variant: 'overlay',
    size: 'sm',
    'aria-label': 'Usuń zdjęcie',
    children: <X aria-hidden />,
  },
  decorators: [
    (Story) => (
      <div className="grid size-24 place-items-center rounded-lg bg-muted">
        <Story />
      </div>
    ),
  ],
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <IconButton {...args} size="sm" aria-label="Mały" />
      <IconButton {...args} size="md" aria-label="Średni" />
    </div>
  ),
  play: async ({ canvas }) => {
    const box = (name: string) => canvas.getByRole('button', { name }).getBoundingClientRect();
    await expect(box('Mały').width).toBe(32);
    await expect(box('Mały').height).toBe(32);
    await expect(box('Średni').width).toBe(36);
    await expect(box('Średni').height).toBe(36);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Zmień motyw' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
