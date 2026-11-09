import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Avatar } from './avatar';

const meta = {
  title: 'Primitives/Avatar',
  component: Avatar,
  args: { name: 'Anna Kowalczyk' },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Anna Kowalczyk' })).toHaveTextContent(/^AK$/);
  },
};

export const SingleName: Story = {
  args: { name: 'Admin' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img')).toHaveTextContent(/^A$/);
  },
};

export const InitialsEdgeCases: Story = {
  args: { name: '  łukasz   żak  Nowak ' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img')).toHaveTextContent(/^ŁŻ$/);
  },
};

export const Decorative: Story = {
  render: (args) => (
    <div className="flex items-center gap-2" data-testid="profile">
      <Avatar {...args} decorative />
      <span>{args.name}</span>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('img')).not.toBeInTheDocument();
    await expect(canvas.getByTestId('profile').firstElementChild).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  },
};
