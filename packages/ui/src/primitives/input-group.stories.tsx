import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Button } from './button';
import { InputGroup } from './input-group';

const meta = {
  title: 'Primitives/InputGroup',
  component: InputGroup,
  args: { 'aria-label': 'Adres URL' },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Addon: Story = {
  args: { addon: 'ziarnista.pl/produkt/', mono: true, defaultValue: 'etiopia-guji' },
};

export const SearchIcon: Story = {
  args: {
    size: 'md',
    type: 'search',
    'aria-label': 'Szukaj',
    placeholder: 'Szukaj po nazwie lub SKU',
    start: <Search aria-hidden />,
  },
};

function PasswordField() {
  const [visible, setVisible] = useState(false);
  return (
    <InputGroup
      aria-label="Hasło"
      type={visible ? 'text' : 'password'}
      defaultValue="tajne-haslo"
      end={
        <Button
          variant="ghost"
          size="sm"
          className="mr-0.5"
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? 'Ukryj' : 'Pokaż'}
        </Button>
      }
    />
  );
}

export const Password: Story = {
  render: () => <PasswordField />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvasElement.querySelector('input');
    await expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(canvas.getByRole('button', { name: 'Pokaż' }));
    await expect(input).toHaveAttribute('type', 'text');
    await expect(canvas.getByRole('button', { name: 'Ukryj' })).toBeInTheDocument();
  },
};

export const FocusRing: Story = {
  render: () => (
    <InputGroup
      aria-label="Hasło"
      end={
        <Button variant="ghost" size="sm" className="mr-0.5">
          Pokaż
        </Button>
      }
    />
  ),
  play: async ({ canvasElement, userEvent }) => {
    const wrapper = canvasElement.querySelector('[data-slot="input-group"]') as HTMLElement;

    await userEvent.tab();
    await expect(getComputedStyle(wrapper).outlineWidth).toBe('2px');

    // Focus moved to the button: only the button is ringed now
    await userEvent.tab();
    await expect(getComputedStyle(wrapper).outlineStyle).toBe('none');
  },
};

export const Invalid: Story = {
  args: { addon: 'ziarnista.pl/produkt/', 'aria-invalid': true, defaultValue: 'zły slug' },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('textbox')).toBeInvalid();
    const wrapper = canvasElement.querySelector('[data-slot="input-group"]') as HTMLElement;
    const isDark = document.documentElement.classList.contains('dark');
    await expect(getComputedStyle(wrapper).borderTopColor).toBe(
      isDark ? 'rgb(240, 154, 146)' : 'rgb(179, 38, 30)',
    );
  },
};

export const Disabled: Story = {
  args: { addon: 'ziarnista.pl/produkt/', disabled: true, defaultValue: 'etiopia-guji' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled();
  },
};
