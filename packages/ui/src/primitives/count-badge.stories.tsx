import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountBadge } from './count-badge';

const meta = {
  title: 'Primitives/CountBadge',
  component: CountBadge,
  args: { children: 12 },
} satisfies Meta<typeof CountBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Solid: Story = { args: { variant: 'solid' } };

export const Muted: Story = { args: { variant: 'muted' } };

export const Plain: Story = { args: { variant: 'plain' } };

export const SingleDigit: Story = { args: { variant: 'solid', children: 3 } };

export const OnMutedBackground: Story = {
  args: { variant: 'plain' },
  decorators: [
    (Story) => (
      <div className="w-fit rounded-md bg-muted p-3">
        <Story />
      </div>
    ),
  ],
};
