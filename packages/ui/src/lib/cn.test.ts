import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('keeps a custom font size next to a text color', () => {
    expect(cn('text-label', 'text-foreground')).toBe('text-label text-foreground');
  });

  it('lets a later font size replace a custom one', () => {
    expect(cn('text-label', 'text-body')).toBe('text-body');
    expect(cn('text-sm', 'text-label')).toBe('text-label');
  });

  it('lets a later control height replace an earlier one', () => {
    expect(cn('h-control-md', 'h-control-sm')).toBe('h-control-sm');
    expect(cn('h-9', 'h-control-lg')).toBe('h-control-lg');
  });

  it('merges the remaining custom scales', () => {
    expect(cn('w-sidebar', 'w-full')).toBe('w-full');
    expect(cn('max-w-content', 'max-w-sm')).toBe('max-w-sm');
  });

  it('still merges standard Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
