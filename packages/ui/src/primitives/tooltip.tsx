'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { usePortalContainer } from '../lib/portal-container';

export type TooltipProps = Pick<ComponentProps<typeof TooltipPrimitive.Content>, 'side'> & {
  content: ReactNode;
  /** A focusable element; a disabled button fires no events, so it would never show the tooltip */
  children: ReactElement;
};

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const container = usePortalContainer();

  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={container}>
          <TooltipPrimitive.Content
            data-slot="tooltip"
            side={side}
            sideOffset={6}
            collisionPadding={8}
            className="z-50 max-w-xs rounded-sm bg-foreground px-2 py-1 text-caption text-background shadow-lg"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
