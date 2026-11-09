import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { TextLink } from './text-link';

const meta = {
  title: 'Primitives/TextLink',
  component: TextLink,
  args: { href: '#regulamin', children: 'regulamin' },
} satisfies Meta<typeof TextLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inline: Story = {
  render: (args) => (
    <p>
      Przed publikacją sprawdź <TextLink {...args} /> sklepu.
    </p>
  ),
};

export const Back: Story = {
  args: { variant: 'back', href: '#produkty', children: 'Produkty' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Produkty' });
    await expect(link.querySelector('svg')).toBeInTheDocument();
  },
};

export const BackAsChild: Story = {
  render: () => (
    <TextLink asChild variant="back">
      <a href="#produkty">Produkty</a>
    </TextLink>
  ),
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(1);
    await expect(links[0]).toHaveTextContent('Produkty');
    await expect(links[0]?.querySelector('svg')).toBeInTheDocument();
  },
};
