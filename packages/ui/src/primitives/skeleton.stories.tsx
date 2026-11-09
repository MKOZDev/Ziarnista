import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Skeleton } from './skeleton';

const meta = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Shapes: Story = {
  render: () => (
    <div className="grid max-w-sm gap-3" data-testid="shapes">
      <Skeleton className="h-28" />
      <Skeleton shape="line" className="w-48" />
      <Skeleton shape="pill" className="w-20" />
    </div>
  ),
  play: async ({ canvas }) => {
    const shapes = Array.from(canvas.getByTestId('shapes').children);
    await expect(shapes).toHaveLength(3);
    for (const shape of shapes) {
      await expect(shape).toHaveAttribute('aria-hidden', 'true');
      await expect(getComputedStyle(shape).animationName).toBe('skeleton');
    }
  },
};

export const TableRow: Story = {
  render: () => (
    <div className="flex max-w-xl items-center gap-3">
      <Skeleton className="size-10 rounded-md" />
      <div className="grid flex-1 gap-2">
        <Skeleton shape="line" className="w-3/5" />
        <Skeleton shape="line" className="w-1/4" />
      </div>
      <Skeleton shape="pill" className="w-20" />
    </div>
  ),
};
