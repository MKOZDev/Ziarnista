import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import { clickBackdrop, pressEscape } from '../test-utils/dialog';
import { Button } from './button';
import { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';

// Acceptance tests for ConfirmDialog, built on top of Modal

const page = within(document.body);

function getDialog() {
  return page.getByRole<HTMLDialogElement>('alertdialog');
}

function Harness({ onOpenChange, ...props }: Omit<ConfirmDialogProps, 'open'>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Otwórz</Button>
      <ConfirmDialog
        {...props}
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next);
          setOpen(next);
        }}
      />
    </>
  );
}

const meta = {
  title: 'Composites/ConfirmDialog',
  component: Harness,
  args: {
    title: 'Anulować zamówienie?',
    description: 'Tej operacji nie można cofnąć.',
    confirmLabel: 'Anuluj zamówienie',
    onConfirm: fn(),
    onOpenChange: fn(),
  },
} satisfies Meta<typeof Harness>;

export default meta;

type Story = StoryObj<typeof meta>;

type PlayContext = Parameters<NonNullable<Story['play']>>[0];

async function open({ canvas, userEvent }: PlayContext) {
  await userEvent.click(canvas.getByRole('button', { name: 'Otwórz' }));
}

export const Default: Story = {
  play: async (context) => {
    await open(context);
    const dialog = getDialog();
    await expect(dialog).toHaveAccessibleName('Anulować zamówienie?');
    await expect(dialog).toHaveAccessibleDescription('Tej operacji nie można cofnąć.');
    await expect(within(dialog).getByRole('button', { name: 'Wróć' })).toBeInTheDocument();
    await expect(
      within(dialog).getByRole('button', { name: 'Anuluj zamówienie' }),
    ).toBeInTheDocument();
  },
};

export const FocusStartsOnSafeAction: Story = {
  play: async (context) => {
    await open(context);
    await expect(within(getDialog()).getByRole('button', { name: 'Wróć' })).toHaveFocus();
  },
};

export const CustomCancelLabel: Story = {
  args: { cancelLabel: 'Zostaw zamówienie' },
  play: async (context) => {
    await open(context);
    await expect(
      within(getDialog()).getByRole('button', { name: 'Zostaw zamówienie' }),
    ).toBeInTheDocument();
  },
};

export const CancelCloses: Story = {
  play: async (context) => {
    await open(context);
    await context.userEvent.click(within(getDialog()).getByRole('button', { name: 'Wróć' }));
    await waitFor(() => expect(page.queryByRole('alertdialog')).not.toBeInTheDocument());
    await expect(context.args.onConfirm).not.toHaveBeenCalled();
  },
};

// The action can fail, so closing is left to the parent
export const ConfirmDoesNotCloseByItself: Story = {
  play: async (context) => {
    await open(context);
    await context.userEvent.click(
      within(getDialog()).getByRole('button', { name: 'Anuluj zamówienie' }),
    );
    await expect(context.args.onConfirm).toHaveBeenCalledOnce();
    await expect(context.args.onOpenChange).not.toHaveBeenCalled();
    await expect(getDialog()).toBeInTheDocument();
  },
};

export const BackdropDoesNotClose: Story = {
  play: async (context) => {
    await open(context);
    await clickBackdrop();
    await expect(context.args.onOpenChange).not.toHaveBeenCalled();
    await expect(getDialog().matches(':modal')).toBe(true);
  },
};

export const EscapeCancels: Story = {
  play: async (context) => {
    await open(context);
    pressEscape(getDialog());
    await waitFor(() => expect(page.queryByRole('alertdialog')).not.toBeInTheDocument());
    await expect(context.args.onConfirm).not.toHaveBeenCalled();
  },
};

export const LoadingBlocksEverything: Story = {
  args: { loading: true },
  play: async (context) => {
    await open(context);
    const dialog = getDialog();
    const confirm = within(dialog).getByRole('button', { name: 'Anuluj zamówienie' });

    await expect(confirm).toHaveAttribute('aria-busy', 'true');
    await context.userEvent.click(confirm);
    await expect(context.args.onConfirm).not.toHaveBeenCalled();

    await expect(within(dialog).getByRole('button', { name: 'Wróć' })).toBeDisabled();

    pressEscape(dialog);
    await expect(context.args.onOpenChange).not.toHaveBeenCalled();
    await expect(dialog.matches(':modal')).toBe(true);
  },
};

export const PrimaryVariant: Story = {
  args: {
    variant: 'primary',
    title: 'Opublikować produkt?',
    description: 'Produkt pojawi się w sklepie.',
    confirmLabel: 'Opublikuj',
  },
  play: async (context) => {
    await open(context);
    await expect(
      within(getDialog()).getByRole('button', { name: 'Opublikuj' }),
    ).toBeInTheDocument();
  },
};
