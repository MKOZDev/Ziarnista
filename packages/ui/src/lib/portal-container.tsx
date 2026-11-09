'use client';

import { createContext, useContext } from 'react';

// A modal <dialog> sits in the top layer and makes the rest of the page inert, so anything portaled
// to <body> ends up behind it and unusable. A modal provides itself here as the portal target.
const PortalContainerContext = createContext<HTMLElement | null>(null);

export const PortalContainerProvider = PortalContainerContext.Provider;

export function usePortalContainer() {
  return useContext(PortalContainerContext);
}
