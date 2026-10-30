# Ziarnista — specyfikacja projektu

Sklep internetowy z kawą speciality i akcesoriami do parzenia + panel administracyjny.
Projekt portfolio pokazujący umiejętności full-stack (TypeScript, Next.js, NestJS, PostgreSQL, Docker, AI).

## 1. Zakres MVP

### Sklep (apps/storefront)

- Strona główna (hero, polecane kawy, kategorie)
- Lista produktów z filtrami: kategoria, pochodzenie, stopień palenia, metoda parzenia, cena; sortowanie; paginacja
- Strona produktu z wyborem wariantu (gramatura / ziarno lub mielona), zdjęciami, nutami smakowymi, „podobne kawy" (AI)
- Koszyk — działa także dla gościa (token w cookie), łączony z kontem po zalogowaniu
- Checkout: dane, adres, wysyłka (stała stawka 14,99 zł, darmowa od 150 zł), płatność Stripe (test mode)
- Rejestracja, logowanie, wylogowanie, historia zamówień
- Wyszukiwarka semantyczna (AI), np. „coś owocowego do dripa, nie za kwaśnego"

### Panel (apps/admin)

- Logowanie (tylko rola ADMIN)
- Produkty: lista, filtrowanie, tworzenie, edycja, archiwizacja; warianty; upload i kolejność zdjęć
- Generowanie opisu produktu i meta SEO przez AI
- Kategorie (drzewo)
- Zamówienia: lista, szczegóły, zmiana statusu
- Dashboard: sprzedaż, liczba zamówień, najlepiej sprzedające się produkty

### Poza MVP (po publikacji)

InPost ShipX, kody rabatowe, subskrypcje, recenzje, Meilisearch.

## 2. Stack

| Warstwa                        | Technologia                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Język                          | TypeScript (strict)                                                               |
| Środowisko uruchomieniowe      | Node.js 24 (LTS)                                                                  |
| Sklep                          | Next.js (App Router) + Tailwind CSS                                               |
| Panel                          | Next.js + Tailwind CSS + shadcn/ui                                                |
| API                            | NestJS, REST, Swagger (OpenAPI), prefiks `/api/v1`                                |
| Walidacja / typy współdzielone | Zod w `packages/shared`                                                           |
| Baza                           | PostgreSQL + Prisma, pgvector (AI)                                                |
| Kolejki                        | Redis + BullMQ (wygasanie zamówień PENDING, zadania AI)                           |
| Pliki                          | Storage S3-kompatybilny: MinIO (lokalnie, Docker), Cloudflare R2 (produkcja)      |
| Płatności                      | Stripe (test mode)                                                                |
| AI                             | Claude API (opisy, meta SEO, zamiana zapytania na filtry), Voyage AI (embeddingi) |
| Testy                          | Jest/Vitest (unit, integracyjne), Playwright (E2E)                                |
| Infrastruktura                 | Docker, Docker Compose, GitHub Actions, VPS OVH                                   |
| Repo                           | Monorepo: pnpm workspaces + Turborepo                                             |

## 3. Model danych

- **User**: id, email (unique), passwordHash, name, role (CUSTOMER | ADMIN), createdAt
- **Session**: id, userId, expiresAt, createdAt — własne sesje w bazie, cookie httpOnly (szczegóły w sekcji 7.2)
- **Address**: id, userId, fullName, street, city, postalCode, phone
- **Category**: id, name, slug (unique), parentId (nullable)
- **Origin**: id, name (unique), slug (unique) — słownik pochodzenia kawy
- **Product**: id, kind (enum ProductKind: COFFEE | ACCESSORY), name, slug (unique), description, metaTitle (nullable), metaDescription (nullable), status (DRAFT | ACTIVE | ARCHIVED), categoryId, originId (nullable, wymagane dla COFFEE), roastLevel (enum RoastLevel: LIGHT | MEDIUM | DARK; nullable, wymagane dla COFFEE), flavorNotes (string[], lowercase), brewMethods (enum BrewMethod[]: ESPRESSO | POUR_OVER | AEROPRESS | FRENCH_PRESS | MOKA), minPrice (int, grosze, denormalizowane), embedding (vector, faza AI), createdAt, updatedAt
- **ProductVariant**: id, productId, sku (unique), label (np. „250 g / ziarno"), price (int, grosze), stock (int), isActive (boolean)
- **ProductImage**: id, productId, url, alt, position
- **Cart**: id, userId (nullable), guestToken (nullable), updatedAt
- **CartItem**: id, cartId, variantId, quantity
- **Order**: id, number (czytelny, np. ZIA-2026-000123), userId (nullable), email, status (PENDING | PAID | SHIPPED | DELIVERED | CANCELLED), subtotal, shippingCost, total (int, grosze), shippingAddress (JSON — kopia), stripePaymentIntentId, createdAt, updatedAt
- **OrderItem**: id, orderId, variantId (wymagane), productName, variantLabel, sku, unitPrice, quantity — kopia danych z chwili zakupu
- **StripeEvent**: id (id zdarzenia ze Stripe), type, processedAt — rejestr przetworzonych webhooków

Zasady:

1. Kwoty zawsze jako liczby całkowite w groszach.
2. Zamówienie przechowuje kopię danych produktu i adresu, nie tylko referencje.
3. Produktów i wariantów nie usuwamy fizycznie — produkt archiwizujemy (status ARCHIVED), wariant wyłączamy (isActive = false).

## 4. Endpointy API (`/api/v1`)

### Publiczne

- `GET /products` — filtry, sortowanie, paginacja
- `GET /products/:slug`
- `GET /products/:slug/similar` (AI)
- `GET /categories`
- `GET /search?q=` (AI)
- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`
- `POST /checkout` — tworzy zamówienie PENDING, rezerwuje stan magazynu i tworzy PaymentIntent Stripe
- `POST /webhooks/stripe` — zmiana statusu PENDING → PAID (idempotentnie)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET /me`, `GET /me/orders`

### Admin (rola ADMIN)

- `GET/POST /admin/products`, `GET/PATCH/DELETE /admin/products/:id` (DELETE = archiwizacja)
- `POST /admin/products/:id/images`, `PATCH /admin/products/:id/images/order`, `DELETE /admin/images/:id`
- `GET/POST/PATCH/DELETE /admin/categories`
- `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status`
- `GET /admin/stats`
- `POST /admin/ai/describe`

## 5. Kierunek graficzny

### Sklep

- Ciepły, minimalistyczny, magazynowy
- Kolory: tło `#F6F1EA` (krem), tekst `#2B1D14` (espresso), akcent `#C8553D` (terakota), dodatkowy `#8A9A7B` (szałwia)
- Fonty: Fraunces (nagłówki), Inter (treść)
- Duże zdjęcia, dużo przestrzeni, nuty smakowe jako kolorowe „pigułki"

### Panel

- Neutralny, czytelny, shadcn/ui, jasny i ciemny motyw

## 6. Fazy

0. Specyfikacja ✅
1. Środowisko, Claude Code, szkielet monorepo, Docker
2. Backend core (Prisma, auth, produkty, kategorie, zamówienia, testy)
3. Panel admina
4. Storefront + Stripe
5. Funkcje AI
6. Testy E2E + CI
7. Deploy na VPS
8. README, demo, opis decyzji

## 7. Decyzje techniczne

### 7.1 AI

- **Voyage AI** — embeddingi produktów i zapytań (pgvector): wyszukiwarka semantyczna i „podobne kawy".
- **Claude API** — generowanie opisów produktów, meta SEO oraz zamiana zapytania w języku naturalnym na filtry.

### 7.2 Auth — wzorzec BFF

- Przeglądarka komunikuje się wyłącznie z Next.js (sklep lub panel). Next.js przez rewrites przekazuje `/api/*` do NestJS — z perspektywy przeglądarki wszystko jest na jednym originie.
- Cookie sesji: `httpOnly`, `Secure`, `SameSite=Lax`.
- Przy mutacjach (POST/PATCH/PUT/DELETE) API sprawdza nagłówek `Origin` (ochrona przed CSRF).
- Osobne cookies dla sklepu i panelu. Czas życia sesji: admin 8 h, klient 30 dni.

### 7.3 Magazyn, zamówienia i płatności

- Stan magazynu zmniejszany atomowo przy checkout: `UPDATE ... SET stock = stock - n WHERE id = ... AND stock >= n` w jednej transakcji z utworzeniem zamówienia. Brak stanu dla dowolnej pozycji = rollback całości.
- Zamówienie PENDING wygasa po 30 min od `createdAt`: job (BullMQ) ustawia CANCELLED i zwraca stan magazynu.
- Webhook Stripe jest idempotentny: id przetworzonych zdarzeń zapisywane w tabeli `StripeEvent`; zdarzenie już obecne jest pomijane. Dozwolone jest tylko przejście PENDING → PAID.
- Numer zamówienia budowany z wartości sekwencji PostgreSQL (format `ZIA-RRRR-NNNNNN`).

### 7.4 Katalog i filtry

- `roastLevel` i `brewMethods` jako enumy (BrewMethod: ESPRESSO, POUR_OVER, AEROPRESS, FRENCH_PRESS, MOKA).
- Pochodzenie jako osobna tabela słownikowa `Origin`.
- `flavorNotes` — wolny tekst zapisywany lowercase, bez filtrowania (tylko wyświetlanie i AI).
- `Product.minPrice` denormalizowane, przeliczane przy każdej zmianie wariantów; filtr i sortowanie po cenie używają `minPrice`.
- Filtr kategorii obejmuje wszystkie podkategorie danej kategorii.
- **Kategoria = nawigacja, `kind` = struktura danych.** `Product.kind` (COFFEE | ACCESSORY) mówi, jakie pola produkt musi mieć; drzewo kategorii służy tylko do nawigacji i filtrów. `originId` i `roastLevel` są nullable (akcesoria ich nie mają), ale dla `kind = COFFEE` wymagane — ta sama reguła w CHECK constraint w bazie (`products_coffee_fields_check`) i w schemacie Zod (`productAttributesSchema` w `packages/shared`).
- `Product.minPrice` jest `null`, gdy produkt nie ma aktywnych wariantów (np. szkic).

### 7.5 Pliki, usuwanie danych, koszyk

- Zdjęcia w storage S3-kompatybilnym: lokalnie MinIO w Docker Compose, na produkcji Cloudflare R2.
- `DELETE /admin/products/:id` archiwizuje produkt (status ARCHIVED), nie usuwa go.
- Wariant ma flagę `isActive`, bez twardego usuwania; dzięki temu `OrderItem.variantId` jest wymagane.
- Łączenie koszyka gościa z kontem po zalogowaniu: ilości tego samego wariantu sumujemy, maksymalnie do aktualnego stanu magazynu.
