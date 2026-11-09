import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Textarea } from './textarea';

const meta = {
  title: 'Primitives/Textarea',
  component: Textarea,
  args: { 'aria-label': 'Opis', placeholder: 'Krótki opis widoczny na karcie produktu' },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toHaveAttribute('rows', '4');
  },
};

export const CustomRows: Story = { args: { rows: 2 } };

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Nuty cytrusów i bergamotki.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled();
  },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeInvalid();
  },
};
