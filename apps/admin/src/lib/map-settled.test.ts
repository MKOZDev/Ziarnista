import { describe, expect, it } from 'vitest';
import { mapSettled } from './map-settled';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('mapSettled', () => {
  it('never runs more than the limit at once', async () => {
    let running = 0;
    let peak = 0;

    await mapSettled([1, 2, 3, 4, 5, 6, 7], 3, async () => {
      running++;
      peak = Math.max(peak, running);
      await tick();
      running--;
    });

    expect(peak).toBe(3);
  });

  it('keeps the input order and reports failures next to successes', async () => {
    const results = await mapSettled([30, 0, 10], 2, async (delay) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (delay === 0) throw new Error('boom');
      return delay;
    });

    expect(results).toEqual([
      { status: 'fulfilled', value: 30 },
      { status: 'rejected', reason: new Error('boom') },
      { status: 'fulfilled', value: 10 },
    ]);
  });

  it('handles an empty list', async () => {
    expect(await mapSettled([], 4, () => Promise.resolve(1))).toEqual([]);
  });
});
