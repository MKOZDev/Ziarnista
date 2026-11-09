import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { SummaryList } from './summary-list';
import { Timeline } from './timeline';

const meta = {
  title: 'Composites/Lists',
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Summary: Story = {
  render: () => (
    <SummaryList
      items={[
        { label: 'Suma częściowa', value: '149,99 zł' },
        { label: 'Dostawa', value: '14,99 zł' },
        { label: 'Razem', value: '164,98 zł', emphasized: true },
      ]}
    />
  ),
  play: async ({ canvas }) => {
    const terms = canvas.getAllByRole('term');
    const values = canvas.getAllByRole('definition');
    await expect(terms).toHaveLength(3);
    await expect(values[2]).toHaveTextContent('164,98 zł');
  },
};

export const History: Story = {
  render: () => (
    <Timeline
      items={[
        { id: '1', title: 'Wysłane', meta: '9 lis, 14:20', active: true },
        { id: '2', title: 'Opłacone', meta: '9 lis, 10:05', note: 'Płatność kartą' },
        { id: '3', title: 'Oczekuje', meta: '9 lis, 10:01' },
      ]}
    />
  ),
  play: async ({ canvas }) => {
    const entries = within(canvas.getByRole('list')).getAllByRole('listitem');
    await expect(entries).toHaveLength(3);
    await expect(entries[0]).toHaveAttribute('aria-current', 'step');
    await expect(entries[1]).not.toHaveAttribute('aria-current');
    await expect(entries[1]).toHaveTextContent('Płatność kartą');
  },
};
