import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { clearToasts } from '../lib/toast-store';
import { pressEscape } from '../test-utils/dialog';
import { Button } from './button';
import { Modal } from './modal';
import { toast, Toaster } from './toast';

const page = within(document.body);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getToast(message: string) {
  const element = page.getByText(message).closest<HTMLElement>('[data-slot="toast"]');
  if (!element) throw new Error(`No toast with: ${message}`);
  return element;
}

function closeButtonOf(element: HTMLElement) {
  return within(element).getByRole('button', { name: 'Zamknij powiadomienie' });
}

const meta = {
  title: 'Composites/Toast',
  component: Toaster,
  beforeEach: () => {
    clearToasts();
    return clearToasts;
  },
  render: () => (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={() => toast.success('Zapisano produkt')}>
        Sukces
      </Button>
      <Button variant="secondary" onClick={() => toast.error('Nie udało się zapisać produktu')}>
        Błąd
      </Button>
      <Toaster />
    </div>
  ),
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sukces' }));
    await page.findByText('Zapisano produkt');
    // Starts transparent: the entry animation has to get going first
    await waitFor(() => expect(page.getByText('Zapisano produkt')).toBeVisible());
    await waitFor(() =>
      expect(document.querySelector('[role="status"][aria-live="polite"]')).toHaveTextContent(
        'Zapisano produkt',
      ),
    );
  },
};

export const ErrorIsAssertive: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Błąd' }));
    await page.findByText('Nie udało się zapisać produktu');
    await waitFor(() => expect(page.getByText('Nie udało się zapisać produktu')).toBeVisible());
    await waitFor(() =>
      expect(document.querySelector('[role="status"][aria-live="assertive"]')).toHaveTextContent(
        'Nie udało się zapisać produktu',
      ),
    );
  },
};

export const LongMessage: Story = {
  play: async () => {
    toast.error(
      'Nie udało się zapisać produktu, ponieważ serwer jest chwilowo niedostępny. Spróbuj ponownie za chwilę.',
    );
    await page.findByText(/Nie udało się/);
  },
};

export const CloseButton: Story = {
  play: async ({ userEvent }) => {
    toast.success('Zapisano produkt');
    await page.findByText('Zapisano produkt');
    await userEvent.click(closeButtonOf(getToast('Zapisano produkt')));
    await waitFor(() => expect(page.queryByText('Zapisano produkt')).not.toBeInTheDocument());
  },
};

export const CloseButtonTargetSize: Story = {
  play: async () => {
    toast.success('Zapisano produkt');
    await page.findByText('Zapisano produkt');
    const box = closeButtonOf(getToast('Zapisano produkt')).getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(24);
    await expect(box.height).toBeGreaterThanOrEqual(24);
  },
};

export const DisappearsByItself: Story = {
  play: async () => {
    toast.success('Na chwilę', { duration: 150 });
    await page.findByText('Na chwilę');
    await waitFor(() => expect(page.queryByText('Na chwilę')).not.toBeInTheDocument());
  },
};

export const PausesOnHover: Story = {
  play: async ({ userEvent }) => {
    toast.success('Najedź na mnie', { duration: 300 });
    await page.findByText('Najedź na mnie');
    const element = getToast('Najedź na mnie');

    await userEvent.hover(element);
    await sleep(600);
    await expect(page.getByText('Najedź na mnie')).toBeInTheDocument();

    await userEvent.unhover(element);
    await waitFor(() => expect(page.queryByText('Najedź na mnie')).not.toBeInTheDocument());
  },
};

export const PausesOnFocus: Story = {
  play: async () => {
    toast.success('Fokus na mnie', { duration: 300 });
    await page.findByText('Fokus na mnie');
    // Radix attaches its pause listeners one render after the toast appears
    await sleep(50);

    closeButtonOf(getToast('Fokus na mnie')).focus();
    await sleep(600);
    await expect(page.getByText('Fokus na mnie')).toBeInTheDocument();
  },
};

export const QueuesBeyondThree: Story = {
  play: async ({ userEvent }) => {
    ['Pierwszy', 'Drugi', 'Trzeci', 'Czwarty'].forEach((message) => toast.success(message));
    await page.findByText('Trzeci');
    await expect(page.queryByText('Czwarty')).not.toBeInTheDocument();

    await userEvent.click(closeButtonOf(getToast('Pierwszy')));
    await expect(await page.findByText('Czwarty')).toBeInTheDocument();
    await expect(page.queryByText('Pierwszy')).not.toBeInTheDocument();
  },
};

function WithModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Otwórz</Button>
      <Modal title="Edytuj kategorię" open={open} onOpenChange={setOpen}>
        <p>Treść okna</p>
      </Modal>
      <Toaster />
    </>
  );
}

// Outside the dialog the toast would sit behind the backdrop, inert
export const UsableInsideOpenModal: Story = {
  render: () => <WithModal />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Otwórz' }));
    const dialog = page.getByRole('dialog');

    toast.error('Nie udało się zapisać');
    await page.findByText('Nie udało się zapisać');
    const element = getToast('Nie udało się zapisać');
    await expect(dialog).toContainElement(element);
    await waitFor(() =>
      expect(dialog.querySelector('[role="status"][aria-live="assertive"]')).toHaveTextContent(
        'Nie udało się zapisać',
      ),
    );

    const close = closeButtonOf(element);
    const box = close.getBoundingClientRect();
    await expect(
      close.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)),
    ).toBe(true);

    await userEvent.click(close);
    await waitFor(() => expect(page.queryByText('Nie udało się zapisać')).not.toBeInTheDocument());
    await expect(dialog.matches(':modal')).toBe(true);
  },
};

export const ReturnsToPageAfterModalCloses: Story = {
  render: () => <WithModal />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Otwórz' }));
    const dialog = page.getByRole('dialog');
    pressEscape(dialog as HTMLDialogElement);
    await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());

    toast.success('Po zamknięciu');
    await page.findByText('Po zamknięciu');
    await expect(dialog).not.toContainElement(getToast('Po zamknięciu'));
  },
};
