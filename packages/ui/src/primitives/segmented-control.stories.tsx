import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';
import { SegmentedControl, type SegmentedControlProps } from './segmented-control';

const OPTIONS = [
  { value: '7d', label: '7 dni' },
  { value: '30d', label: '30 dni' },
  { value: '90d', label: '90 dni' },
] as const;

type Period = (typeof OPTIONS)[number]['value'];

function Controlled({ value: initial, onValueChange, ...props }: SegmentedControlProps<Period>) {
  const [value, setValue] = useState(initial);
  return (
    <SegmentedControl
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    />
  );
}

const meta = {
  title: 'Primitives/SegmentedControl',
  component: Controlled,
  args: {
    'aria-label': 'Okres',
    options: OPTIONS,
    value: '30d',
    onValueChange: fn(),
  },
} satisfies Meta<typeof Controlled>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('radio', { name: '30 dni' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: '7 dni' }));
    await expect(canvas.getByRole('radio', { name: '7 dni' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: '30 dni' })).not.toBeChecked();
    await expect(args.onValueChange).toHaveBeenCalledOnce();
    await expect(args.onValueChange).toHaveBeenCalledWith('7d');
  },
};

export const KeepsSelection: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const active = canvas.getByRole('radio', { name: '30 dni' });
    await userEvent.click(active);
    await expect(active).toBeChecked();
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: '30 dni' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    const next = canvas.getByRole('radio', { name: '90 dni' });
    await expect(next).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(next).toBeChecked();
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="grid justify-start gap-2" data-testid="sizes">
      <Controlled {...args} size="sm" />
      <Controlled {...args} size="md" />
      <Controlled {...args} size="lg" />
    </div>
  ),
  play: async ({ canvas }) => {
    const heights = Array.from(canvas.getByTestId('sizes').children).map(
      (group) => group.getBoundingClientRect().height,
    );
    await expect(heights).toEqual([32, 36, 40]);
  },
};

export const DisabledOption: Story = {
  args: {
    options: [OPTIONS[0], OPTIONS[1], { ...OPTIONS[2], disabled: true }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: '90 dni' })).toBeDisabled();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
