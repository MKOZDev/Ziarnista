import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Thumbnail } from './thumbnail';

const IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%238a9a7b"/%3E%3C/svg%3E';

const meta = {
  title: 'Primitives/Thumbnail',
  component: Thumbnail,
  args: { name: 'Etiopia Guji' },
} satisfies Meta<typeof Thumbnail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: { src: IMAGE, alt: 'Opakowanie kawy' },
  play: async ({ canvas }) => {
    const image = canvas.getByRole('img', { name: 'Opakowanie kawy' });
    await expect(image.tagName).toBe('IMG');
    await expect(image.getBoundingClientRect().width).toBe(40);
  },
};

export const Placeholder: Story = {
  args: { alt: 'Etiopia Guji' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Etiopia Guji' })).toHaveTextContent(/^EG$/);
  },
};

export const DecorativePlaceholder: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('img')).not.toBeInTheDocument();
    await expect(canvas.getByText('EG')).toHaveAttribute('aria-hidden', 'true');
  },
};

export const NoImageFromApi: Story = {
  args: { src: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('EG')).toBeInTheDocument();
  },
};
