import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';
import { Pagination, type PaginationProps } from './pagination';

function Controlled({ page: initial, onPageChange, ...props }: PaginationProps) {
  const [page, setPage] = useState(initial);
  return (
    <Pagination
      {...props}
      page={page}
      onPageChange={(next) => {
        setPage(next);
        onPageChange(next);
      }}
    />
  );
}

const meta = {
  title: 'Primitives/Pagination',
  component: Pagination,
  args: { page: 1, pageSize: 8, total: 18, onPageChange: fn() },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('1–8 z 18')).toBeInTheDocument();
    await expect(canvas.getByRole('navigation', { name: 'Paginacja' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Strona 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Poprzednia strona' }));
    await expect(args.onPageChange).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole('button', { name: 'Strona 2' }));
    await expect(args.onPageChange).toHaveBeenCalledOnce();
    await expect(args.onPageChange).toHaveBeenCalledWith(2);
    await expect(canvas.getByText('9–16 z 18')).toBeInTheDocument();
  },
};

export const LastPageRange: Story = {
  args: { page: 3 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('17–18 z 18')).toBeInTheDocument();
  },
};

export const KeepsFocusOnLastPage: Story = {
  args: { page: 2 },
  play: async ({ args, canvas, userEvent }) => {
    const next = canvas.getByRole('button', { name: 'Następna strona' });
    next.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onPageChange).toHaveBeenLastCalledWith(3);

    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await expect(args.onPageChange).toHaveBeenCalledOnce();
  },
};

export const ManyPages: Story = {
  args: { page: 7, pageSize: 20, total: 400 },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('…')).toHaveLength(2);
  },
};

export const SinglePage: Story = {
  args: { total: 5 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('1–5 z 5')).toBeInTheDocument();
    await expect(canvas.queryByRole('navigation')).not.toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { total: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('0–0 z 0')).toBeInTheDocument();
  },
};
