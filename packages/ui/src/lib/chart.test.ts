import { describe, expect, it } from 'vitest';
import { getChartTicks, getLabelInterval } from './chart';

describe('getChartTicks', () => {
  it.each([
    [100, [0, 25, 50, 75, 100]],
    [1000, [0, 250, 500, 750, 1000]],
    [1234, [0, 500, 1000, 1500, 2000]],
    [730, [0, 200, 400, 600, 800]],
    [4, [0, 1, 2, 3, 4]],
  ])('uses round numbers for a maximum of %i', (max, ticks) => {
    expect(getChartTicks(max)).toEqual(ticks);
  });

  it('always reaches the maximum', () => {
    for (const max of [1, 3, 7, 99, 101, 12_345, 987_654]) {
      expect(getChartTicks(max).at(-1)).toBeGreaterThanOrEqual(max);
    }
  });

  it('keeps a usable axis when everything is zero', () => {
    expect(getChartTicks(0)).toEqual([0, 1, 2, 3, 4]);
  });

  it('never produces fractional steps for small integers', () => {
    expect(getChartTicks(2).every(Number.isInteger)).toBe(true);
  });

  it('respects the number of intervals', () => {
    expect(getChartTicks(100, 2)).toEqual([0, 50, 100]);
  });
});

describe('getLabelInterval', () => {
  it('labels everything when it fits', () => {
    expect(getLabelInterval(7)).toBe(1);
  });

  it('thins out long series', () => {
    expect(getLabelInterval(30)).toBe(4);
  });

  it('handles an empty series', () => {
    expect(getLabelInterval(0)).toBe(1);
  });
});
