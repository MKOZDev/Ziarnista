import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Field, RequiredFieldsNote } from './field';
import { Input } from './input';
import { InputGroup } from './input-group';
import { MoneyInput } from './money-input';
import { Select } from './select';
import { Textarea } from './textarea';

const meta = {
  title: 'Primitives/Field',
  component: Field,
  args: { label: 'Nazwa produktu', children: <Input /> },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Nazwa produktu'));
    await expect(canvas.getByRole('textbox', { name: 'Nazwa produktu' })).toHaveFocus();
  },
};

export const Required: Story = {
  args: { required: true },
  decorators: [
    (Story) => (
      <div className="grid gap-3">
        <RequiredFieldsNote />
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    // The asterisk stays out of the accessible name
    await expect(canvas.getByRole('textbox', { name: 'Nazwa produktu' })).toBeRequired();
  },
};

export const WithHint: Story = {
  args: { hint: 'Widoczna w sklepie i w wynikach wyszukiwania.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toHaveAccessibleDescription(
      'Widoczna w sklepie i w wynikach wyszukiwania.',
    );
    await expect(canvas.getByRole('textbox')).toBeValid();
  },
};

export const WithError: Story = {
  args: { error: 'Podaj nazwę produktu' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription('Podaj nazwę produktu');
  },
};

export const HintAndError: Story = {
  args: { hint: 'Najwyżej 120 znaków.', error: 'Nazwa jest za długa' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toHaveAccessibleDescription(
      'Nazwa jest za długa Najwyżej 120 znaków.',
    );
  },
};

export const Counter: Story = {
  args: { label: 'Meta tytuł', counter: { value: 42, max: 60 } },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Meta tytuł' });
    await expect(input).toHaveAccessibleDescription('Liczba znaków: 42 z 60');
  },
};

export const CounterExceeded: Story = {
  args: { label: 'Meta tytuł', counter: { value: 65, max: 60 } },
};

export const CustomId: Story = {
  args: { id: 'product-name', error: 'Podaj nazwę produktu' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Nazwa produktu' })).toHaveAttribute(
      'id',
      'product-name',
    );
  },
};

export const WithTextarea: Story = {
  args: { label: 'Opis', error: 'Opis jest wymagany', children: <Textarea /> },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Opis' });
    await expect(textarea).toBeInvalid();
    await expect(textarea).toHaveAccessibleDescription('Opis jest wymagany');
  },
};

export const WithSelect: Story = {
  args: {
    label: 'Status',
    error: 'Wybierz status',
    children: (
      <Select>
        <option value="DRAFT">Szkic</option>
        <option value="ACTIVE">Aktywny</option>
      </Select>
    ),
  },
  play: async ({ canvas }) => {
    const select = canvas.getByRole('combobox', { name: 'Status' });
    await expect(select).toBeInvalid();
    await expect(select).toHaveAccessibleDescription('Wybierz status');
  },
};

// Composite controls: the wiring has to reach the real input, not the wrapper
export const WithInputGroup: Story = {
  args: {
    label: 'Adres URL',
    error: 'Ten adres jest zajęty',
    children: <InputGroup addon="ziarnista.pl/produkt/" mono />,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Adres URL' });
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription('Ten adres jest zajęty');
  },
};

export const WithMoneyInput: Story = {
  args: {
    label: 'Cena',
    required: true,
    error: 'Podaj cenę',
    children: <MoneyInput value={null} onValueChange={fn()} />,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Cena' });
    await expect(input).toBeRequired();
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription('Podaj cenę');
  },
};
