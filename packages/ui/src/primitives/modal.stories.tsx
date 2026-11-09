import type { Meta, StoryObj } from '@storybook/react-vite';
import { StrictMode, useRef, useState } from 'react';
import { expect, fireEvent, fn, waitFor, within } from 'storybook/test';
import { clickAt, clickBackdrop, pressEscape } from '../test-utils/dialog';
import { Button } from './button';
import { Input } from './input';
import { Modal, type ModalProps } from './modal';
import { Tooltip } from './tooltip';

// Acceptance tests for Modal. Native <dialog>; the implementation is free otherwise.

const page = within(document.body);

function getDialog(role: 'dialog' | 'alertdialog' = 'dialog') {
  return page.getByRole<HTMLDialogElement>(role);
}

function isOpenModally(dialog: HTMLDialogElement) {
  return dialog.matches(':modal');
}

function isScrollLocked() {
  return [document.documentElement, document.body].some(
    (element) => getComputedStyle(element).overflow === 'hidden',
  );
}

type HarnessProps = Partial<ModalProps> & { ignoreClose?: boolean; initiallyOpen?: boolean };

function Harness({ ignoreClose = false, initiallyOpen = false, ...props }: HarnessProps) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Otwórz</Button>
      <Modal
        title="Edytuj kategorię"
        footer={<Button onClick={() => setOpen(false)}>Zamknij</Button>}
        {...props}
        open={open}
        onOpenChange={(next) => {
          props.onOpenChange?.(next);
          if (!ignoreClose) setOpen(next);
        }}
      >
        {props.children ?? <p>Treść okna</p>}
      </Modal>
    </>
  );
}

const meta = {
  title: 'Composites/Modal',
  component: Harness,
  args: { onOpenChange: fn() },
} satisfies Meta<typeof Harness>;

export default meta;

type Story = StoryObj<typeof meta>;

type PlayContext = Parameters<NonNullable<Story['play']>>[0];

async function open({ canvas, userEvent }: PlayContext) {
  await userEvent.click(canvas.getByRole('button', { name: 'Otwórz' }));
}

export const OpensAsNativeModal: Story = {
  play: async (context) => {
    await open(context);
    const dialog = getDialog();
    await expect(dialog.tagName).toBe('DIALOG');
    // :modal only matches showModal(), not the open attribute
    await expect(isOpenModally(dialog)).toBe(true);
  },
};

export const ClosedIsHidden: Story = {
  play: async () => {
    await expect(page.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const NamedByTitle: Story = {
  play: async (context) => {
    await open(context);
    const dialog = getDialog();
    await expect(dialog).toHaveAccessibleName('Edytuj kategorię');
    await expect(
      within(dialog).getByRole('heading', { level: 2, name: 'Edytuj kategorię' }),
    ).toBeInTheDocument();
  },
};

export const DescribedByDescription: Story = {
  args: { description: 'Zmiany będą widoczne w sklepie.' },
  play: async (context) => {
    await open(context);
    await expect(getDialog()).toHaveAccessibleDescription('Zmiany będą widoczne w sklepie.');
  },
};

export const FocusesFirstFocusable: Story = {
  args: { children: <Input aria-label="Nazwa" /> },
  play: async (context) => {
    await open(context);
    await expect(within(getDialog()).getByRole('textbox', { name: 'Nazwa' })).toHaveFocus();
  },
};

function WithInitialFocus(props: HarnessProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Harness {...props} initialFocusRef={ref}>
      <Input aria-label="Pierwsze" />
      <Input aria-label="Drugie" ref={ref} />
    </Harness>
  );
}

export const FocusesInitialFocusRef: Story = {
  render: (args) => <WithInitialFocus {...args} />,
  play: async (context) => {
    await open(context);
    await expect(within(getDialog()).getByRole('textbox', { name: 'Drugie' })).toHaveFocus();
  },
};

export const ReturnsFocusOnClose: Story = {
  play: async (context) => {
    await open(context);
    await context.userEvent.click(within(getDialog()).getByRole('button', { name: 'Zamknij' }));
    await expect(page.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(context.canvas.getByRole('button', { name: 'Otwórz' })).toHaveFocus();
  },
};

export const EscapeCloses: Story = {
  play: async (context) => {
    await open(context);
    const dialog = getDialog();
    pressEscape(dialog);

    await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(context.args.onOpenChange).toHaveBeenCalledOnce();
    await expect(context.args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(context.canvas.getByRole('button', { name: 'Otwórz' })).toHaveFocus();
  },
};

// open is controlled: without the parent's consent the dialog must not close by itself
export const StaysOpenWhenParentRefuses: Story = {
  args: { ignoreClose: true },
  play: async (context) => {
    await open(context);
    const dialog = getDialog();
    pressEscape(dialog);

    await expect(context.args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(isOpenModally(dialog)).toBe(true);
  },
};

export const BackdropCloses: Story = {
  play: async (context) => {
    await open(context);
    await clickBackdrop();
    await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(context.args.onOpenChange).toHaveBeenCalledWith(false);
  },
};

export const ClickInsideKeepsOpen: Story = {
  play: async (context) => {
    await open(context);
    const dialog = getDialog();
    const box = dialog.getBoundingClientRect();

    // Also the edge of the panel: padding must not count as the backdrop (corners are rounded off)
    await clickAt(box.left + 2, box.top + box.height / 2);
    await clickAt(box.left + box.width / 2, box.top + box.height / 2);

    await expect(context.args.onOpenChange).not.toHaveBeenCalled();
    await expect(isOpenModally(dialog)).toBe(true);
  },
};

export const AlertDialogIgnoresBackdrop: Story = {
  args: { role: 'alertdialog' },
  play: async (context) => {
    await open(context);
    const dialog = getDialog('alertdialog');
    await clickBackdrop();
    await expect(context.args.onOpenChange).not.toHaveBeenCalled();
    await expect(isOpenModally(dialog)).toBe(true);
  },
};

export const AlertDialogClosesOnEscape: Story = {
  args: { role: 'alertdialog' },
  play: async (context) => {
    await open(context);
    pressEscape(getDialog('alertdialog'));
    await waitFor(() => expect(page.queryByRole('alertdialog')).not.toBeInTheDocument());
  },
};

export const PageBehindIsInert: Story = {
  play: async (context) => {
    await open(context);
    const dialog = getDialog();
    const focusedInside = document.activeElement;
    await expect(dialog).toContainElement(focusedInside as HTMLElement);

    context.canvas.getByRole('button', { name: 'Otwórz', hidden: true }).focus();
    await expect(document.activeElement).toBe(focusedInside);
  },
};

export const LocksPageScroll: Story = {
  play: async (context) => {
    await expect(isScrollLocked()).toBe(false);
    await open(context);
    await expect(isScrollLocked()).toBe(true);

    pressEscape(getDialog());
    await waitFor(() => expect(isScrollLocked()).toBe(false));
  },
};

function RemovedWhileOpen() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
      >
        Otwórz
      </Button>
      {mounted && (
        <Modal
          title="Sesja wygasła"
          open={open}
          onOpenChange={setOpen}
          footer={<Button onClick={() => setMounted(false)}>Usuń okno</Button>}
        />
      )}
    </>
  );
}

// E.g. navigating away with the dialog open: no leftovers on the page
export const CleansUpWhenRemovedWhileOpen: Story = {
  render: () => <RemovedWhileOpen />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Otwórz' }));
    await expect(isScrollLocked()).toBe(true);

    await userEvent.click(within(getDialog()).getByRole('button', { name: 'Usuń okno' }));
    await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(isScrollLocked()).toBe(false);
    await expect(canvas.getByRole('button', { name: 'Otwórz' })).toHaveFocus();
  },
};

// StrictMode runs effects twice, and showModal() throws on an already open dialog
export const OpenOnMountInStrictMode: Story = {
  args: { initiallyOpen: true },
  decorators: [
    (Story) => (
      <StrictMode>
        <Story />
      </StrictMode>
    ),
  ],
  play: async () => {
    await expect(isOpenModally(getDialog())).toBe(true);
    await expect(isScrollLocked()).toBe(true);
  },
};

export const CanBeReopened: Story = {
  play: async (context) => {
    await open(context);
    pressEscape(getDialog());
    await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
    await open(context);
    await expect(isOpenModally(getDialog())).toBe(true);
  },
};

export const IsCentered: Story = {
  play: async (context) => {
    await open(context);
    const box = getDialog().getBoundingClientRect();
    await expect(box.left).toBeGreaterThan(0);
    await expect(Math.abs(box.left - (window.innerWidth - box.right))).toBeLessThanOrEqual(1);
    await expect(Math.abs(box.top - (window.innerHeight - box.bottom))).toBeLessThanOrEqual(1);
  },
};

export const UsesOverlayToken: Story = {
  play: async (context) => {
    await open(context);
    const isDark = document.documentElement.classList.contains('dark');
    await expect(getComputedStyle(getDialog(), '::backdrop').backgroundColor).toBe(
      isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(43, 29, 20, 0.35)',
    );
  },
};

// A portal to <body> would land behind the dialog: see lib/portal-container.tsx
export const TooltipInsideIsReachable: Story = {
  args: {
    children: (
      <Tooltip content="Podpowiedź w oknie">
        <Button variant="secondary">Pomoc</Button>
      </Tooltip>
    ),
  },
  play: async (context) => {
    await open(context);
    const dialog = getDialog();
    await context.userEvent.hover(within(dialog).getByRole('button', { name: 'Pomoc' }));
    const tooltip = await page.findByRole('tooltip');
    await expect(dialog).toContainElement(tooltip);
  },
};

export const AllContent: Story = {
  args: {
    initiallyOpen: true,
    description: 'Zmiany będą widoczne w sklepie.',
    children: <Input aria-label="Nazwa kategorii" defaultValue="Kawy ziarniste" />,
  },
};

// Chrome skips the cancel event on a repeated Esc and closes the dialog directly
export const SyncsAfterClosingWithoutCancel: Story = {
  play: async (context) => {
    await open(context);
    getDialog().close();

    await waitFor(() => expect(context.args.onOpenChange).toHaveBeenCalledWith(false));
    await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());

    await open(context);
    await expect(isOpenModally(getDialog())).toBe(true);
  },
};

export const RestoredWhenParentRefusesDirectClose: Story = {
  args: { ignoreClose: true },
  play: async (context) => {
    await open(context);
    const dialog = getDialog();
    dialog.close();

    await waitFor(() => expect(context.args.onOpenChange).toHaveBeenCalledWith(false));
    await waitFor(() => expect(isOpenModally(dialog)).toBe(true));
  },
};

// Selecting text and releasing the mouse outside the panel is not a dismissal
export const DragFromInsideKeepsOpen: Story = {
  play: async (context) => {
    await open(context);
    const dialog = getDialog();

    await fireEvent.mouseDown(within(dialog).getByText('Treść okna'));
    await fireEvent.mouseUp(dialog);
    await fireEvent.click(dialog);

    await expect(context.args.onOpenChange).not.toHaveBeenCalled();
    await expect(isOpenModally(dialog)).toBe(true);
  },
};
