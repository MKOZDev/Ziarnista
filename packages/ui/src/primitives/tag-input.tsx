'use client';

import { Plus, X } from 'lucide-react';
import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { cn } from '../lib/cn';

export type TagInputProps = Omit<
  ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'onKeyDown' | 'size' | 'type' | 'ref'
> & {
  value: readonly string[];
  onValueChange: (tags: string[]) => void;
  /** Applied to every new tag, e.g. to store flavor notes in lowercase */
  normalize?: (tag: string) => string;
  suggestions?: readonly string[];
};

function trimTag(tag: string) {
  return tag.trim();
}

export function TagInput({
  value,
  onValueChange,
  normalize = trimTag,
  suggestions = [],
  onBlur,
  disabled,
  className,
  ...props
}: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const availableSuggestions = suggestions.filter((tag) => !value.includes(normalize(tag)));

  function addTags(candidates: readonly string[]) {
    const next = [...value];
    for (const candidate of candidates) {
      const tag = normalize(candidate);
      if (tag && !next.includes(tag)) next.push(tag);
    }
    if (next.length === value.length) return;

    onValueChange(next);
    setAnnouncement(`Dodano: ${next.slice(value.length).join(', ')}`);
  }

  function removeTag(tag: string) {
    onValueChange(value.filter((item) => item !== tag));
    setAnnouncement(`Usunięto: ${tag}`);
  }

  function commitDraft() {
    addTags([draft]);
    setDraft('');
  }

  // Comma is handled here, not on keydown: mobile keyboards often do not report the key.
  // It also splits pasted lists. The last part stays editable.
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const parts = event.target.value.split(',');
    addTags(parts.slice(0, -1));
    setDraft(parts.at(-1) ?? '');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && draft.trim()) {
      // An empty field leaves Enter alone, so it still submits the form
      event.preventDefault();
      commitDraft();
    }

    // Not on key repeat: holding Backspace to clear the text must not go on to delete the tags
    const lastTag = value.at(-1);
    if (event.key === 'Backspace' && draft === '' && lastTag !== undefined && !event.repeat) {
      removeTag(lastTag);
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    // Otherwise text typed just before saving would be silently lost
    commitDraft();
    onBlur?.(event);
  }

  function handleWrapperMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      event.preventDefault();
      inputRef.current?.focus();
    }
  }

  return (
    <div data-slot="tag-input" className={cn('flex w-full min-w-0 flex-col gap-1.5', className)}>
      <div
        className="flex min-h-control-lg w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-card p-1 text-body text-foreground transition-colors duration-(--duration-fast) has-aria-invalid:border-destructive has-disabled:cursor-not-allowed has-disabled:border-border has-disabled:bg-muted has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring"
        onMouseDown={handleWrapperMouseDown}
      >
        {value.length > 0 && (
          <ul className="contents">
            {value.map((tag) => (
              <li
                key={tag}
                className="inline-flex h-6.5 items-center gap-0.5 rounded-full bg-primary-soft pr-0.5 pl-2.5 text-label font-medium text-primary-ink"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Usuń: ${tag}`}
                  disabled={disabled}
                  className="grid size-6 cursor-pointer place-items-center rounded-full disabled:cursor-not-allowed"
                  onClick={() => {
                    removeTag(tag);
                    // The button disappears with the tag, and focus would be lost with it
                    inputRef.current?.focus();
                  }}
                >
                  <X aria-hidden className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          {...props}
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-7 min-w-36 flex-1 bg-transparent px-1.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {availableSuggestions.length > 0 && (
        <div role="group" aria-label="Podpowiedzi" className="flex flex-wrap items-center gap-1.5">
          <span aria-hidden className="text-caption text-muted-foreground">
            Podpowiedzi:
          </span>
          {availableSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-label={`Dodaj: ${tag}`}
              disabled={disabled}
              className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border border-dashed border-border-strong px-2.5 text-caption text-muted-foreground transition-colors duration-(--duration-fast) hover:not-disabled:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                addTags([tag]);
                // This button disappears too, once the suggestion is used
                inputRef.current?.focus();
              }}
            >
              <Plus aria-hidden className="size-3" />
              {tag}
            </button>
          ))}
        </div>
      )}

      <div role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
