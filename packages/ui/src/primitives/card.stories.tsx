import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Button } from './button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from './card';

const meta = {
  title: 'Primitives/Card',
  component: Card,
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Podstawowe informacje</CardTitle>
        <CardDescription>Nazwa i opis widoczne w sklepie.</CardDescription>
      </CardHeader>
      <CardContent>Treść karty.</CardContent>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Podstawowe informacje' }),
    ).toBeInTheDocument();
  },
};

export const WithAction: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Warianty</CardTitle>
        <CardDescription>Gramatura, cena i stan magazynu.</CardDescription>
        <CardAction>
          <Button variant="secondary" size="sm">
            Dodaj wariant
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>Treść karty.</CardContent>
    </Card>
  ),
};

export const HeadingLevel: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle as="h3">Nagłówek trzeciego poziomu</CardTitle>
      </CardHeader>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 3 })).toBeInTheDocument();
  },
};

export const WithoutPadding: Story = {
  args: { padding: 'none' },
  render: (args) => (
    <Card {...args}>
      <div className="bg-muted px-5 py-3 text-caption text-muted-foreground uppercase">Produkt</div>
      <div className="px-5 py-3">Etiopia Yirgacheffe</div>
    </Card>
  ),
};

export const Dashed: Story = {
  args: { variant: 'dashed' },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Brak produktów</CardTitle>
        <CardDescription>Dodaj pierwszy produkt, aby zacząć.</CardDescription>
      </CardHeader>
    </Card>
  ),
};
