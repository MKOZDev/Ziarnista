import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { BarChart, type BarChartPoint } from './bar-chart';

const WEEK: BarChartPoint[] = [
  { label: 'Pon', value: 320 },
  { label: 'Wt', value: 480 },
  { label: 'Śr', value: 0 },
  { label: 'Czw', value: 730 },
  { label: 'Pt', value: 610 },
  { label: 'Sob', value: 890 },
  { label: 'Ndz', value: 540 },
];

const MONTH: BarChartPoint[] = Array.from({ length: 30 }, (_, index) => ({
  label: `${index + 1} lis`,
  value: 200 + ((index * 37) % 500),
}));

const money = (value: number) => `${value} zł`;

const meta = {
  title: 'Composites/BarChart',
  component: BarChart,
  args: { caption: 'Sprzedaż w tygodniu', data: WEEK, formatValue: money },
  decorators: [
    (Story) => (
      <div className="max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BarChart>;

export default meta;

type Story = StoryObj<typeof meta>;

function fills(element: HTMLElement) {
  return Array.from(element.querySelectorAll<HTMLElement>('[data-bar-fill]'));
}

function tooltip(element: HTMLElement) {
  return element.querySelector('[data-slot="bar-chart-tooltip"]');
}

export const Week: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('group', { name: 'Sprzedaż w tygodniu' })).toBeInTheDocument();
    await expect(canvas.getByRole('img', { name: 'Sob: 890 zł' })).toBeInTheDocument();

    const [monday, , wednesday, , , saturday] = fills(canvasElement);
    const height = (bar?: HTMLElement) => bar?.getBoundingClientRect().height ?? -1;
    await expect(height(wednesday)).toBe(0);
    // Same scale for every bar: 320 and 890 against an axis ending at 1000, in a 219 px plot
    await expect(height(monday)).toBeCloseTo(219 * 0.32, 0);
    await expect(height(saturday)).toBeCloseTo(219 * 0.89, 0);
  },
};

export const BarsStayThin: Story = {
  play: async ({ canvasElement }) => {
    for (const bar of fills(canvasElement)) {
      await expect(bar.getBoundingClientRect().width).toBeLessThanOrEqual(24);
    }
  },
};

export const DataTableForScreenReaders: Story = {
  play: async ({ canvas }) => {
    const table = canvas.getByRole('table', { name: 'Sprzedaż w tygodniu' });
    await expect(table).toHaveClass('sr-only');
    await expect(canvas.getByRole('cell', { name: '890 zł' })).toBeInTheDocument();
    await expect(canvas.getByRole('columnheader', { name: 'Okres' })).toBeInTheDocument();
  },
};

export const TooltipOnHover: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(tooltip(canvasElement)).not.toBeInTheDocument();
    await userEvent.hover(canvas.getByRole('img', { name: 'Czw: 730 zł' }));
    await expect(tooltip(canvasElement)).toHaveTextContent('730 zł Czw');

    await userEvent.unhover(canvas.getByRole('group'));
    await waitFor(() => expect(tooltip(canvasElement)).not.toBeInTheDocument());
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const bars = canvas.getAllByRole('img');
    // One tab stop for the whole chart
    await expect(bars.filter((bar) => bar.tabIndex === 0)).toHaveLength(1);

    await userEvent.tab();
    await expect(canvas.getByRole('img', { name: 'Pon: 320 zł' })).toHaveFocus();
    await expect(tooltip(canvasElement)).toHaveTextContent('320 zł');

    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('img', { name: 'Wt: 480 zł' })).toHaveFocus();
    await expect(tooltip(canvasElement)).toHaveTextContent('480 zł');

    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('img', { name: 'Ndz: 540 zł' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('img', { name: 'Ndz: 540 zł' })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('img', { name: 'Pon: 320 zł' })).toHaveFocus();
  },
};

export const Month: Story = {
  args: { caption: 'Sprzedaż w listopadzie', data: MONTH, formatTick: (value) => String(value) },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('img')).toHaveLength(30);
    await expect(canvas.getByText('1 lis', { ignore: 'td' })).toBeInTheDocument();
    await expect(canvas.queryByText('2 lis', { ignore: 'td' })).not.toBeInTheDocument();
  },
};

export const AllZero: Story = {
  args: { data: WEEK.map((point) => ({ ...point, value: 0 })) },
  play: async ({ canvasElement }) => {
    for (const bar of fills(canvasElement)) {
      await expect(bar.getBoundingClientRect().height).toBe(0);
    }
  },
};
