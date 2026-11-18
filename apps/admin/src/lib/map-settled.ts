/**
 * Promise.allSettled over `items`, but with at most `limit` calls of `task` running at once.
 * Results keep the order of `items`; one failure neither stops nor hides the others.
 */
export async function mapSettled<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array<PromiseSettledResult<R>>(items.length);
  let next = 0;

  // Each worker takes the next free item until none are left
  async function worker() {
    while (next < items.length) {
      const index = next++;
      const [result] = await Promise.allSettled([task(items[index] as T)]);
      results[index] = result;
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
