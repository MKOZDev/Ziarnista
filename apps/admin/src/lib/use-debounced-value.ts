import { useEffect, useState } from 'react';

/**
 * The value once it has stopped changing for `delay` ms. Typing "guji" sends one request for
 * "guji" instead of four, and no request for the half-typed "gu".
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // A new value cancels the pending one: only the last value of a burst gets through
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
