import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { CountBadge } from './count-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta = {
  title: 'Primitives/Tabs',
  component: Tabs,
  args: { defaultValue: 'all' },
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Status zamówienia">
        <TabsTrigger value="all">
          Wszystkie <CountBadge>18</CountBadge>
        </TabsTrigger>
        <TabsTrigger value="paid">
          Opłacone <CountBadge>4</CountBadge>
        </TabsTrigger>
        <TabsTrigger value="shipped" disabled>
          Wysłane <CountBadge>0</CountBadge>
        </TabsTrigger>
        <TabsTrigger value="cancelled">
          Anulowane <CountBadge>2</CountBadge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">Wszystkie zamówienia</TabsContent>
      <TabsContent value="paid">Zamówienia opłacone</TabsContent>
      <TabsContent value="shipped">Zamówienia wysłane</TabsContent>
      <TabsContent value="cancelled">Zamówienia anulowane</TabsContent>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('tablist', { name: 'Status zamówienia' })).toBeInTheDocument();
    await expect(canvas.getByRole('tab', { selected: true })).toHaveTextContent('Wszystkie');

    await userEvent.click(canvas.getByRole('tab', { name: /Opłacone/ }));
    await expect(canvas.getByRole('tab', { selected: true })).toHaveTextContent('Opłacone');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Zamówienia opłacone');
  },
};

export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('tab', { name: /Wszystkie/ })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    // The disabled tab is skipped
    await expect(canvas.getByRole('tab', { name: /Anulowane/ })).toHaveFocus();
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Zamówienia anulowane');

    await userEvent.tab();
    await expect(canvas.getByRole('tabpanel')).toHaveFocus();
  },
};

export const SecondTabActive: Story = { args: { defaultValue: 'paid' } };
