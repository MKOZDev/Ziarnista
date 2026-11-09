import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

const meta: Meta = { title: 'Foundations/Tokens' };

export default meta;

type Story = StoryObj;

const SURFACES = [
  ['bg-background text-foreground', 'background / foreground'],
  ['bg-card text-card-foreground', 'card / card-foreground'],
  ['bg-muted text-muted-foreground', 'muted / muted-foreground'],
  ['bg-primary text-primary-foreground', 'primary / primary-foreground'],
  ['bg-primary-hover text-primary-foreground', 'primary-hover / primary-foreground'],
  ['bg-primary-soft text-primary-ink', 'primary-soft / primary-ink'],
  ['bg-destructive text-destructive-foreground', 'destructive / destructive-foreground'],
  ['bg-destructive-soft text-destructive', 'destructive-soft / destructive'],
  ['bg-success-soft text-success', 'success-soft / success'],
  ['bg-warning-soft text-warning', 'warning-soft / warning'],
  ['bg-info-soft text-info', 'info-soft / info'],
  ['bg-violet-soft text-violet', 'violet-soft / violet'],
  ['bg-neutral-soft text-muted-foreground', 'neutral-soft / muted-foreground'],
] as const;

export const Colors: Story = {
  render: () => (
    <div className="grid gap-2">
      {SURFACES.map(([classes, label]) => (
        <div key={label} className={`rounded-md border p-3 ${classes}`}>
          {label}
        </div>
      ))}
    </div>
  ),
  // Without this check axe would also pass on a page where the theme failed to load
  play: async ({ canvas }) => {
    const swatch = canvas.getByText('primary / primary-foreground');
    const isDark = document.documentElement.classList.contains('dark');
    await expect(getComputedStyle(swatch).backgroundColor).toBe(
      isDark ? 'rgb(216, 103, 78)' : 'rgb(188, 77, 54)',
    );
  },
};

const TYPE_SCALE = [
  ['text-caption', 'Caption 12 px'],
  ['text-label', 'Label 13 px'],
  ['text-body', 'Body 14 px'],
  ['text-title', 'Title 16 px'],
  ['text-page', 'Page 22 px'],
  ['text-stat tabular-nums', 'Stat 26 px'],
  ['font-display text-display', 'Display 36 px'],
] as const;

export const Typography: Story = {
  render: () => (
    <div className="grid gap-3">
      {TYPE_SCALE.map(([classes, label]) => (
        <p key={label} className={`m-0 ${classes}`}>
          {label}
        </p>
      ))}
    </div>
  ),
};
