# Panel admina — stan, sesja, testy (Faza 3.3a)

## 1. Gdzie trzymamy stan

Zasada: każda informacja ma jedno miejsce, wybrane według tego, kto ją zna i kto jej potrzebuje.

| Miejsce                        | Co                                                         | Dlaczego tu                                                                                                              |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| RTK Query                      | dane z API: `me`, produkty, kategorie, pochodzenia         | Właścicielem danych jest serwer. RTK Query daje cache, deduplikację, stany ładowania i unieważnianie                     |
| Redux slice `session`          | `status`: `active` / `expired` / `signed-out`              | Ustawia go `baseQuery`, czyli kod poza Reactem, a czyta `SessionGate`. Store jest jedynym miejscem dostępnym z obu stron |
| Redux slice `productSelection` | zaznaczone produkty (id → nazwa) i lista, do której należą | Zaznaczenie musi przetrwać zmianę strony i wizytę w edycji produktu, a w URL-u byłoby za długie                          |
| URL                            | filtry, sortowanie, strona, `returnTo`                     | Stan widoku da się skopiować w linku, działa „wstecz” i odświeżenie                                                      |
| Context                        | motyw, bieżący admin                                       | Rzadko się zmieniają i są potrzebne w całym drzewie                                                                      |
| `useState`                     | pola formularzy, błędy formularza                          | Nikt poza danym komponentem ich nie potrzebuje                                                                           |

Szczegóły, które łatwo przeoczyć:

- **Bieżący admin nie jest kopią danych.** Źródłem pozostaje zapytanie `getMe`. Context mówi tylko, że `SessionGate` już je wczytał, więc `useCurrentAdmin()` zwraca `AuthUser` bez `undefined`.
- **Motyw nie jest w Reduksie**, bo jego źródłem jest klasa `.dark` na `<html>`, ustawiana przez skrypt jeszcze przed załadowaniem Reacta. `useSyncExternalStore` jest przeznaczony właśnie do subskrypcji stanu spoza Reacta.
- **Slice jest celowo mały.** Nowe pola dodajemy dopiero, gdy stan UI musi być dostępny z kilku niezależnych miejsc i nie pasuje do URL-a.

### Stan listy w URL (produkty)

`useProductListParams` czyta i zmienia stan listy wyłącznie przez URL. Czyste funkcje są w `product-list-params.ts`.

- **Walidacja schematem z `shared`, parametr po parametrze.** Każdy parametr sprawdza część `adminProductListQuerySchema`. Nieprawidłowy (np. `status=PUBLISHED` z literówki) wraca do wartości domyślnej, a reszta działa. Cała lista nie kończy się błędem.
- **Wartości domyślne nie trafiają do URL-a.** Jeden widok ma jeden adres. Ten sam serializer buduje zapytanie do API, bo API stosuje te same wartości domyślne.
- **Zmiana czegokolwiek poza stroną wraca na stronę 1.**
- **`push` dla świadomych kroków** (filtr, strona, sortowanie), żeby „wstecz” je cofał. **`replace` dla wyszukiwania**, żeby każda pauza w pisaniu nie dodawała kroku w historii.
- **Wyszukiwanie z debounce 300 ms.** Pole ma własny stan i synchronizuje się z URL-em w obie strony. Zmiana URL-a z zewnątrz („Wyczyść filtry”, „wstecz”) aktualizuje pole, a stara wartość z debounce nie wraca do adresu.
- **Sortowalne są tylko nagłówki, które mają odpowiednik w API** (nazwa, cena, w obie strony). „Ostatnio zmienione” i „Najnowsze” są tylko w selekcie sortowania.

### Zaznaczenie i akcje zbiorcze

- **Zaznaczenie należy do jednej listy.** Slice zapisuje `scope`, czyli query string listy bez numeru strony (`selectionScope`). Inny filtr, wyszukiwanie albo sortowanie to inny `scope`. Selektor od razu zwraca wtedy puste zaznaczenie, a efekt czyści je na stałe, więc „wstecz” do starych filtrów go nie przywraca. Zmiana strony nie zmienia `scope`.
- **Nazwy obok id.** Dialog potwierdzenia i toast z błędami wymieniają produkty, także te z innych stron, których wierszy nie ma już w cache.
- **Pasek mówi, ile zaznaczonych jest na innych stronach**, więc akcja nigdy nie dotyczy czegoś niewidocznego bez ostrzeżenia.
- **API nie ma endpointu zbiorczego.** `bulkProductAction` to jedna mutacja RTK Query z `queryFn`, która wysyła po jednym żądaniu na produkt, najwyżej 4 naraz (`mapSettled`, czyli `Promise.allSettled` z limitem). Jedna mutacja daje jedno unieważnienie tagów i jedno odświeżenie listy na końcu, a nie po każdym produkcie.
- **Błąd jednego produktu nie zatrzymuje pozostałych.** Udane produkty znikają z zaznaczenia, a nieudane zostają zaznaczone. Toast podaje przy każdym z nich powód z API, np. brak zdjęcia przy publikacji.
- Archiwizacja idzie przez `DELETE` (SPEC 7.5), a zmiana statusu przez `PATCH { status }` bez `expectedUpdatedAt`. Akcja zbiorcza świadomie nadpisuje status, a locking chroni treść formularza.
- Wylogowanie i wygaśnięcie sesji czyszczą zaznaczenie.

W testach `next/navigation` jest zastąpione mockiem (`src/test/navigation.ts`). `push` i `replace` zmieniają w nim query string, a `useSearchParams` re-renderuje komponenty, tak jak router Nexta.

## 2. Tagi RTK Query

Tagi: `Product`, `Category`, `Origin`, `Order`. Zapytania deklarują, jakie dane dostarczają, a mutacje, co zmieniają.

- Lista dostarcza `{ type, id: 'LIST' }` oraz `{ type, id }` każdego wiersza. Szczegóły dostarczają `{ type, id }`.
- Create unieważnia `LIST`. Update i archiwizacja unieważniają `id` i `LIST`, bo zmieniają kolumny listy.
- Jeden `LIST` obejmuje wszystkie kombinacje filtrów i stron. RTK Query odświeża tylko listy, które są aktualnie wyświetlane, a pozostałe wypadają z cache.
- Zależności między zasobami:
  - mutacje produktu unieważniają `Category` i `Origin` `LIST`, bo te odpowiedzi mają `productCount`,
  - zmiana kategorii unieważnia `Product` `LIST`, bo lista pokazuje jej nazwę,
  - anulowanie zamówienia unieważni `Product`, bo zwraca stan magazynu.
- Akcja zbiorcza unieważnia `LIST` i `id` produktów, dla których się udała. Nie unieważnia `Category` ani `Origin`: ich `productCount` liczy produkty w każdym statusie.
- Bez optymistycznych aktualizacji: w panelu ważniejsza jest prawda z serwera niż milisekundy. Wyjątek rozważymy przy zmianie kolejności zdjęć.
- Wylogowanie i wygaśnięcie sesji robią `resetApiState`, a nie unieważnianie tagów, bo cache nie może przeżyć zmiany użytkownika.

## 3. Sesja

Cookie `zia_admin_session` jest `httpOnly`, więc JavaScript w przeglądarce go nie widzi.

| Warstwa                | Pytanie                  | Skutek                                                                    |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `src/proxy.ts`         | Czy cookie istnieje?     | Brak: przekierowanie na `/login?returnTo=...` jeszcze przed renderowaniem |
| `SessionGate`          | Czy sesja jest ważna?    | `GET /admin/me`; strony renderują się dopiero po sukcesie                 |
| `baseQueryWithSession` | Czy API odrzuciło sesję? | 401 ustawia `status: expired`, `SessionGate` czyści cache i przekierowuje |

Reakcje na błędy:

- **401** przekierowuje na logowanie z parametrem powrotu. Wyjątkiem jest `login`, gdzie 401 oznacza złe hasło.
- **403** to `ForbiddenState` dla zapytania i toast dla mutacji, bo po mutacji strona nadal jest poprawna.
- **Sieć, 5xx, odpowiedź niezgodna ze schematem** to `ErrorState` z ponowieniem. Awaria API nie może wylogowywać. Gdy API leży, proxy Nexta zwraca stronę błędu, stąd obsługa `PARSING_ERROR`.

`status` przechodzi w `expired` tylko z `active`, więc spóźniony 401 po celowym wylogowaniu nie pokaże komunikatu o wygaśnięciu sesji.

`/login` nie przekierowuje w proxy, nawet gdy cookie istnieje: nieważne cookie dałoby pętlę przekierowań. Już zalogowanego administratora przenosi formularz, po udanym `GET /admin/me`.

`returnTo` pochodzi z URL-a, więc jest niezaufany. `safeReturnTo` używa parsera URL jak przeglądarka, bo sprawdzanie prefiksu przepuściłoby np. `/\evil.com`.

## 4. Motyw

1. Skrypt inline w `<head>` ustawia `.dark` przed pierwszym malowaniem: zapisany wybór, potem `prefers-color-scheme`.
2. `suppressHydrationWarning` na `<html>` dopuszcza różnicę klasy między HTML-em serwera a DOM-em.
3. `ThemeProvider` subskrybuje zmiany systemowe i inne karty. Dopóki nie ma ręcznego wyboru, panel podąża za systemem.
4. Gdy `localStorage` jest zablokowany, wybór obowiązuje do końca wizyty.

## 5. Testy

Vitest + Testing Library + MSW w jsdom (`pnpm --filter @ziarnista/admin test`).

MSW przechwytuje żądania na poziomie sieci, więc testy przechodzą przez prawdziwy `baseQuery`, schematy odpowiedzi i ścieżkę 401. Ręczny mock `fetch` ominąłby właśnie ten kod.

jsdom nie sprawdzi faktycznego przeniesienia fokusu przez skip link ani uruchomienia `proxy.ts` przez Next. Testy obejmują logikę i matcher, a resztę pokryje Playwright w fazie 6.
