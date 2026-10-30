# CLAUDE.md — Ziarnista

## O projekcie

Sklep z kawą speciality + panel admina. Projekt portfolio full-stack.
Pełna specyfikacja: @docs/SPEC.md — przeczytaj ją przed większymi zmianami.

## Tryb pracy (ważne)

- Właściciel projektu UCZY SIĘ budowania takich systemów. Po każdej zmianie wyjaśnij krótko: co zrobiłeś, dlaczego tak, jakie były alternatywy.
- Pracuj małymi krokami. Jedno zadanie = jedna spójna zmiana.
- Przed większą zmianą (nowy moduł, zmiana schematu bazy, nowa biblioteka) przedstaw plan i poczekaj na akceptację.
- NIE dodawaj nowych zależności bez pytania.
- NIE rób commitów ani pushy — robi je właściciel.
- Jeśli czegoś nie wiesz albo specyfikacja jest niejasna — zapytaj, nie zgaduj.

## Środowisko

- System: Windows, terminal PowerShell / Git Bash
- Node.js 24 (LTS) — wersja w `.nvmrc` i `engines` w root `package.json`
- Menedżer pakietów: pnpm (nie npm, nie yarn)
- Baza i usługi uruchamiane przez Docker Compose

## Struktura (docelowa)

- `apps/storefront` — Next.js, sklep
- `apps/admin` — Next.js, panel
- `apps/api` — NestJS, REST API
- `packages/shared` — typy i schematy Zod współdzielone przez aplikacje
- `docs/` — dokumentacja

## Konwencje kodu

- TypeScript strict, bez `any`
- Kod, nazwy, komentarze i commity po angielsku; teksty w UI po polsku
- Kwoty zawsze w groszach (int), formatowanie dopiero w UI
- Walidacja wejścia przez Zod (schematy w `packages/shared`)
- API: REST, prefiks `/api/v1`, każdy endpoint opisany w Swaggerze
- Każdy nowy endpoint i logika biznesowa ma test
- Nazwy plików: kebab-case

## Komendy

Uruchamiane z katalogu głównego repo (`pnpm <skrypt>`):

- `pnpm dev` — uruchamia wszystkie aplikacje i pakiety w trybie deweloperskim (Turborepo).
- `pnpm build` — buduje wszystkie pakiety i aplikacje w kolejności zależności.
- `pnpm lint` — sprawdza kod ESLintem (z regułami opartymi na typach) we wszystkich pakietach.
- `pnpm typecheck` — sprawdza typy TypeScript we wszystkich pakietach bez generowania plików.
- `pnpm test` — uruchamia testy (Vitest) we wszystkich pakietach.
- `pnpm format` — formatuje całe repo Prettierem (zapisuje zmiany).
- `pnpm format:check` — sprawdza formatowanie bez zmian w plikach (do CI).
- `pnpm db:up` — uruchamia PostgreSQL (pgvector) i MinIO w Docker Compose i czeka na healthchecki.
- `pnpm db:down` — zatrzymuje kontenery; dane zostają w nazwanych wolumenach.
- `pnpm db:migrate` — `prisma migrate dev` (tworzy i stosuje migracje) + `prisma generate`.
- `pnpm db:seed` — idempotentny seed (`apps/api/prisma/seed/`): kategorie, pochodzenie, produkty, admin i klient testowy (dane logowania `SEED_*` w `.env`).
- `pnpm db:studio` — Prisma Studio (podgląd danych w przeglądarce).
- `pnpm db:reset` — kasuje bazę, stosuje wszystkie migracje od zera i uruchamia seed. Tylko lokalnie.

Klient Prisma (`apps/api/src/generated/`, poza gitem) generuje zadanie turbo `db:generate`, uruchamiane automatycznie przed `dev`, `build`, `lint`, `typecheck` i `test`. Prisma 7 nie generuje klienta ani nie uruchamia seeda po `migrate dev` / `migrate reset` — robią to skrypty powyżej.

Migracje z SQL-em, którego Prisma nie obsługuje (CHECK, sekwencje): `prisma migrate dev --create-only --name <nazwa>`, dopisanie SQL do wygenerowanego pliku, potem `pnpm db:migrate`.

API (`apps/api`): `http://localhost:4000/api/v1`, Swagger: `http://localhost:4000/api/docs`, health: `GET /api/v1/health`.

Sklep (`apps/storefront`): `http://localhost:3000`, panel (`apps/admin`): `http://localhost:3001`. Oba przekazują `/api/*` do API (rewrites, adres w `API_URL` w root `.env`).

Pierwsze uruchomienie: `cp .env.example .env`, `pnpm install`, `pnpm db:up`.
