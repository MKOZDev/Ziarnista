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
(uzupełniamy w miarę powstawania projektu)
