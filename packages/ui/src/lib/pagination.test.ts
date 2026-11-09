import { describe, expect, it } from 'vitest';
import { getPageItems } from './pagination';

describe('getPageItems', () => {
  it('shows every page when there are few', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(2, 3)).toEqual([1, 2, 3]);
  });

  it('returns nothing when there are no pages', () => {
    expect(getPageItems(1, 0)).toEqual([]);
  });

  it('hides the far end at the start', () => {
    expect(getPageItems(1, 10)).toEqual([1, 2, 'gap', 10]);
  });

  it('hides both sides in the middle', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
  });

  it('hides the near end at the finish', () => {
    expect(getPageItems(10, 10)).toEqual([1, 'gap', 9, 10]);
  });

  it('shows a single hidden page instead of a gap', () => {
    expect(getPageItems(3, 10)).toEqual([1, 2, 3, 4, 'gap', 10]);
    expect(getPageItems(8, 10)).toEqual([1, 'gap', 7, 8, 9, 10]);
  });

  it('stays in range when the page is past the end', () => {
    expect(getPageItems(9, 5)).toEqual([1, 'gap', 5]);
  });
});
