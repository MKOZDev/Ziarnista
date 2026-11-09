const NICE_MULTIPLIERS = [1, 2, 2.5, 5, 10];

/**
 * Evenly spaced axis ticks from 0, on round numbers, ending at or above the maximum.
 * Whole steps only: the charted data (grosze, counts) is made of integers.
 */
export function getChartTicks(maxValue: number, intervals = 4): number[] {
  const roughStep = Math.max(maxValue / intervals, 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const multiplier = NICE_MULTIPLIERS.find((item) => item * magnitude >= roughStep) ?? 10;
  const step = Math.ceil(multiplier * magnitude);

  return Array.from({ length: intervals + 1 }, (_, index) => index * step);
}

/** How often to label the x axis so that about `maxLabels` labels fit. */
export function getLabelInterval(count: number, maxLabels = 8): number {
  return Math.max(1, Math.ceil(count / maxLabels));
}
