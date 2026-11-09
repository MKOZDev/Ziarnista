import type { Meta, StoryObj } from '@storybook/react-vite';
import { Moon } from 'lucide-react';
import { expect, waitFor, within } from 'storybook/test';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  args: {
    content: 'Zmień motyw',
    children: (
      <IconButton aria-label="Zmień motyw">
        <Moon aria-hidden />
      </IconButton>
    ),
  },
  decorators: [
    (Story) => (
      <div className="grid h-32 place-items-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

// The content is rendered in a portal, outside the story canvas
const page = within(document.body);

export const OnHover: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.hover(canvas.getByRole('button'));
    await expect(await page.findByRole('tooltip')).toHaveTextContent('Zmień motyw');
    await userEvent.unhover(canvas.getByRole('button'));
  },
};

export const OnKeyboardFocus: Story = {
  play: async ({ userEvent }) => {
    await userEvent.tab();
    await expect(await page.findByRole('tooltip')).toHaveTextContent('Zmień motyw');

    // WCAG 1.4.13: must be dismissible without moving focus
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page.queryByRole('tooltip')).not.toBeInTheDocument());
  },
};

export const Bottom: Story = { args: { side: 'bottom' } };
