import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ProgressBar } from './progress-bar';

const meta = {
  title: 'Primitives/ProgressBar',
  component: ProgressBar,
  args: { value: 64, 'aria-label': 'Udział w sprzedaży' },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

function fillRatio(meter: HTMLElement) {
  const fill = meter.firstElementChild as HTMLElement;
  return fill.getBoundingClientRect().width / meter.getBoundingClientRect().width;
}

export const Default: Story = {
  play: async ({ canvas }) => {
    const meter = canvas.getByRole('meter', { name: 'Udział w sprzedaży' });
    await expect(meter).toHaveAttribute('aria-valuenow', '64');
    await expect(fillRatio(meter)).toBeCloseTo(0.64, 2);
  },
};

export const Empty: Story = {
  args: { value: 0 },
  play: async ({ canvas }) => {
    await expect(fillRatio(canvas.getByRole('meter'))).toBe(0);
  },
};

export const Full: Story = { args: { value: 100 } };

export const ClampsOutOfRange: Story = {
  args: { value: 140 },
  play: async ({ canvas }) => {
    const meter = canvas.getByRole('meter');
    await expect(meter).toHaveAttribute('aria-valuenow', '100');
    await expect(fillRatio(meter)).toBe(1);
  },
};
