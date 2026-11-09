import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type FormEvent } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import { Button } from './button';
import { Combobox, type ComboboxOption, type ComboboxProps } from './combobox';
import { Field } from './field';
import { Modal } from './modal';

// Acceptance tests for Combobox: the ARIA 1.2 editable combobox with a list popup

const ORIGINS: ComboboxOption[] = [
  { value: 'et', label: 'Etiopia' },
  { value: 'ke', label: 'Kenia' },
  { value: 'pa', label: 'Panama', disabled: true },
  { value: 'co', label: 'Kolumbia' },
  { value: 'ci', label: 'Wybrzeże Kości Słoniowej' },
  { value: 'br', label: 'Brazylia' },
];

const CATEGORIES: ComboboxOption[] = [
  { value: 'coffee', label: 'Kawa' },
  { value: 'beans', label: 'Ziarnista', depth: 1 },
  { value: 'espresso', label: 'Espresso', depth: 2 },
  { value: 'tools', label: 'Akcesoria' },
];

const LONG_LIST: ComboboxOption[] = Array.from({ length: 40 }, (_, index) => ({
  value: String(index),
  label: `Pochodzenie ${index + 1}`,
}));

const page = within(document.body);

function getInput() {
  return page.getByRole<HTMLInputElement>('combobox');
}

function getOption(name: string | RegExp) {
  return page.getByRole('option', { name });
}

async function expectActive(name: string) {
  await expect(getInput()).toHaveAttribute('aria-activedescendant', getOption(name).id);
}

async function expectClosed() {
  await waitFor(() => expect(page.queryByRole('listbox')).not.toBeInTheDocument());
  await expect(getInput()).toHaveAttribute('aria-expanded', 'false');
}

function Harness({ value: initial, onValueChange, ...props }: ComboboxProps) {
  const [value, setValue] = useState(initial);
  return (
    <div className="grid max-w-xs gap-2">
      <Combobox
        {...props}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange(next);
        }}
      />
      <span data-testid="value">{String(value)}</span>
      <Button variant="secondary" onClick={() => setValue('br')}>
        Ustaw Brazylię
      </Button>
    </div>
  );
}

const meta = {
  title: 'Composites/Combobox',
  component: Harness,
  args: {
    'aria-label': 'Pochodzenie',
    options: ORIGINS,
    value: null,
    onValueChange: fn(),
    placeholder: 'Wybierz pochodzenie',
  },
  // The list is portaled outside the story root, and axe has to see it too
  parameters: { a11y: { context: 'body' } },
} satisfies Meta<typeof Harness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ClosedAttributes: Story = {
  play: async () => {
    const input = getInput();
    await expect(input).toHaveAccessibleName('Pochodzenie');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await expect(input).toHaveAttribute('autocomplete', 'off');
    await expect(page.queryByRole('listbox')).not.toBeInTheDocument();
  },
};

export const OpensOnClick: Story = {
  play: async ({ userEvent }) => {
    const input = getInput();
    await userEvent.click(input);
    const listbox = page.getByRole('listbox');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(input).toHaveAttribute('aria-controls', listbox.id);
    await expect(within(listbox).getAllByRole('option')).toHaveLength(ORIGINS.length);
    await expect(input).toHaveFocus();
  },
};

export const FocusAloneDoesNotOpen: Story = {
  play: async ({ userEvent }) => {
    await userEvent.tab();
    await expect(getInput()).toHaveFocus();
    await expect(page.queryByRole('listbox')).not.toBeInTheDocument();
  },
};

export const ArrowDownOpensOnFirst: Story = {
  play: async ({ userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    await expectActive('Etiopia');
    await expect(getInput()).toHaveFocus();
  },
};

export const ArrowUpOpensOnLast: Story = {
  play: async ({ userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{ArrowUp}');
    await expectActive('Brazylia');
  },
};

export const ArrowsMoveSkipDisabledAndWrap: Story = {
  play: async ({ userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expectActive('Kenia');

    await userEvent.keyboard('{ArrowDown}');
    await expectActive('Kolumbia');

    await userEvent.keyboard('{ArrowUp}');
    await expectActive('Kenia');

    await userEvent.keyboard('{End}{ArrowDown}');
    await expectActive('Etiopia');

    await userEvent.keyboard('{ArrowUp}');
    await expectActive('Brazylia');
  },
};

export const HomeAndEnd: Story = {
  play: async ({ userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{End}');
    await expectActive('Brazylia');
    await userEvent.keyboard('{Home}');
    await expectActive('Etiopia');
  },
};

export const EnterSelects: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(args.onValueChange).toHaveBeenCalledOnce();
    await expect(args.onValueChange).toHaveBeenCalledWith('ke');
    await expectClosed();
    await expect(getInput()).toHaveValue('Kenia');
    await expect(canvas.getByTestId('value')).toHaveTextContent('ke');
  },
};

const onSubmit = fn((event: FormEvent) => {
  event.preventDefault();
});

function InForm(args: ComboboxProps) {
  return (
    <form onSubmit={onSubmit}>
      <Harness {...args} />
      <button type="submit">Wyślij</button>
    </form>
  );
}

export const EnterWhenClosedSubmitsForm: Story = {
  render: (args) => <InForm {...args} />,
  play: async ({ userEvent }) => {
    onSubmit.mockClear();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(onSubmit).toHaveBeenCalledOnce();
  },
};

export const EnterWhenOpenDoesNotSubmitForm: Story = {
  render: (args) => <InForm {...args} />,
  play: async ({ userEvent }) => {
    onSubmit.mockClear();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(getInput()).toHaveValue('Etiopia');
    await expect(onSubmit).not.toHaveBeenCalled();
  },
};

export const ClickSelectsAndKeepsFocus: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.click(getInput());
    await userEvent.click(getOption('Kolumbia'));
    await expect(args.onValueChange).toHaveBeenCalledWith('co');
    await expectClosed();
    await expect(getInput()).toHaveValue('Kolumbia');
    await expect(getInput()).toHaveFocus();
  },
};

export const HoverMovesActive: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(getInput());
    await userEvent.hover(getOption('Kolumbia'));
    await expectActive('Kolumbia');
  },
};

export const DisabledOptionCannotBeSelected: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.click(getInput());
    const option = getOption('Panama');
    await expect(option).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(option);
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(page.getByRole('listbox')).toBeInTheDocument();
  },
};

export const SelectedOptionIsMarked: Story = {
  args: { value: 'co' },
  play: async ({ userEvent }) => {
    await expect(getInput()).toHaveValue('Kolumbia');
    await userEvent.click(getInput());
    await expect(getOption('Kolumbia')).toHaveAttribute('aria-selected', 'true');
    await expect(getOption('Kenia')).toHaveAttribute('aria-selected', 'false');
    // Opening does not filter by the selected label, and starts from the selection
    await expect(page.getAllByRole('option')).toHaveLength(ORIGINS.length);
    await expectActive('Kolumbia');
  },
};

export const TypingFiltersAndActivatesFirst: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.type(getInput(), 'k');
    await expect(page.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Kenia',
      'Kolumbia',
      'Wybrzeże Kości Słoniowej',
    ]);
    await expectActive('Kenia');

    await userEvent.keyboard('o{Enter}');
    await expect(args.onValueChange).toHaveBeenCalledWith('co');
  },
};

export const FiltersIgnoringDiacritics: Story = {
  play: async ({ userEvent }) => {
    await userEvent.type(getInput(), 'wybrzeze kosci slon');
    await expect(page.getAllByRole('option')).toHaveLength(1);
    await expectActive('Wybrzeże Kości Słoniowej');
  },
};

export const NoResults: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.type(getInput(), 'xyz');
    await expect(page.getByRole('status')).toHaveTextContent('Brak wyników');
    await expect(page.queryByRole('option')).not.toBeInTheDocument();
    await expect(getInput()).not.toHaveAttribute('aria-activedescendant');

    await userEvent.keyboard('{Enter}');
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const CustomEmptyMessage: Story = {
  args: { emptyMessage: 'Nie znaleziono pochodzenia' },
  play: async ({ userEvent }) => {
    await userEvent.type(getInput(), 'xyz');
    await expect(page.getByRole('status')).toHaveTextContent('Nie znaleziono pochodzenia');
  },
};

export const Loading: Story = {
  args: { loading: true, options: [] },
  play: async ({ userEvent }) => {
    await userEvent.click(getInput());
    await expect(page.getByRole('status')).toHaveTextContent('Wczytywanie…');
    await expect(page.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    await expect(page.queryByText('Brak wyników')).not.toBeInTheDocument();
  },
};

export const EscapeWithTypedTextRestoresSelection: Story = {
  args: { value: 'co' },
  play: async ({ args, userEvent }) => {
    const input = getInput();
    await userEvent.type(input, 'xyz');
    await userEvent.keyboard('{Escape}');
    await expectClosed();
    await expect(input).toHaveValue('Kolumbia');
    await expect(input).toHaveFocus();
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const LeavingRestoresWithoutSelecting: Story = {
  args: { value: 'co' },
  play: async ({ args, userEvent }) => {
    const input = getInput();
    await userEvent.type(input, 'xyz');
    await userEvent.tab();
    await expectClosed();
    await expect(input).toHaveValue('Kolumbia');
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const ClearingTextClearsValue: Story = {
  args: { value: 'co' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.clear(getInput());
    await expect(args.onValueChange).toHaveBeenCalledWith(null);
    await expect(canvas.getByTestId('value')).toHaveTextContent('null');
  },
};

export const ToggleButton: Story = {
  play: async ({ userEvent }) => {
    const toggle = page.getByRole('button', { name: 'Pokaż opcje' });
    // A second tab stop would only slow keyboard users down: arrows already open the list
    await expect(toggle).toHaveAttribute('tabindex', '-1');

    await userEvent.click(toggle);
    await expect(page.getByRole('listbox')).toBeInTheDocument();
    await expect(getInput()).toHaveFocus();

    await userEvent.click(toggle);
    await expectClosed();
    await expect(getInput()).toHaveFocus();
  },
};

export const ExternalValueChange: Story = {
  args: { value: 'co' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ustaw Brazylię' }));
    await expect(getInput()).toHaveValue('Brazylia');
  },
};

export const TreeIsIndented: Story = {
  args: { 'aria-label': 'Kategoria', options: CATEGORIES },
  play: async ({ userEvent }) => {
    await userEvent.click(getInput());
    const left = (name: string) => parseFloat(getComputedStyle(getOption(name)).paddingInlineStart);
    await expect(left('Ziarnista')).toBeGreaterThan(left('Kawa'));
    await expect(left('Espresso')).toBeGreaterThan(left('Ziarnista'));
    await expect(left('Akcesoria')).toBe(left('Kawa'));
  },
};

export const LongListScrollsToActive: Story = {
  args: { options: LONG_LIST },
  play: async ({ userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{End}');

    const listbox = page.getByRole('listbox').getBoundingClientRect();
    const option = getOption('Pochodzenie 40').getBoundingClientRect();
    await expect(option.top).toBeGreaterThanOrEqual(listbox.top);
    await expect(option.bottom).toBeLessThanOrEqual(listbox.bottom + 1);
  },
};

export const PopupMatchesInputWidth: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(getInput());
    const listbox = page.getByRole('listbox').getBoundingClientRect();
    const group = getInput().parentElement?.getBoundingClientRect();
    await expect(Math.abs(listbox.width - (group?.width ?? 0))).toBeLessThanOrEqual(2);
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'co' },
  play: async ({ userEvent }) => {
    const toggle = page.getByRole('button', { name: 'Pokaż opcje' });
    await expect(getInput()).toBeDisabled();
    await expect(toggle).toBeDisabled();
    await userEvent.click(toggle);
    await expect(page.queryByRole('listbox')).not.toBeInTheDocument();
  },
};

export const InsideField: Story = {
  render: (args) => (
    <Field label="Pochodzenie" required error="Wybierz pochodzenie">
      <Combobox options={args.options} value={args.value} onValueChange={args.onValueChange} />
    </Field>
  ),
  play: async () => {
    const input = page.getByRole('combobox', { name: 'Pochodzenie' });
    await expect(input).toBeInvalid();
    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleDescription('Wybierz pochodzenie');
  },
};

function InModal(args: ComboboxProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Otwórz</Button>
      <Modal title="Edytuj produkt" open={open} onOpenChange={setOpen}>
        <Harness {...args} />
      </Modal>
    </>
  );
}

// A popup portaled to <body> would land behind the dialog and be inert
export const WorksInsideModal: Story = {
  render: (args) => <InModal {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Otwórz' }));
    const dialog = page.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox'));

    const listbox = page.getByRole('listbox');
    await expect(dialog).toContainElement(listbox);

    await userEvent.click(getOption('Kenia'));
    await expect(args.onValueChange).toHaveBeenCalledWith('ke');
    await expect(dialog.matches(':modal')).toBe(true);
  },
};

// Esc must close only the list: an unprevented keydown would also close the surrounding dialog
export const EscapeIsConsumedWhileOpen: Story = {
  play: async ({ userEvent }) => {
    let prevented: boolean | null = null;
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') prevented = event.defaultPrevented;
    };
    document.addEventListener('keydown', listener);

    await userEvent.click(getInput());
    await userEvent.keyboard('{Escape}');
    await expect(prevented).toBe(true);

    await userEvent.keyboard('{Escape}');
    await expect(prevented).toBe(false);

    document.removeEventListener('keydown', listener);
  },
};
