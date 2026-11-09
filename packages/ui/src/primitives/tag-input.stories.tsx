import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type FormEvent } from 'react';
import { expect, fireEvent, fn } from 'storybook/test';
import { Field } from './field';
import { TagInput, type TagInputProps } from './tag-input';

function Harness({ value: initial, onValueChange, ...props }: TagInputProps) {
  const [value, setValue] = useState(initial);
  return (
    <div className="max-w-md">
      <TagInput
        {...props}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange(next);
        }}
      />
      <span data-testid="tags">{value.join('|')}</span>
    </div>
  );
}

const meta = {
  title: 'Composites/TagInput',
  component: Harness,
  args: {
    'aria-label': 'Nuty smakowe',
    placeholder: 'Wpisz i naciśnij Enter',
    value: [],
    onValueChange: fn(),
  },
} satisfies Meta<typeof Harness>;

export default meta;

type Story = StoryObj<typeof meta>;

const WITH_TAGS = ['cytrusy', 'bergamotka'];

export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Nuty smakowe' })).toHaveValue('');
    await expect(canvas.queryByRole('list')).not.toBeInTheDocument();
  },
};

export const WithTags: Story = {
  args: { value: WITH_TAGS },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
  },
};

export const EnterAdds: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'jaśmin{Enter}');
    await expect(canvas.getByTestId('tags')).toHaveTextContent('jaśmin');
    await expect(input).toHaveValue('');
    await expect(canvas.getByRole('status')).toHaveTextContent('Dodano: jaśmin');
  },
};

export const CommaAdds: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'jaśmin,');
    await expect(args.onValueChange).toHaveBeenCalledWith(['jaśmin']);
    await expect(input).toHaveValue('');
  },
};

export const PasteSplitsList: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.paste('jaśmin, cytrusy, miód');
    await expect(canvas.getByTestId('tags')).toHaveTextContent('jaśmin|cytrusy');
    await expect(input).toHaveValue(' miód');
  },
};

export const IgnoresBlankAndDuplicates: Story = {
  args: { value: WITH_TAGS },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'cytrusy{Enter}');
    await userEvent.type(input, '   {Enter}');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
  },
};

export const NormalizesNewTags: Story = {
  args: { normalize: (tag) => tag.trim().toLocaleLowerCase('pl') },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox'), '  JAŚMIN {Enter}');
    await expect(args.onValueChange).toHaveBeenCalledWith(['jaśmin']);
  },
};

export const BackspaceRemovesLast: Story = {
  args: { value: WITH_TAGS },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox'), '{Backspace}');
    await expect(canvas.getByTestId('tags')).toHaveTextContent(/^cytrusy$/);
    await expect(canvas.getByRole('status')).toHaveTextContent('Usunięto: bergamotka');
  },
};

export const BackspaceEditsTextFirst: Story = {
  args: { value: WITH_TAGS },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox'), 'a{Backspace}');
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const HeldBackspaceKeepsTags: Story = {
  args: { value: WITH_TAGS },
  play: async ({ args, canvas }) => {
    await fireEvent.keyDown(canvas.getByRole('textbox'), { key: 'Backspace', repeat: true });
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const RemoveButton: Story = {
  args: { value: WITH_TAGS },
  play: async ({ canvas, userEvent }) => {
    const remove = canvas.getByRole('button', { name: 'Usuń: cytrusy' });
    const box = remove.getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(24);
    await expect(box.height).toBeGreaterThanOrEqual(24);

    await userEvent.click(remove);
    await expect(canvas.getByTestId('tags')).toHaveTextContent(/^bergamotka$/);
    await expect(canvas.getByRole('textbox')).toHaveFocus();
  },
};

export const LeavingCommitsDraft: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox'), 'jaśmin');
    await userEvent.tab();
    await expect(canvas.getByTestId('tags')).toHaveTextContent('jaśmin');
    await expect(canvas.getByRole('textbox')).toHaveValue('');
  },
};

const onSubmit = fn((event: FormEvent) => {
  event.preventDefault();
});

export const EnterSubmitsOnlyWhenEmpty: Story = {
  render: (args) => (
    <form onSubmit={onSubmit}>
      <Harness {...args} />
      <button type="submit">Wyślij</button>
    </form>
  ),
  play: async ({ canvas, userEvent }) => {
    onSubmit.mockClear();
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'jaśmin{Enter}');
    await expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.type(input, '{Enter}');
    await expect(onSubmit).toHaveBeenCalledOnce();
  },
};

export const Suggestions: Story = {
  args: { value: ['cytrusy'], suggestions: ['cytrusy', 'miód', 'kakao'] },
  play: async ({ canvas, userEvent }) => {
    // Already added tags are not suggested
    await expect(canvas.queryByRole('button', { name: 'Dodaj: cytrusy' })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Dodaj: miód' }));
    await expect(canvas.getByTestId('tags')).toHaveTextContent('cytrusy|miód');
    await expect(canvas.queryByRole('button', { name: 'Dodaj: miód' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('textbox')).toHaveFocus();
  },
};

export const FocusRingOnWrapper: Story = {
  play: async ({ canvasElement, userEvent }) => {
    await userEvent.tab();
    const wrapper = canvasElement.querySelector('input')?.parentElement as HTMLElement;
    await expect(getComputedStyle(wrapper).outlineWidth).toBe('2px');
  },
};

export const ClickOnEmptyAreaFocusesInput: Story = {
  args: { value: WITH_TAGS },
  play: async ({ canvas, canvasElement }) => {
    const wrapper = canvasElement.querySelector('input')?.parentElement as HTMLElement;
    await fireEvent.mouseDown(wrapper);
    await expect(canvas.getByRole('textbox')).toHaveFocus();
  },
};

export const InsideField: Story = {
  render: (args) => (
    <Field label="Nuty smakowe" error="Dodaj co najmniej jedną nutę">
      <TagInput value={args.value} onValueChange={args.onValueChange} />
    </Field>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Nuty smakowe' });
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription('Dodaj co najmniej jedną nutę');
  },
};

export const Disabled: Story = {
  args: { value: WITH_TAGS, suggestions: ['miód'], disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Usuń: cytrusy' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Dodaj: miód' }));
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};
