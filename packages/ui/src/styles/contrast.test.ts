import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Tokens = Record<string, string>;

const TEXT = 4.5; // WCAG 1.4.3
const NON_TEXT = 3; // WCAG 1.4.11

function readStyles(file: string): string {
  return readFileSync(new URL(file, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

function readBlock(css: string, selector: ':root' | '.dark'): Tokens {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Missing ${selector} block`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name = '', value = '']) => [name, value]),
  );
}

function channel(hex: string, offset: number): number {
  const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error(`Expected #rrggbb, got "${color}"`);
  return 0.2126 * channel(color, 1) + 0.7152 * channel(color, 3) + 0.0722 * channel(color, 5);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

const tokens = readStyles('./tokens.css');
const light = readBlock(tokens, ':root');
const themes: [string, Tokens][] = [
  ['admin light', light],
  ['admin dark', { ...light, ...readBlock(tokens, '.dark') }],
  ['storefront', { ...light, ...readBlock(readStyles('./storefront-theme.css'), ':root') }],
];

const pairs: [foreground: string, background: string, minimum: number][] = [
  ['foreground', 'background', TEXT],
  ['foreground', 'muted', TEXT],
  ['card-foreground', 'card', TEXT],
  ['popover-foreground', 'popover', TEXT],
  ['secondary-foreground', 'secondary', TEXT],
  ['accent-foreground', 'accent', TEXT],
  ['muted-foreground', 'background', TEXT],
  ['muted-foreground', 'card', TEXT],
  ['muted-foreground', 'muted', TEXT],
  ['muted-foreground', 'neutral-soft', TEXT],
  ['primary-foreground', 'primary', TEXT],
  ['primary-foreground', 'primary-hover', TEXT],
  ['primary', 'background', TEXT],
  ['primary', 'card', TEXT],
  ['primary-ink', 'background', TEXT],
  ['primary-ink', 'card', TEXT],
  ['primary-ink', 'primary-soft', TEXT],
  ['destructive-foreground', 'destructive', TEXT],
  ['destructive', 'card', TEXT],
  ['destructive', 'destructive-soft', TEXT],
  ['success', 'card', TEXT],
  ['success', 'success-soft', TEXT],
  ['warning', 'card', TEXT],
  ['warning', 'warning-soft', TEXT],
  ['info', 'background', TEXT],
  ['info', 'info-soft', TEXT],
  ['violet', 'violet-soft', TEXT],
  ['input', 'background', NON_TEXT],
  ['input', 'card', NON_TEXT],
  ['input', 'muted', NON_TEXT],
  ['ring', 'background', NON_TEXT],
  ['ring', 'card', NON_TEXT],
  ['ring', 'muted', NON_TEXT],
];

describe('contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  describe.each(themes)('%s', (_theme, values) => {
    it.each(pairs)('%s on %s reaches %d:1', (foreground, background, minimum) => {
      expect(contrast(values[foreground] ?? '', values[background] ?? '')).toBeGreaterThanOrEqual(
        minimum,
      );
    });
  });
});
