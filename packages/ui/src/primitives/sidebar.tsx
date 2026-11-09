import { Slot } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Avatar } from './avatar';

export type SidebarProps = {
  brand: ReactNode;
  footer?: ReactNode;
  /** One or more SidebarNav */
  children: ReactNode;
};

export function Sidebar({ brand, footer, children }: SidebarProps) {
  return (
    <aside
      data-slot="sidebar"
      className="sticky top-0 flex h-screen w-sidebar flex-none flex-col border-r bg-card"
    >
      {brand}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">{children}</div>
      {footer && <div className="border-t p-3.5">{footer}</div>}
    </aside>
  );
}

export type SidebarBrandProps = { name: string; badge?: string };

export function SidebarBrand({ name, badge }: SidebarBrandProps) {
  return (
    <div className="flex h-topbar flex-none items-center gap-2 border-b px-5">
      <span className="font-display text-page font-semibold">{name}</span>
      {badge && (
        <span className="text-caption font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {badge}
        </span>
      )}
    </div>
  );
}

export type SidebarNavProps = ComponentProps<'nav'> & {
  // Required: tells this navigation apart from any other landmark on the page
  'aria-label': string;
};

export function SidebarNav({ children, ...props }: SidebarNavProps) {
  return (
    <nav data-slot="sidebar-nav" {...props}>
      <ul className="flex flex-col gap-1">{children}</ul>
    </nav>
  );
}

export type SidebarLinkProps = ComponentProps<'a'> & {
  /** Renders the child element as the link, e.g. next/link */
  asChild?: boolean;
  active?: boolean;
  icon?: ReactNode;
  /** Shown at the end of the row, usually a CountBadge */
  count?: ReactNode;
};

export function SidebarLink({
  asChild = false,
  active = false,
  icon,
  count,
  className,
  children,
  ...props
}: SidebarLinkProps) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <li>
      <Comp
        data-slot="sidebar-link"
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex h-9.5 items-center gap-2.5 rounded-md px-3 text-body font-medium transition-colors duration-(--duration-fast) [&_svg]:size-4.5 [&_svg]:shrink-0',
          active
            ? // The bar and the weight mean the current page is not marked by color alone
              'bg-primary-soft font-semibold text-primary-ink before:absolute before:inset-y-1.5 before:left-0 before:w-0.75 before:rounded-full before:bg-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          className,
        )}
        {...props}
      >
        {icon}
        {/* Slottable: the icon and the count end up inside the child link, not next to it */}
        <Slot.Slottable>{children}</Slot.Slottable>
        {count && <span className="ml-auto">{count}</span>}
      </Comp>
    </li>
  );
}

export type SidebarProfileProps = {
  name: string;
  role: string;
  /** Usually a sign-out IconButton */
  action?: ReactNode;
};

export function SidebarProfile({ name, role, action }: SidebarProfileProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={name} decorative />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-label font-semibold">{name}</span>
        <span className="truncate text-caption text-muted-foreground">{role}</span>
      </div>
      {action}
    </div>
  );
}
