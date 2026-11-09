import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Select } from './select';

const meta = {
  title: 'Primitives/Select',
  component: Select,
  args: {
    'aria-label': 'Status',
    children: (
      <>
        <option value="DRAFT">Szkic</option>
        <option value="ACTIVE">Aktywny</option>
        <option value="ARCHIVED">Zarchiwizowany</option>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByRole('combobox', { name: 'Status' });
    await userEvent.selectOptions(select, 'ACTIVE');
    await expect(select).toHaveValue('ACTIVE');
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="grid gap-2">
      <Select {...args} size="sm" aria-label="Mały" />
      <Select {...args} size="md" aria-label="Średni" />
      <Select {...args} size="lg" aria-label="Duży" />
    </div>
  ),
  play: async ({ canvas }) => {
    const height = (name: string) =>
      canvas.getByRole('combobox', { name }).getBoundingClientRect().height;
    await expect(height('Mały')).toBe(32);
    await expect(height('Średni')).toBe(36);
    await expect(height('Duży')).toBe(40);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox')).toBeDisabled();
  },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox')).toBeInvalid();
  },
};
