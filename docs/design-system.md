# Design system — analiza i plan (Faza 3.2)

Źródło: projekt „Panel administracyjny Ziarnista” w Claude Design, plik `Ziarnista Admin.dc.html`
(`support.js` to tylko runtime prototypu, nie zawiera decyzji projektowych). Kopia pliku:
`docs/design/ziarnista-admin.dc.html`.

Status: **zaakceptowany**. Wdrażany krokami z sekcji 5.6.

Liczby (kontrasty, częstość wartości) zostały policzone skryptem na kodzie projektu. Kontrast
według WCAG 2.2: tekst ≥ 4,5:1, elementy interfejsu ≥ 3:1.

---

## 1. Tokeny

### 1.1 Kolory

Kolumna „Nazwa w DS” to proponowana nazwa w `packages/ui`. Zmiany względem projektu są
**pogrubione** i uzasadnione w 1.2.

| Projekt            | Nazwa w DS                     | Jasny                | Ciemny            | Zastosowanie                   |
| ------------------ | ------------------------------ | -------------------- | ----------------- | ------------------------------ |
| `--bg`             | `--background`                 | `#F8F6F3`            | `#161210`         | tło strony                     |
| `--surface`        | `--card`, `--popover`          | `#FFFFFF`            | `#1E1916`         | karty, pola, modal             |
| `--surface2`       | `--muted`, `--accent`          | `#F3EFEA`            | `#28211D`         | nagłówki tabel, hover          |
| `--border`         | `--border`                     | `#E6E0D8`            | `#362D28`         | obramowania kart, separatory   |
| `--border-strong`  | `--border-strong`              | `#D3CBC0`            | `#4A3F38`         | linie przerywane               |
| —                  | **`--input`**                  | **`#8A7F74`**        | **`#8A7D73`**     | obramowanie pól formularza     |
| `--text`           | `--foreground`                 | `#2B1D14`            | `#F1EBE5`         | tekst                          |
| `--muted`          | `--muted-foreground`           | `#6E6259`            | `#A99C91`         | tekst drugorzędny              |
| `--accent`         | `--primary`                    | **`#BC4D36`**        | `#D8674E`         | akcja główna                   |
| `--accent-hover`   | `--primary-hover`              | `#B04530`            | `#E57B62`         | hover akcji głównej            |
| `#fff` na akcencie | **`--primary-foreground`**     | `#FFFFFF`            | **`#161210`**     | tekst na akcji głównej         |
| `--accent-soft`    | `--primary-soft`               | `#F7E7E2`            | `#3A231C`         | zaznaczenie, aktywna nawigacja |
| `--accent-ink`     | `--primary-ink`                | `#A8432D`            | `#EE9A85`         | linki, tekst na `-soft`        |
| —                  | **`--ring`**                   | **`#BC4D36`**        | **`#D8674E`**     | wskaźnik focusu                |
| `--ok`             | `--success`                    | **`#2A7247`**        | `#7FCB9B`         | status pozytywny               |
| `--ok-soft`        | `--success-soft`               | `#E3F1E8`            | `#1D3227`         | tło statusu                    |
| `--warn`           | `--warning`                    | `#94600A`            | `#E7B862`         | ostrzeżenie                    |
| `--warn-soft`      | `--warning-soft`               | `#FAEFD8`            | `#382D17`         | tło ostrzeżenia                |
| `--info`           | `--info`                       | `#2D5F9A`            | `#8DB5E8`         | informacja                     |
| `--info-soft`      | `--info-soft`                  | `#E4EDF8`            | `#1C2939`         | tło informacji                 |
| `--violet`         | `--violet`                     | `#664A98`            | `#B9A2E3`         | status „Wysłane”               |
| `--violet-soft`    | `--violet-soft`                | `#EEE8F7`            | `#2A2238`         | tło statusu                    |
| `--danger`         | `--destructive`                | `#B3261E`            | `#F09A92`         | błąd, akcja niszcząca          |
| `--danger-soft`    | `--destructive-soft`           | `#FBE7E5`            | `#3C1E1B`         | tło błędu                      |
| —                  | **`--destructive-foreground`** | `#FFFFFF`            | `#1E1916`         | tekst na akcji niszczącej      |
| `--neutral-soft`   | `--neutral-soft`               | `#EEE9E3`            | `#2C2520`         | status „Zarchiwizowany”        |
| `--overlay`        | `--overlay`                    | `rgba(43,29,20,.35)` | `rgba(0,0,0,.55)` | tło modala                     |

**Pułapka nazewnicza.** W projekcie `--accent` to kolor marki, a `--muted` to kolor tekstu.
W shadcn/ui `--accent` to subtelne tło hovera, a `--muted` to tło. Przyjmuję nazwy z shadcn,
bo komponenty generowane przez CLI od razu będą działać. Dopisuję tylko to, czego shadcn nie ma.

### 1.2 Wyniki audytu kontrastu

| Para                              | Tryb   | Kontrast  | Wynik     | Propozycja                         | Po zmianie  |
| --------------------------------- | ------ | --------- | --------- | ---------------------------------- | ----------- |
| biały na `--accent` (przyciski)   | jasny  | 4,35      | niezgodne | `--primary: #BC4D36`               | 4,94        |
| biały na `--accent`               | ciemny | 3,52      | niezgodne | ciemny tekst `#161210`             | 5,29        |
| biały na `--accent-hover`         | ciemny | 2,86      | niezgodne | ciemny tekst `#161210`             | 6,51        |
| `--ok` na `--ok-soft` (badge)     | jasny  | 4,32      | niezgodne | `--success: #2A7247`               | 5,01        |
| `--border` na karcie (obrys pola) | oba    | 1,31      | niezgodne | osobny `--input`                   | 3,91 / 4,36 |
| `--border-strong` na karcie       | oba    | 1,61–1,71 | niezgodne | jw. (zostaje tylko jako dekoracja) | —           |
| poświata focusu `--accent-soft`   | oba    | 1,2       | niezgodne | pełny pierścień `--ring`           | ≥ 4,31      |

Pozostałe pary tekstowe (`--muted`, statusy, `--accent-ink`) przechodzą 4,5:1 w obu motywach.

Pułapka przy ujednolicaniu: przycisk niszczący ma w projekcie `color: var(--surface)`, a główny
`#fff`. W ciemnym motywie biały na `--danger` dałby tylko 2,16:1, więc tekst musi być osobnym
tokenem (`--destructive-foreground`), a nie stałym białym.

Sklep ma ten sam problem: biały na terakocie `#C8553D` to 4,35:1, terakota jako tekst na kremie
3,88:1, a szałwia na kremie 2,67:1. Propozycja dla sklepu: `--primary: #B84A33` (5,17 z białym,
4,60 na kremie), szałwia tylko dekoracyjnie lub z ciemnym tekstem (5,42). Zaakceptowane, SPEC §5
zaktualizowany.

### 1.3 Typografia

Projekt używa 15 rozmiarów, w tym ułamkowych: 11 (×7), 11,5 (×6), 12 (×16), 12,5 (×26), 13 (×43),
13,5 (×35), 14 (×19), 15 (×14), 16 (×3), 17 (×2), 20, 22, 23, 26, 36. Propozycja: 7 stopni w `rem`,
z własnymi nazwami, żeby nie nadpisywać domyślnych `text-sm` / `text-base` z Tailwinda.

| Token            | Wartość | Scala z      | Zastosowanie                           |
| ---------------- | ------- | ------------ | -------------------------------------- |
| `--text-caption` | 12 px   | 11, 11,5, 12 | badge, nagłówek tabeli, oś wykresu     |
| `--text-label`   | 13 px   | 12,5, 13     | etykiety, podpowiedzi, błędy, metadane |
| `--text-body`    | 14 px   | 13,5, 14     | treść, pola, komórki tabeli, przyciski |
| `--text-title`   | 16 px   | 15, 16, 17   | tytuł karty, EmptyState, modal         |
| `--text-page`    | 22 px   | 20, 22, 23   | H1 strony, logo w sidebarze            |
| `--text-stat`    | 26 px   | 26           | wartości KPI                           |
| `--text-display` | 36 px   | 36           | logo na ekranie logowania              |

- Fonty: Inter (UI), Fraunces (tylko logo), `ui-monospace` (SKU, slug, kody błędów).
- Grubości: 400, 500, 600. Wariant 700 jest ładowany, ale nieużywany, więc do usunięcia.
- Interlinia: 1,45 dla treści, 1,5 dla `textarea`. Wyrównuję do 1,5.
- Nagłówek tabeli i sekcji: wielkie litery, `letter-spacing` 0,04 em (w projekcie 0,04 i 0,05).
- Liczby: zawsze `tabular-nums`.
- Domyślne `cn` nie zna własnych nazw: `cn('text-label', 'text-foreground')` traci rozmiar fontu,
  a `cn('h-control-md', 'h-control-sm')` zostawia obie klasy. W kroku 3 powstaje wspólny `cn` przez
  `createCn` z `cn/config`, z rozszerzoną grupą `font-size` i skalą `spacing`, oraz test na te pary.

### 1.4 Odstępy, rozmiary, zaokrąglenia, cienie, ruch

**Odstępy** — siatka 4 px (domyślna w Tailwindzie). W projekcie gapy to 2, 3, 4, 6, 7, 8, 10, 12, 14,
16, 18, 20, 28. Dopuszczam: 2, 4, 6, 8, 12, 16, 20, 24.

| Rola                      | Projekt   | Propozycja |
| ------------------------- | --------- | ---------- |
| etykieta → pole           | 6         | 6          |
| między polami             | 14–18     | 16         |
| między kartami            | 16        | 16         |
| padding karty             | 18/20, 20 | 20         |
| padding modala, logowania | 22, 28    | 24         |
| poziomy padding strony    | 28        | 24         |

**Wysokość kontrolek** — w projekcie 30, 32, 34, 36, 38, 40, 42. Propozycja: `sm` 32 px
(akcje masowe, paginacja), `md` 36 px (filtry, przyciski, pola w tabeli), `lg` 40 px (pola
formularza, logowanie). Segmenty w `SegmentedControl` = wysokość kontrolki minus 6 px.

**Układ** — sidebar 232 px, topbar 60 px, szerokość treści do 1320 px.

**Zaokrąglenia** — w projekcie 4, 5, 6, 7, 8, 9, 10, 12, 14, 50%, 999. Propozycja: `sm` 6 px
(4–7, małe elementy), `md` 8 px (8–9, kontrolki), `lg` 12 px (10–12, karty), `xl` 14 px (modal,
logowanie), `full` (badge, awatar).

**Cienie** — `--shadow-xs` to `--shadow` z projektu. Dodaję `--shadow-lg` dla toastu i modala:
`0 8px 24px rgba(0,0,0,.18)` jest w projekcie zaszyte na stałe w toaście, a modal nie ma cienia.

**Ruch** — `--duration-fast` 120 ms, `--duration-base` 200 ms (w projekcie 0,12–0,25 s). Animacja
pulsowania szkieletu 1,4 s. Wszystko wyłączone przy `prefers-reduced-motion`.

---

## 2. Inwentarz komponentów

Kolumna „W projekcie” opisuje tylko to, co widać w pliku. Braki są w sekcji 4.

### 2.1 Prymitywy

| Komponent   | Warianty                                                                                         | Stany                                     |
| ----------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Button      | primary, secondary (obrys), ghost/tekst, danger (pełny), danger-outline (masowe „Usuń”), z ikoną | hover, disabled, ładowanie („Logowanie…”) |
| IconButton  | z obrysem (motyw, paginacja), bez obrysu (wyloguj, usuń wariant), na zdjęciu                     | hover, hover-danger, disabled             |
| TextLink    | w tekście, „wstecz” z chevronem                                                                  | hover                                     |
| Input       | tekst, e-mail, mono (SKU), liczbowy do prawej, wyszukiwarka z ikoną, hasło z „Pokaż”             | focus, błąd (czerwony obrys)              |
| InputGroup  | prefiks (`ziarnista.pl/produkt/`)                                                                | brak focusu                               |
| Textarea    | `rows` 2–4, zmiana wysokości                                                                     | focus                                     |
| Select      | natywny, `md`/`lg`, przerywany obrys w „Podglądzie stanu” (tylko prototyp)                       | brak stylu focusu                         |
| Checkbox    | natywny z `accent-color`, z etykietą, w tabeli                                                   | zaznaczony                                |
| Field       | etykieta + pole + błąd, licznik znaków `x/60`, gwiazdka wymagalności                             | błąd, przekroczony limit                  |
| Badge       | z kropką: success, warning, info, violet, primary, destructive, neutral                          | —                                         |
| CountBadge  | pełny (nawigacja), szary (zakładki), sam tekst (nawigacja „Produkty”)                            | —                                         |
| ToggleChip  | „Niski stan”, metody parzenia z ✓/+, podpowiedzi z przerywanym obrysem                           | wł./wył., hover                           |
| Avatar      | inicjały                                                                                         | —                                         |
| Thumbnail   | 40×40, placeholder z inicjałami                                                                  | —                                         |
| Card        | z paddingiem, bez paddingu (tabela), przerywana (EmptyState)                                     | —                                         |
| Skeleton    | prostokąt, linia, pigułka                                                                        | pulsowanie                                |
| ProgressBar | pasek udziału w sprzedaży                                                                        | —                                         |
| Alert       | destructive (logowanie), `role="alert"`                                                          | —                                         |

### 2.2 Komponenty złożone

| Komponent        | Co jest w projekcie                                                                                                       | Stany                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| SegmentedControl | okres, status, stopień palenia (wzorzec powtarza się 3 razy, dlatego osobny komponent)                                    | aktywny                                   |
| Tabs             | podkreślenie z licznikiem (statusy zamówień)                                                                              | aktywna                                   |
| DataTable        | produkty (zaznaczanie, miniatura, paginacja), zamówienia, ostatnie zamówienia, edytowalne warianty                        | hover, zaznaczony, brak wyników, szkielet |
| BulkActionBar    | licznik i akcje nad tabelą                                                                                                | widoczny przy zaznaczeniu                 |
| Pagination       | poprzednia/następna, numery, zakres „1–8 z 18”                                                                            | aktualna, disabled                        |
| Modal            | tylko potwierdzenie akcji niszczącej                                                                                      | otwarty                                   |
| Toast            | ciemny z kolorową kropką (ok, błąd), 2,6 s                                                                                | pojawienie się                            |
| TagInput         | pigułki, Enter/przecinek dodaje, Backspace usuwa, podpowiedzi                                                             | wypełniony, pusty                         |
| ImageUploader    | siatka, przeciąganie, oznaczenie „Główne”, usuwanie, kafel dodawania                                                      | przeciągany, cel upuszczenia              |
| **Combobox**     | **nie występuje w projekcie.** Potrzebny do `Origin` (słownik) i kategorii (drzewo), które w projekcie są zwykłymi polami | —                                         |
| StatCard         | etykieta, wartość, zmiana                                                                                                 | tylko zmiana dodatnia                     |
| BarChart         | słupki z hoverem, linie siatki                                                                                            | hover                                     |
| Timeline         | historia statusów z notatką                                                                                               | ostatni wpis aktywny                      |
| SummaryList      | para etykieta–wartość (podsumowanie, koszty)                                                                              | —                                         |

### 2.3 Sekcje

| Komponent      | Co jest w projekcie                                       | Stany                |
| -------------- | --------------------------------------------------------- | -------------------- |
| AppShell       | sidebar + kolumna treści                                  | —                    |
| Sidebar        | logo, nawigacja z licznikami, profil, wylogowanie         | aktywny, hover       |
| Topbar         | wyszukiwarka, przełącznik motywu                          | —                    |
| PageHeader     | „wstecz”, tytuł, badge, „Niezapisane zmiany”, opis, akcje | wszystkie opcjonalne |
| FormSection    | karta z tytułem, opisem i opcjonalną akcją                | —                    |
| EmptyState     | ikona, tytuł, opis, CTA, przerywany obrys                 | z CTA, bez CTA       |
| ErrorState     | ikona, tytuł, opis, kod błędu, „Spróbuj ponownie”         | —                    |
| ForbiddenState | ikona, tytuł, opis, dwie akcje                            | —                    |
| LoadingState   | szkielety kart i wierszy, „Wczytywanie danych…”           | `aria-busy`          |
| AuthCard       | logo, formularz, błąd ogólny                              | błąd, ładowanie      |

Poza `packages/ui`, w `apps/admin`: mapowanie status → kolor badge'a, podgląd wyników wyszukiwarki
(SEO). To logika domeny, a nie design system.

Nie implementujemy elementów samego prototypu: selecta „Podgląd stanu” i notki „Prototyp: hasło…”.

---

## 3. Niespójności w projekcie

| #   | Niespójność                                                                                         | Ujednolicenie                                                                          |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Statusy produktu po angielsku (`ACTIVE`, „Ustaw DRAFT”), a zamówień po polsku                       | Wszędzie po polsku: Aktywny, Szkic, Zarchiwizowany (konwencja z CLAUDE.md)             |
| 2   | Badge: 11 px/0,04 em (produkty), 11,5 px/0,02 em (nagłówek), 11,5 px bez odstępu (zamówienia)       | Jeden wariant: `--text-caption`, bez `letter-spacing`                                  |
| 3   | Przyciski: promień 7 lub 8, padding 12/14/16, część bez rozmiaru fontu                              | Warianty i rozmiary tylko przez `cva`                                                  |
| 4   | Disabled: opacity 0,4 (paginacja), 0,5 (status), brak zmiany (logowanie); wszędzie `cursor:pointer` | Jeden styl: opacity 0,5 i `cursor: not-allowed`                                        |
| 5   | Tabele: nagłówek 40 lub 34 px, padding 16 lub 20, wiersz 58/60 px lub padding 11 px                 | Dwie gęstości DataTable: `comfortable`, `compact`                                      |
| 6   | Tabele budowane z `div` i CSS Grid (0 elementów `<table>`)                                          | Semantyczny `<table>`, kolumny przez `<colgroup>`                                      |
| 7   | Paginacja tylko przy produktach, zamówienia bez niej                                                | Paginacja w każdej liście z API                                                        |
| 8   | Pięć wzorców „wybrane”: pigułka z cieniem, podkreślenie, chip, numer strony, nawigacja              | Zostają trzy role: wybór jednej opcji (Segmented), zakładki (Tabs), przełącznik (Chip) |
| 9   | „Niski stan” bez `aria-pressed`, metody parzenia z `aria-pressed`                                   | ToggleChip zawsze ustawia `aria-pressed`                                               |
| 10  | Hover wiersza nadpisuje kolor zaznaczonego                                                          | Osobny kolor dla hover + zaznaczony                                                    |
| 11  | „Anuluj” zamyka modal obok CTA „Anuluj zamówienie”                                                  | „Wróć” i „Anuluj zamówienie”                                                           |
| 12  | Nawigacja i klikalne wiersze to `button`/`div` z `onClick`                                          | `next/link` z `aria-current="page"`, w tabeli prawdziwy link w komórce                 |
| 13  | Nagłówki: H1, potem od razu H3                                                                      | H1 → H2 w kartach                                                                      |
| 14  | Kolory wpisane na stałe (`#fff`, `rgba(0,0,0,.08)`, cień toastu)                                    | Tylko tokeny                                                                           |
| 15  | SPEC §5 opisuje panel jako „neutralny”, a projekt jest ciepły                                       | Trzymam się projektu; SPEC do aktualizacji                                             |

### 3.1 Rozjazdy projektu z backendem i SPEC

To nie są decyzje wizualne, ale wpływają na komponenty i dane.

| Projekt                                                          | Backend / SPEC                                               | Propozycja                                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Statusy NEW, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED     | enum PENDING, PAID, SHIPPED, DELIVERED, CANCELLED            | Trzymać się enuma, usunąć „W realizacji”, NEW → PENDING                                                                          |
| Numer `ZR-10496`                                                 | `ZIA-RRRR-NNNNNN`                                            | Format z SPEC, kolumna musi być szersza niż 100 px                                                                               |
| Masowe „Usuń” z tekstem „trwale usunięte”, „Usuń wariant”        | Produkt archiwizowany, wariant `isActive = false`            | Tylko „Archiwizuj”; wariant „Wyłącz”                                                                                             |
| Metoda „Cold brew”                                               | enum bez `COLD_BREW`                                         | Usunąć z UI                                                                                                                      |
| Kraj, region, wysokość, obróbka jako tekst                       | Tylko `originId` (słownik `Origin`)                          | Combobox pochodzenia, reszta pól poza MVP                                                                                        |
| Sekcja „Profil kawy” zależna od kategorii                        | Zależna od `kind`, kategoria to tylko nawigacja              | Dodać wybór `kind`                                                                                                               |
| Kategoria jako płaska lista                                      | Drzewo                                                       | Combobox z wcięciami                                                                                                             |
| Status przy tworzeniu produktu                                   | Nowy produkt jest zawsze szkicem                             | Status dostępny dopiero przy edycji                                                                                              |
| „SKU bazowe”                                                     | SKU tylko na wariancie                                       | Usunąć pole                                                                                                                      |
| Filtr „Niski stan”                                               | `GET /admin/products` nie ma takiego parametru               | Dodać do API: `lowStock=true` (aktywny wariant ze `stock < 5`, próg jako stała w `shared`), z testem; etykieta w UI według progu |
| Historia statusów, notatka, „Powiadom klienta”, metoda płatności | Nie ma w modelu danych (SPEC §3)                             | Poza MVP; `Timeline` zostaje w planie niskopriorytetowo                                                                          |
| „Zapamiętaj mnie”, „Nie pamiętasz hasła?”, „Poproś o dostęp”     | Stała sesja admina 8 h, brak resetu hasła, jedna rola ADMIN  | Usunąć z UI                                                                                                                      |
| Darmowa dostawa od 200 zł (logika prototypu)                     | Od 150 zł                                                    | Dane z API, UI nie liczy                                                                                                         |
| Brak ekranu kategorii i przycisku opisu AI                       | Oba w zakresie MVP panelu (SPEC §1)                          | Zbudować z istniejących komponentów, bez nowych makiet                                                                           |
| Brak sortowania na liście                                        | API ma `sort` (updated, newest, name, price_asc, price_desc) | Sortowalne nagłówki w DataTable                                                                                                  |

---

## 4. Czego projekt nie obejmuje

| Obszar               | Stan w projekcie                                                                                  | Propozycja                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Focus                | Tylko pola (poświata 1,2:1); 2 pola z `outline:none` bez zamiennika (tagi, slug)                  | `:focus-visible`: pierścień 2 px `--ring` z odstępem 2 px wszędzie; pola złożone przez `:focus-within`                       |
| Disabled             | Niespójny (punkt 4 wyżej), brak wariantu dla pól                                                  | Opacity 0,5, `not-allowed`, także dla Input, Select, Checkbox                                                                |
| Ładowanie przycisku  | Tylko zmiana tekstu                                                                               | Spinner, `aria-busy`, stała szerokość, blokada podwójnego wysłania                                                           |
| Błędy walidacji      | Czerwony obrys; brak `aria-invalid` i powiązania z komunikatem; w wariantach bez tekstu przy polu | `aria-invalid` + `aria-describedby`, ikona i tekst, nie sam kolor; mapowanie ścieżek Zod na pola; błędy API (np. zajęte SKU) |
| Długie formularze    | Tylko toast „Popraw zaznaczone pola”                                                              | Podsumowanie błędów u góry z linkami; focus na pierwszym błędzie                                                             |
| Etykiety             | Pola wariantów i checkboxy wierszy bez nazw dostępnych; `title` zamiast `aria-label`              | Nazwa dostępna wymagana w typach (`aria-label` lub etykieta)                                                                 |
| Pola wymagane        | Gwiazdka tylko przy nazwie, bez legendy                                                           | `required` + legenda „* pole wymagane”                                                                                       |
| Checkbox „wszystkie” | Tylko wł./wył.                                                                                    | Stan `indeterminate`                                                                                                         |
| Modal                | Brak pułapki focusu, Esc, powrotu focusu; klik w tło zamyka także akcję niszczącą                 | Wszystko to + `alertdialog`, focus startowy na bezpiecznym przycisku, tło nie zamyka akcji niszczących                       |
| Toast                | Znika po 2,6 s, zawsze `role="status"`                                                            | Min. 5 s, pauza przy hoverze i focusie, przycisk zamknięcia, błędy jako `alert`, kolejka                                     |
| Tabela               | Brak sortowania, odświeżania, zaznaczania między stronami                                         | `aria-sort`, nakładka odświeżania, zachowanie zaznaczenia                                                                    |
| Przeciąganie zdjęć   | Wyłącznie myszą (WCAG 2.5.7)                                                                      | Przyciski „w lewo/w prawo” i „Ustaw jako główne”                                                                             |
| Upload               | Brak postępu, błędów pliku, ponowienia                                                            | Stany: wysyłanie, sukces, błąd typu/rozmiaru, ponów                                                                          |
| Rozmiar celu         | Usuwanie tagu 20×20, checkbox 16×16 (WCAG 2.5.8 wymaga 24×24)                                     | Pole klikalne min. 24×24 przy zachowaniu wyglądu                                                                             |
| Wykres               | Tylko hover myszą                                                                                 | Focus na słupkach i ukryta tabela danych                                                                                     |
| StatCard             | Zawsze zielona zmiana                                                                             | Wariant ujemny z ikoną strzałki                                                                                              |
| Aktywna nawigacja    | Rozróżniona prawie wyłącznie kolorem                                                              | Pasek po lewej lub grubsza czcionka                                                                                          |
| Responsywność        | Stały sidebar 232 px, brak wersji mobilnej                                                        | Poniżej 1024 px wysuwany panel; niski priorytet, na koniec Fazy 3                                                            |
| Globalne             | —                                                                                                 | Skip link, `lang="pl"`, `color-scheme`, `forced-colors`, `prefers-reduced-motion`, ostrzeżenie o niezapisanych zmianach      |
| Pozostałe stany      | Combobox, Select otwarty, tooltip, menu                                                           | Do zdefiniowania w Storybooku                                                                                                |

---

## 5. Plan `packages/ui`

### 5.1 Struktura

```text
packages/ui/
  .storybook/
  src/
    styles/tokens.css            # zmienne CSS, :root i .dark
    styles/theme.css             # motyw Tailwinda: mapowanie kolorów, stałe skale, style bazowe
    styles/storefront-theme.css  # nadpisania marki sklepu
    styles/sources.css           # @source: gdzie Tailwind ma szukać klas komponentów
    styles/contrast.test.ts      # WCAG: oba motywy panelu i sklep
    lib/cn.ts             # cn znający własne skale z theme.css
    primitives/           # button.tsx, input.tsx, ...
    composites/           # data-table/, modal/, combobox/, ...
    sections/             # sidebar.tsx, page-header.tsx, ...
```

- **Paczka wewnętrzna bez kroku budowania.** `exports` wskazuje na źródła, Next.js kompiluje je
  przez `transpilePackages`. Alternatywa: build jak w `shared`, ale to dodatkowy proces w `dev`
  bez korzyści, skoro paczki nie publikujemy.
- **Importy per komponent** (`@ziarnista/ui/button`), bez jednego `index.ts`. Dzięki temu
  komponent kliencki z `'use client'` nie trafia do Server Components przez wspólny barrel.
- **Sekcje bez zależności od Next.js.** `Sidebar` i `Topbar` przyjmują linki przez `asChild`,
  dzięki czemu działają w Storybooku.

### 5.2 Tokeny i motywy

Dwie warstwy: `tokens.css` (wartości) i `theme.css` (`@theme inline`, czyli klasy typu
`bg-primary`). Motyw sklepu leży w tej samej paczce, żeby jeden test kontrastu obejmował wszystkie
motywy bez zależności paczki od aplikacji. Aplikacja renderująca komponenty dodaje
`transpilePackages: ['@ziarnista/ui']` i import `@ziarnista/ui/styles/sources.css`. Na razie robi to
tylko panel, sklep dołączy przy pierwszym użytym komponencie.

```css
/* apps/storefront/src/app/globals.css */
@import 'tailwindcss';
@import '@ziarnista/ui/styles/tokens.css';
@import '@ziarnista/ui/styles/theme.css';
@import '@ziarnista/ui/styles/storefront-theme.css'; /* nadpisuje --background, --primary, ... */
```

- Sklep zmienia wartości zmiennych, a komponenty zostają bez zmian. To główny powód, dla którego
  kolory są zmiennymi CSS, a nie stałymi w konfiguracji.
- Ciemny motyw zostaje na klasie `.dark`, jak teraz w panelu i jak domyślnie w shadcn. Sklep ma
  tylko motyw jasny.
- Test jednostkowy czyta `tokens.css` i sprawdza kontrast par z 1.2 w obu motywach, także dla
  nadpisań sklepu. Zmiana koloru psująca WCAG nie przejdzie CI.

### 5.3 Radix/shadcn czy od zera

**Rekomendacja: podejście mieszane.** Radix dostarcza zachowanie tam, gdzie błąd jest kosztowny
i mało pouczający. shadcn jest punktem startowym dla stylów (kod trafia do repo i jest nasz).
Trzy komponenty powstają ręcznie.

Dlaczego nie wszystko od zera: role ARIA to mniejsza część pracy. Trudne są roving tabindex,
typeahead, pozycjonowanie, różnice między czytnikami ekranu. Radix ma to przetestowane na
kombinacjach przeglądarek i czytników, których sami nie sprawdzimy.

Dlaczego nie wszystko z Radixa: na rozmowie „użyłem biblioteki” niczego nie dowodzi. Mocniejsza
odpowiedź to: „Rozumiem wzorce ARIA, dlatego napisałem Modal i Combobox sam, ale Tabsów już nie,
bo tam ręczna implementacja nic by nie wniosła, a podniosła ryzyko”.

| Komponent                                      | Podstawa                        | Powód                                                                       |
| ---------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| Button, Input, Textarea, Card, Badge, Skeleton | HTML + `cva`                    | Radix nie ma tu nic do dodania                                              |
| Select                                         | natywny `<select>`              | Taki jest w projekcie; najlepsza obsługa na mobile; długie listy → Combobox |
| Checkbox                                       | Radix                           | `indeterminate` i kontrola wyglądu                                          |
| Tabs                                           | Radix                           | Roving tabindex, automatyczne ARIA                                          |
| SegmentedControl                               | Radix ToggleGroup (`single`)    | Semantyka grupy wyboru                                                      |
| Toast                                          | Radix                           | Region live, pauza, gest zamknięcia                                         |
| Tooltip, Popover, DropdownMenu                 | Radix                           | Pozycjonowanie, kolizje, Esc                                                |
| Modal                                          | **ręcznie**, natywny `<dialog>` | Patrz 5.5                                                                   |
| Combobox                                       | **ręcznie** + Radix Popover     | Radix go nie ma (sprawdzone w zainstalowanej wersji 1.8.1)                  |
| DataTable                                      | **ręcznie**, bez TanStack Table | Patrz 5.5                                                                   |

Paczki `radix-ui`, `class-variance-authority`, `cn` i `lucide-react` przeniosły się z `apps/admin`
do `packages/ui` (`lucide-react` jest też nadal w panelu, bo używa go bezpośrednio). `tw-animate-css`
zostaje w panelu do kroku 7: Tooltip nie ma animacji, a pierwszym animowanym komponentem będzie Toast.

### 5.4 Storybook i testy

Storybook w `packages/ui`, builder Vite. Nowe zależności deweloperskie (**wymagają akceptacji**):

| Paczka                                                                                   | Po co                                        |
| ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| `storybook`, `@storybook/react-vite`, `vite`, `@tailwindcss/vite`                        | Storybook z Tailwindem                       |
| `@storybook/addon-a11y`                                                                  | Panel axe w każdej story                     |
| `@storybook/addon-vitest`, `@vitest/browser`, `@vitest/browser-playwright`, `playwright` | Stories jako testy w prawdziwej przeglądarce |

Sprawdzone w npm: Storybook 10.6.6 akceptuje Vitest 5 (jest w repo), React 19 i Vite 8. Instalacji
jeszcze nie próbowałem.

Zasady:

- Każdy komponent ma story dla każdego wariantu i stanu, w obu motywach (przełącznik w toolbarze).
- `parameters.a11y.test = 'error'`, więc naruszenie axe zatrzymuje testy.
- Testy idą w przeglądarce, nie w jsdom, bo jsdom nie policzy kontrastu.
- Zachowanie (klawiatura, focus) sprawdzają funkcje `play`.
- axe wykrywa tylko część problemów. Dla Modala, Comboboxa i DataTable dodaję ręczną listę
  kontrolną: sama klawiatura, NVDA, powiększenie 200%.

### 5.5 Podział pracy

**A. Najpierw testy akceptacyjne.** Stories z funkcjami `play` powstają przed implementacją i na
początku nie przechodzą. Decyzja zmieniona po kroku 5: te trzy komponenty implementuje Claude, a
właściciel sprawdza je ręcznie.

| Komponent     | Dlaczego warto                                              | Kryteria akceptacji (skrót)                                                                                                                     |
| ------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modal**     | Krótki, a uczy focusu, warstw, `<dialog>` i `inert`         | `showModal()`, focus startowy i powrót, Esc, `aria-labelledby`, wariant `alertdialog`, blokada przewijania                                      |
| **Combobox**  | Najtrudniejszy wzorzec ARIA, częste pytanie rekrutacyjne    | `role="combobox"`, `aria-activedescendant`, strzałki/Home/End/Enter/Esc, filtrowanie, wcięcia dla drzewa, stany: ładowanie, brak wyników        |
| **DataTable** | Generyki TypeScript i projekt API; „generyczna” jest w SPEC | `DataTable<T>`, kontrolowane sortowanie/paginacja/zaznaczenie (stan w URL + RTK Query), `aria-sort`, stany: ładowanie, pusto, błąd, odświeżanie |

Twoja trójka jest dobrze wybrana. Kolejność zmieniłbym na: Modal, Combobox, DataTable, od
najmniejszego do największego.

Modal: polecam natywny `<dialog>`, bo pułapkę focusu, Esc i warstwę daje przeglądarka, a do
napisania zostaje to, co naprawdę uczy. Pułapka do omówienia na rozmowie: elementy z portalu
Radixa (Popover, Tooltip) renderowane do `body` są pod modalem i nieaktywne, więc w Modalu trzeba
im podać kontener portalu. Alternatywa to Radix Dialog: mniej pracy, mniej nauki.

DataTable bez TanStack Table: wymagania są tu małe, bo sortowanie i paginację robi serwer. Sam
kontrakt typów pokazuje na rozmowie więcej niż konfiguracja biblioteki. TanStack ma sens przy
grupowaniu, wirtualizacji i zmianie kolejności kolumn.

```ts
interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortKey?: string;
  align?: 'start' | 'end';
}
```

**B. Generuję, a Ty czytasz uważnie.** Dużo logiki, ale nauka mniejsza niż w grupie A.

TagInput, ImageUploader (przeciąganie natywne, bez nowej paczki), Field, Pagination,
BulkActionBar, BarChart, MoneyInput (złotówki w polu, grosze w danych).

**C. Generuję, a Ty przeglądasz wyrywkowo.** Powtarzalna praca na podstawie tokenów.

Button, IconButton, TextLink, Input, InputGroup, Textarea, Select, Checkbox, Badge, CountBadge,
ToggleChip, Avatar, Thumbnail, Card, Skeleton, ProgressBar, Alert, Tabs, SegmentedControl, Toast,
Tooltip, StatCard, SummaryList, Timeline, AppShell, Sidebar, Topbar, PageHeader, FormSection,
EmptyState, ErrorState, ForbiddenState, LoadingState, AuthCard.

### 5.6 Kolejność budowy

Każdy krok to jedna spójna zmiana z testami. Komponenty z każdego kroku opierają się na
wcześniejszych.

| Krok | Zakres                                                                                                       | Autor  |
| ---- | ------------------------------------------------------------------------------------------------------------ | ------ |
| 1    | Szkielet paczki, tokeny, motyw, test kontrastu, podłączenie panelu i sklepu                                  | Claude |
| 2    | Storybook, axe, Vitest w przeglądarce, integracja z `pnpm test` i Turbo                                      | Claude |
| 3    | Button, IconButton, TextLink, Badge, Skeleton, Card, Avatar, Alert                                           | Claude |
| 4    | Field, Input, InputGroup, Textarea, Select, Checkbox, MoneyInput                                             | Claude |
| 5    | CountBadge, ToggleChip, SegmentedControl, Tabs, Tooltip, Pagination                                          | Claude |
| 6    | **Modal** + ConfirmDialog na jego bazie                                                                      | Claude |
| 7    | Toast                                                                                                        | Claude |
| 8    | **Combobox**                                                                                                 | Claude |
| 9    | TagInput                                                                                                     | Claude |
| 10   | **DataTable** + Thumbnail, BulkActionBar                                                                     | Claude |
| 11   | ImageUploader                                                                                                | Claude |
| 12   | EmptyState, ErrorState, ForbiddenState, LoadingState, StatCard, BarChart, ProgressBar, SummaryList, Timeline | Claude |
| 13   | AppShell, Sidebar, Topbar, PageHeader, FormSection, AuthCard                                                 | Claude |

Osobne kroki poza design systemem: filtr `lowStock` w API (przed ekranem listy produktów) oraz
responsywność panelu poniżej 1024 px (na koniec Fazy 3).

Ekrany panelu powstają dopiero potem, w osobnym etapie Fazy 3.
