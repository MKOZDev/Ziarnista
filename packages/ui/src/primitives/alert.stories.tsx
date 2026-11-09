import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Alert } from './alert';

const meta = {
  title: 'Primitives/Alert',
  component: Alert,
  args: { children: 'Nieprawidłowy e-mail lub hasło.' },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Nieprawidłowy e-mail lub hasło.');
  },
};

export const LongText: Story = {
  args: {
    children:
      'Nie udało się zapisać produktu, ponieważ serwer jest chwilowo niedostępny. Twoje zmiany nie zostały utracone, spróbuj ponownie za chwilę.',
  },
};
