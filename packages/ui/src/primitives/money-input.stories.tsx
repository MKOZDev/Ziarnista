import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';
import { Button } from './button';
import { MoneyInput, type MoneyInputProps } from './money-input';

function Controlled({ value: initial, onValueChange, ...props }: MoneyInputProps) {
  const [value, setValue] = useState(initial);
  return (
    <div className="grid max-w-48 gap-2">
      <MoneyInput
        {...props}
        value={value}
        onValueChange={(grosze) => {
          setValue(grosze);
          onValueChange(grosze);
        }}
      />
      <output data-testid="grosze">{String(value)}</output>
      <Button variant="secondary" size="sm" onClick={() => setValue(4500)}>
        Ustaw 45 zł
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setValue(null)}>
        Wyczyść
      </Button>
    </div>
  );
}

const meta = {
  title: 'Primitives/MoneyInput',
  component: MoneyInput,
  args: { 'aria-label': 'Cena', value: null, onValueChange: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof MoneyInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toHaveValue('');
  },
};

export const WithValue: Story = {
  args: { value: 1250 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toHaveValue('12,50');
  },
};

export const TypingEmitsGrosze: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox'), '19,99');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(1999);
    await expect(canvas.getByTestId('grosze')).toHaveTextContent('1999');
  },
};

export const KeepsTextWhileTyping: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, '12,');
    await expect(input).toHaveValue('12,');
    await expect(canvas.getByTestId('grosze')).toHaveTextContent('1200');
  },
};

export const FormatsOnBlur: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, '12.5');
    await userEvent.tab();
    await expect(input).toHaveValue('12,50');
  },
};

export const Malformed: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, '12,345');
    await userEvent.tab();
    // Left as typed for the user to correct, never rounded
    await expect(input).toHaveValue('12,345');
    await expect(input).toBeInvalid();
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
  },
};

export const ExternalUpdate: Story = {
  args: { value: 1250 },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.click(canvas.getByRole('button', { name: 'Ustaw 45 zł' }));
    await expect(input).toHaveValue('45,00');
    await userEvent.click(canvas.getByRole('button', { name: 'Wyczyść' }));
    await expect(input).toHaveValue('');
  },
};

export const Disabled: Story = {
  args: { value: 1250, disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled();
  },
};
