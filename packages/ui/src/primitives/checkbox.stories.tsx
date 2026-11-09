import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Checkbox } from './checkbox';

const meta = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  args: { label: 'Pokaż tylko aktywne', onCheckedChange: fn() },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithLabel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Pokaż tylko aktywne' });
    await userEvent.click(canvas.getByText('Pokaż tylko aktywne'));
    await expect(checkbox).toBeChecked();
    // The label must not trigger a second toggle
    await expect(args.onCheckedChange).toHaveBeenCalledOnce();
  },
};

export const Checked: Story = { args: { defaultChecked: true } };

export const Indeterminate: Story = {
  args: { checked: 'indeterminate' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox')).toBePartiallyChecked();
  },
};

export const WithoutVisibleLabel: Story = {
  args: { label: undefined, 'aria-label': 'Zaznacz wszystkie na stronie' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('checkbox', { name: 'Zaznacz wszystkie na stronie' }),
    ).toBeInTheDocument();
  },
};

export const Keyboard: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.tab();
    const checkbox = canvas.getByRole('checkbox');
    await expect(checkbox).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(checkbox).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

export const TargetSize: Story = {
  args: { label: undefined, 'aria-label': 'Zaznacz wiersz' },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole('checkbox');
    const box = checkbox.getBoundingClientRect();
    await expect(box.width).toBe(16);
    // The whole 24 px target must hit the control, so 4 px beyond each edge
    await expect(document.elementFromPoint(box.left - 4, box.top - 4)).toBe(checkbox);
    await expect(document.elementFromPoint(box.right + 3.5, box.bottom + 3.5)).toBe(checkbox);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Pokaż tylko aktywne'));
    await expect(canvas.getByRole('checkbox')).not.toBeChecked();
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};

export const DisabledChecked: Story = { args: { disabled: true, defaultChecked: true } };
