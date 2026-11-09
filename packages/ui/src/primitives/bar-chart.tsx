'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { getChartTicks, getLabelInterval } from '../lib/chart';
import { cn } from '../lib/cn';

export type BarChartPoint = { label: string; value: number };

export type BarChartProps = {
  /** What the chart shows; names it and the data table for screen readers */
  caption: string;
  data: readonly BarChartPoint[];
  /** For tooltips and the data table */
  formatValue?: (value: number) => string;
  /** For the y axis; shorter than formatValue, e.g. no decimals */
  formatTick?: (value: number) => string;
  labelHeader?: string;
  valueHeader?: string;
  /** Plot height in pixels */
  height?: number;
  className?: string;
};

export function BarChart({
  caption,
  data,
  formatValue = String,
  formatTick = formatValue,
  labelHeader = 'Okres',
  valueHeader = 'Wartość',
  height = 220,
  className,
}: BarChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // A single tab stop: thirty bars must not cost thirty presses of Tab
  const [tabStopIndex, setTabStopIndex] = useState(0);

  const ticks = getChartTicks(Math.max(0, ...data.map((point) => point.value)));
  const top = ticks.at(-1) ?? 1;
  const labelInterval = getLabelInterval(data.length);
  const activePoint = activeIndex === null ? undefined : data[activeIndex];

  function focusBar(index: number) {
    setTabStopIndex(index);
    plotRef.current?.querySelectorAll<HTMLElement>('[data-bar]')[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent, index: number) {
    const targets: Record<string, number> = {
      ArrowRight: Math.min(index + 1, data.length - 1),
      ArrowLeft: Math.max(index - 1, 0),
      Home: 0,
      End: data.length - 1,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    focusBar(target);
  }

  return (
    <figure data-slot="bar-chart" className={cn('grid grid-cols-[auto_1fr] gap-x-2', className)}>
      <div
        aria-hidden
        className="relative min-w-10 text-caption text-muted-foreground"
        style={{ height }}
      >
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute right-0 -translate-y-1/2 whitespace-nowrap tabular-nums"
            style={{ top: `${100 - (tick / top) * 100}%` }}
          >
            {formatTick(tick)}
          </span>
        ))}
      </div>

      <div
        ref={plotRef}
        role="group"
        aria-label={caption}
        className="relative flex items-end gap-0.5 border-b"
        style={{ height }}
        onMouseLeave={() => setActiveIndex(null)}
      >
        {ticks.slice(1).map((tick) => (
          <div
            key={tick}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-px bg-border"
            style={{ top: `${100 - (tick / top) * 100}%` }}
          />
        ))}

        {data.map((point, index) => (
          // The whole column reacts, so the target is bigger than the bar itself
          <div
            key={point.label}
            data-bar
            role="img"
            aria-label={`${point.label}: ${formatValue(point.value)}`}
            tabIndex={index === tabStopIndex ? 0 : -1}
            className="relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center rounded-t-sm"
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => {
              setTabStopIndex(index);
              setActiveIndex(index);
            }}
            onBlur={() => setActiveIndex(null)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <div
              data-bar-fill
              className={cn(
                'w-full max-w-6 rounded-t-sm transition-colors duration-(--duration-fast)',
                index === activeIndex ? 'bg-primary-hover' : 'bg-primary',
              )}
              style={{ height: `${(point.value / top) * 100}%` }}
            />
          </div>
        ))}

        {activePoint && activeIndex !== null && (
          <div
            aria-hidden
            data-slot="bar-chart-tooltip"
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-sm bg-foreground px-2 py-1 text-caption whitespace-nowrap text-background shadow-lg"
            style={{
              left: `clamp(3rem, ${((activeIndex + 0.5) / data.length) * 100}%, calc(100% - 3rem))`,
              bottom: `calc(${(activePoint.value / top) * 100}% + 0.5rem)`,
            }}
          >
            <span className="font-semibold tabular-nums">{formatValue(activePoint.value)}</span>{' '}
            {activePoint.label}
          </div>
        )}
      </div>

      <div
        aria-hidden
        className="col-start-2 mt-1.5 flex gap-0.5 text-caption text-muted-foreground"
      >
        {data.map((point, index) => (
          <span key={point.label} className="flex-1 text-center whitespace-nowrap">
            {index % labelInterval === 0 ? point.label : ''}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{labelHeader}</th>
            <th scope="col">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <td>{point.label}</td>
              <td>{formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
