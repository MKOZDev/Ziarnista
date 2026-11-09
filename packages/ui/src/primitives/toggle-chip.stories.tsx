import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';
import { ToggleChip, type ToggleChipProps } from './toggle-chip';

function Controlled({ pressed: initial, onPressedChange, ...props }: ToggleChipProps) {
  const [pressed, setPressed] = useState(initial);
  return (
    <ToggleChip
      {...props}
      pressed={pressed}
      onPressedChange={(next) => {
        setPressed(next);
        onPressedChange(next);
      }}
    />
  );
}

const meta = {
  title: 'Primitives/ToggleChip',
  component: ToggleChip,
  args: { children: 'Niski stan', pressed: false, onPressedChange: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof ToggleChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const chip = canvas.getByRole('button', { name: 'Niski stan' });
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await expect(chip).toHaveAttribute('type', 'button');

    await userEvent.click(chip);
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(args.onPressedChange).toHaveBeenLastCalledWith(true);
    await expect(chip.querySelector('svg')).toBeInTheDocument();

    await userEvent.click(chip);
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onPressedChange).toHaveBeenLastCalledWith(false);
  },
};

export const On: Story = { args: { pressed: true } };

export const WithAddIconOff: Story = {
  args: { children: 'Drip', showAddIcon: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button').querySelector('svg')).toBeInTheDocument();
  },
};

export const WithAddIconOn: Story = {
  args: { children: 'Drip', showAddIcon: true, pressed: true },
};

export const Small: Story = {
  args: { size: 'sm' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button').getBoundingClientRect().height).toBe(32);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    const chip = canvas.getByRole('button');
    await userEvent.click(chip);
    await expect(args.onPressedChange).not.toHaveBeenCalled();
  },
};

export const DisabledOn: Story = { args: { disabled: true, pressed: true } };
