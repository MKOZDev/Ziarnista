'use client';

import { AppShell } from '@ziarnista/ui/app-shell';
import { IconButton } from '@ziarnista/ui/icon-button';
import {
  Sidebar,
  SidebarBrand,
  SidebarLink,
  SidebarNav,
  SidebarProfile,
} from '@ziarnista/ui/sidebar';
import { Topbar } from '@ziarnista/ui/topbar';
import { FolderTree, LayoutDashboard, LogOut, MapPin, Package, Receipt } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCurrentAdmin } from '@/features/auth/current-admin';
import { useSignOut } from '@/features/auth/use-sign-out';
import { ThemeToggle } from '@/features/theme/theme-toggle';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produkty', icon: Package },
  { href: '/categories', label: 'Kategorie', icon: FolderTree },
  { href: '/origins', label: 'Pochodzenia', icon: MapPin },
  { href: '/orders', label: 'Zamówienia', icon: Receipt },
] as const;

/** A section stays marked on its subpages, e.g. /products/123. */
function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

function PanelSidebar() {
  const pathname = usePathname();
  const admin = useCurrentAdmin();
  const { signOut, isSigningOut } = useSignOut();

  return (
    <Sidebar
      brand={<SidebarBrand name="Ziarnista" badge="Panel" />}
      footer={
        <SidebarProfile
          name={admin.name}
          role="Administrator"
          action={
            <IconButton
              variant="ghost"
              aria-label="Wyloguj"
              disabled={isSigningOut}
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut aria-hidden />
            </IconButton>
          }
        />
      }
    >
      <SidebarNav aria-label="Główna nawigacja">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <SidebarLink
            key={href}
            asChild
            active={isActive(pathname, href)}
            icon={<Icon aria-hidden />}
          >
            <Link href={href}>{label}</Link>
          </SidebarLink>
        ))}
      </SidebarNav>
    </Sidebar>
  );
}

export function PanelShell({ children }: { children: ReactNode }) {
  return (
    <AppShell sidebar={<PanelSidebar />} topbar={<Topbar actions={<ThemeToggle />} />}>
      {children}
    </AppShell>
  );
}
