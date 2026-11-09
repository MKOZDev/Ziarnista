import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';
import { BulkActionBar } from './bulk-action-bar';
import { Button } from './button';

const meta = {
  title: 'Composites/BulkActionBar',
  component: BulkActionBar,
  args: {
    count: 3,
    onClear: fn(),
    children: (
      <>
        <Button variant="secondary" size="sm">
          Ustaw jako aktywne
        </Button>
        <Button variant="destructive-outline" size="sm">
          Archiwizuj
        </Button>
      </>
    ),
  },
} satisfies Meta<typeof BulkActionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Zaznaczono: 3');
    await expect(canvas.getByRole('button', { name: 'Archiwizuj' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Odznacz' }));
    await expect(args.onClear).toHaveBeenCalledOnce();
  },
};

export const NothingSelected: Story = {
  args: { count: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toBeEmptyDOMElement();
  },
};

function Toggling() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Button onClick={() => setCount(2)}>Zaznacz</Button>
      <BulkActionBar count={count} onClear={() => setCount(0)}>
        <Button size="sm">Archiwizuj</Button>
      </BulkActionBar>
    </>
  );
}

export const LiveRegionStaysMounted: Story = {
  render: () => <Toggling />,
  play: async ({ canvas, userEvent }) => {
    const region = canvas.getByRole('status');
    await userEvent.click(canvas.getByRole('button', { name: 'Zaznacz' }));
    await expect(canvas.getByRole('status')).toBe(region);
    await expect(region).toHaveTextContent('Zaznaczono: 2');
  },
};
