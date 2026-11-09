import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Input } from './input';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  args: { 'aria-label': 'Nazwa produktu', placeholder: 'np. Etiopia Guji Hambela' },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = { args: { defaultValue: 'Etiopia Yirgacheffe' } };

export const Sizes: Story = {
  render: () => (
    <div className="grid gap-2">
      <Input size="sm" aria-label="Małe" />
      <Input size="md" aria-label="Średnie" />
      <Input size="lg" aria-label="Duże" />
    </div>
  ),
  play: async ({ canvas }) => {
    const height = (name: string) =>
      canvas.getByRole('textbox', { name }).getBoundingClientRect().height;
    await expect(height('Małe')).toBe(32);
    await expect(height('Średnie')).toBe(36);
    await expect(height('Duże')).toBe(40);
  },
};

export const Mono: Story = {
  args: { mono: true, 'aria-label': 'SKU', defaultValue: 'ETH-GUJ-250-Z' },
};

export const AlignedEnd: Story = {
  args: { align: 'end', inputMode: 'numeric', 'aria-label': 'Stan', defaultValue: '42' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Etiopia Yirgacheffe' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled();
  },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'x' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeInvalid();
  },
};

export const FocusRing: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveFocus();
    await expect(getComputedStyle(input).outlineWidth).toBe('2px');
  },
};
