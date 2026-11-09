import type { ComponentProps, ReactNode } from 'react';
import { Alert } from './alert';

export type AuthCardProps = Omit<ComponentProps<'form'>, 'title'> & {
  brand: string;
  subtitle?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Form-level error, e.g. wrong credentials */
  error?: ReactNode;
  /** Fields and the submit button */
  children: ReactNode;
};

export function AuthCard({
  brand,
  subtitle,
  title,
  description,
  error,
  children,
  ...props
}: AuthCardProps) {
  return (
    <main data-slot="auth-card" className="grid min-h-screen place-items-center p-6">
      <div className="flex w-full max-w-100 flex-col gap-7">
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-display font-semibold">{brand}</span>
          {subtitle && <span className="text-label text-muted-foreground">{subtitle}</span>}
        </div>
        {/* noValidate: errors come from Zod and Field, not native browser bubbles */}
        <form
          noValidate
          className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs"
          {...props}
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-page font-semibold">{title}</h1>
            {description && <p className="text-body text-muted-foreground">{description}</p>}
          </div>
          {error && <Alert>{error}</Alert>}
          {children}
        </form>
      </div>
    </main>
  );
}
