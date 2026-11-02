import { describe, expect, it } from 'vitest';
import { SLUG_BASE_MAX_LENGTH, slugify } from './slug';

describe('slugify', () => {
  it('transliterates all Polish letters, including ł', () => {
    expect(slugify('Zażółć gęślą jaźń')).toBe('zazolc-gesla-jazn');
    expect(slugify('ĄĆĘŁŃÓŚŹŻ ąćęłńóśźż')).toBe('acelnoszz-acelnoszz');
  });

  it('collapses spaces and punctuation into single hyphens', () => {
    expect(slugify('  Etiopia — Guji / Hambela (250 g)!  ')).toBe('etiopia-guji-hambela-250-g');
  });

  it('returns an empty string when nothing is left', () => {
    expect(slugify('!!! ???')).toBe('');
  });

  it('caps the length and does not end with a hyphen', () => {
    const slug = slugify(`${'a'.repeat(SLUG_BASE_MAX_LENGTH - 1)} bcd`);

    expect(slug).toBe('a'.repeat(SLUG_BASE_MAX_LENGTH - 1));
  });
});
