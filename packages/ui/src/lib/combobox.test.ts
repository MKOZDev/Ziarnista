import { describe, expect, it } from 'vitest';
import { matchesQuery } from './combobox';

describe('matchesQuery', () => {
  it('finds text anywhere in the label', () => {
    expect(matchesQuery('Wybrzeże Kości Słoniowej', 'kości')).toBe(true);
  });

  it('ignores case', () => {
    expect(matchesQuery('Etiopia', 'ETIO')).toBe(true);
  });

  it('ignores diacritics in both directions', () => {
    expect(matchesQuery('Wybrzeże', 'wybrzeze')).toBe(true);
    expect(matchesQuery('Wybrzeze', 'wybrzeże')).toBe(true);
  });

  it('treats ł as l', () => {
    expect(matchesQuery('Łódź', 'lodz')).toBe(true);
    expect(matchesQuery('Słoniowej', 'SŁON')).toBe(true);
  });

  it('ignores surrounding spaces in the query', () => {
    expect(matchesQuery('Etiopia', '  etio ')).toBe(true);
  });

  it('matches everything for an empty query', () => {
    expect(matchesQuery('Etiopia', '')).toBe(true);
  });

  it('rejects text that is not there', () => {
    expect(matchesQuery('Etiopia', 'kenia')).toBe(false);
  });
});
