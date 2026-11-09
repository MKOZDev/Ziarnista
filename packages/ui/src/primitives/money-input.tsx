'use client';

import { useState, type ChangeEvent, type FocusEvent } from 'react';
import { formatMoneyInput, parseMoney } from '../lib/money';
import { InputGroup, type InputGroupProps } from './input-group';

export type MoneyInputProps = Omit<
  InputGroupProps,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'inputMode' | 'addon' | 'start' | 'end' | 'align'
> & {
  /** Amount in grosze; null when empty or malformed */
  value: number | null;
  onValueChange: (grosze: number | null) => void;
};

export function MoneyInput({
  value,
  onValueChange,
  onBlur,
  'aria-invalid': ariaInvalid,
  ...props
}: MoneyInputProps) {
  // The text is separate from the value, so typing "12," is not rewritten to "12,00" mid-edit
  const [text, setText] = useState(() => formatMoneyInput(value));

  // Value changed from outside (form reset, data load): adjusted during render to avoid a stale frame
  if (parseMoney(text) !== value) {
    setText(formatMoneyInput(value));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
    onValueChange(parseMoney(event.target.value));
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    if (value !== null) setText(formatMoneyInput(value));
    onBlur?.(event);
  }

  const isMalformed = text.trim() !== '' && parseMoney(text) === null;

  return (
    <InputGroup
      data-slot="money-input"
      type="text"
      inputMode="decimal"
      align="end"
      end={<span className="pr-3 text-muted-foreground">zł</span>}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-invalid={ariaInvalid ?? (isMalformed || undefined)}
      {...props}
    />
  );
}
