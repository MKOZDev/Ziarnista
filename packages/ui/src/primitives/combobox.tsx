'use client';

import { ChevronDown, Check } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { cn } from '../lib/cn';
import { matchesQuery } from '../lib/combobox';
import { usePortalContainer } from '../lib/portal-container';
import { InputGroup, type InputGroupProps } from './input-group';

export type ComboboxOption = {
  value: string;
  label: string;
  /** Nesting level for tree data such as categories */
  depth?: number;
  disabled?: boolean;
};

export type ComboboxProps = Omit<
  InputGroupProps,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onKeyDown'
  | 'onClick'
  | 'name'
  | 'type'
  | 'role'
  | 'ref'
  | 'addon'
  | 'start'
  | 'end'
  | 'align'
  | 'mono'
> & {
  options: readonly ComboboxOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  loading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
};

// Clicks in the popup and on the toggle must not take focus away from the input
function keepInputFocus(event: Pick<Event, 'preventDefault'>) {
  event.preventDefault();
}

export function Combobox({
  options,
  value,
  onValueChange,
  loading = false,
  emptyMessage = 'Brak wyników',
  loadingMessage = 'Wczytywanie…',
  onBlur,
  disabled,
  className,
  ...props
}: ComboboxProps) {
  const listId = useId();
  const container = usePortalContainer();
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<HTMLUListElement | null>(null);
  const [open, setOpen] = useState(false);
  // null when not typing: the input then shows the selected label, so the two cannot drift apart
  const [query, setQuery] = useState<string | null>(null);
  const [activeValue, setActiveValue] = useState<string | null>(null);

  const selected = options.find((option) => option.value === value);
  const visible = query ? options.filter((option) => matchesQuery(option.label, query)) : options;
  const enabled = visible.filter((option) => !option.disabled);
  const active = open
    ? (enabled.find((option) => option.value === activeValue) ??
      enabled.find((option) => option.value === value) ??
      enabled[0])
    : undefined;
  const activeIndex = active ? visible.indexOf(active) : -1;
  const statusMessage = loading ? loadingMessage : visible.length === 0 ? emptyMessage : '';

  // Sets scrollTop by hand: scrollIntoView could also scroll the page behind the popup
  useEffect(() => {
    const option = list?.querySelector<HTMLElement>('[data-active]');
    if (!list || !option) return;

    const bottom = option.offsetTop + option.offsetHeight;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = bottom - list.clientHeight;
  }, [list, activeIndex]);

  function close() {
    setOpen(false);
    setQuery(null);
    setActiveValue(null);
  }

  function select(option: ComboboxOption) {
    onValueChange(option.value);
    close();
  }

  function moveActive(step: 1 | -1) {
    const count = enabled.length;
    if (count === 0) return;
    const index = active ? enabled.indexOf(active) : -1;
    setActiveValue(enabled[(index + step + count) % count]?.value ?? null);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    setQuery(text);
    setOpen(true);
    setActiveValue(null);
    if (text === '' && value !== null) onValueChange(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (open) moveActive(1);
        else setOpen(true);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) moveActive(-1);
        else {
          setOpen(true);
          setActiveValue(enabled.at(-1)?.value ?? null);
        }
        break;
      case 'Home':
        if (!open) break;
        event.preventDefault();
        setActiveValue(enabled[0]?.value ?? null);
        break;
      case 'End':
        if (!open) break;
        event.preventDefault();
        setActiveValue(enabled.at(-1)?.value ?? null);
        break;
      case 'Enter':
        // Closed: left alone, so Enter still submits the form
        if (!open) break;
        event.preventDefault();
        if (active) select(active);
        break;
      case 'Escape':
        if (!open) break;
        // Otherwise the same key press would also close a surrounding dialog
        event.preventDefault();
        close();
        break;
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    close();
    onBlur?.(event);
  }

  function handleToggle() {
    if (open) close();
    else setOpen(true);
    inputRef.current?.focus();
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <PopoverPrimitive.Anchor asChild>
        <div ref={anchorRef} data-slot="combobox" className={cn('w-full', className)}>
          <InputGroup
            {...props}
            ref={inputRef}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-activedescendant={active ? `${listId}-${activeIndex}` : undefined}
            disabled={disabled}
            value={query ?? selected?.label ?? ''}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={() => setOpen(true)}
            onBlur={handleBlur}
            end={
              <button
                type="button"
                tabIndex={-1}
                aria-label={open ? 'Ukryj opcje' : 'Pokaż opcje'}
                disabled={disabled}
                className="mr-1.5 grid size-6 cursor-pointer place-items-center rounded-sm text-muted-foreground transition-colors duration-(--duration-fast) hover:not-disabled:bg-muted disabled:cursor-not-allowed"
                onMouseDown={keepInputFocus}
                onClick={handleToggle}
              >
                <ChevronDown aria-hidden className={cn('size-4', open && 'rotate-180')} />
              </button>
            }
          />
        </div>
      </PopoverPrimitive.Anchor>

      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          // The popup is only a positioned box: the listbox inside carries the semantics
          role="presentation"
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className="z-50 w-(--radix-popover-trigger-width) rounded-md border bg-popover text-popover-foreground shadow-lg"
          onOpenAutoFocus={keepInputFocus}
          onCloseAutoFocus={keepInputFocus}
          onMouseDown={keepInputFocus}
          onInteractOutside={(event) => {
            // The input and the toggle manage the open state themselves
            if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
          }}
        >
          <ul
            ref={setList}
            id={listId}
            role="listbox"
            aria-label={props['aria-label'] ?? 'Lista opcji'}
            aria-busy={loading || undefined}
            className="relative max-h-60 overflow-y-auto p-1 empty:p-0"
          >
            {visible.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                data-active={option === active || undefined}
                style={{ paddingInlineStart: `${0.75 + (option.depth ?? 0)}rem` }}
                className="flex min-h-8 cursor-pointer items-center justify-between gap-2 rounded-sm py-1.5 pe-3 text-body aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-active:bg-muted data-active:outline-2 data-active:-outline-offset-2 data-active:outline-ring"
                onMouseMove={() => {
                  if (!option.disabled) setActiveValue(option.value);
                }}
                onClick={() => {
                  if (!option.disabled) select(option);
                }}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {option.value === value && (
                  <Check aria-hidden className="size-4 shrink-0 text-primary-ink" />
                )}
              </li>
            ))}
          </ul>
          <div role="status" className="px-3 py-2 text-body text-muted-foreground empty:p-0">
            {statusMessage}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
