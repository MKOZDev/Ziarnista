import { ApiStatusBadge } from '@/components/api-status-badge';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-6xl font-semibold tracking-tight sm:text-7xl">Ziarnista</h1>
      <p className="max-w-md text-lg text-espresso/75">
        Kawa speciality i akcesoria do parzenia. Sklep wkrótce ruszy.
      </p>
      <ApiStatusBadge />
    </main>
  );
}
