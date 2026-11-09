import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { StatCard } from './stat-card';

const meta = {
  title: 'Composites/StatCard',
  component: StatCard,
  args: { label: 'Sprzedaż', value: '12 480,00 zł' },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const isDark = () => document.documentElement.classList.contains('dark');
const SUCCESS = () => (isDark() ? 'rgb(127, 203, 155)' : 'rgb(42, 114, 71)');
const DESTRUCTIVE = () => (isDark() ? 'rgb(240, 154, 146)' : 'rgb(179, 38, 30)');

export const WithoutChange: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/poprzedni okres/)).not.toBeInTheDocument();
  },
};

export const Increase: Story = {
  args: { change: { text: '+12,4%', direction: 'up' } },
  play: async ({ canvas }) => {
    const change = canvas.getByText('+12,4%');
    await expect(getComputedStyle(change).color).toBe(SUCCESS());
    await expect(change.querySelector('svg')).toBeInTheDocument();
    await expect(canvas.getByText(/poprzedni okres/)).toBeInTheDocument();
  },
};

export const Decrease: Story = {
  args: { change: { text: '−3,1%', direction: 'down' } },
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByText('−3,1%')).color).toBe(DESTRUCTIVE());
  },
};

export const DecreaseIsGood: Story = {
  args: {
    label: 'Zwroty',
    value: '4',
    change: { text: '−2', direction: 'down', isGood: true },
  },
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByText('−2')).color).toBe(SUCCESS());
  },
};

export const CustomContext: Story = {
  args: { change: { text: '+5%', direction: 'up' }, changeContext: 'vs ostatni tydzień' },
};
