# Dziennik pracy z AI (Claude Code)

Zapis sytuacji, w których AI zrobiło coś nie tak, nieoczywistego albo wartego uwagi — i jak
to zostało wyłapane. Materiał do case study (SPEC, faza 8).

Nowe wpisy na górze.

## Format wpisu

```markdown
### RRRR-MM-DD — krótki tytuł

**Sytuacja:** nad czym pracowaliśmy, jakie było polecenie.

**Co zrobiło AI:** co dokładnie zaproponowało lub zmieniło (z odnośnikiem do pliku/commita).

**Jak to wyłapałem:** test, review, uruchomienie, narzędzie — co zdradziło problem.

**Wniosek:** czego się nauczyłem, co zmieniam w pracy z AI (prompt, CLAUDE.md, proces).
```

## Wpisy

### 2026-11-02 — „Naprawianie" fałszywego alarmu REST Client

**Sytuacja:** praca nad `docs/api.http`. VS Code (rozszerzenie REST Client) podkreślał na
czerwono zmienne z filtrem `?(...)` w ścieżce JSON, mimo że requesty działały poprawnie.

**Co zrobiło AI:** uznało podkreślenia za prawdziwy błąd i zaczęło przerabiać plik, żeby
diagnostyka zniknęła — zmiany nie poprawiały niczego, co faktycznie nie działało.

**Jak to wyłapałem:** requesty wysłane ręcznie zwracały poprawne wyniki, więc problem był po
stronie diagnostyki edytora, nie pliku. Przerwałem AI i cofnąłem zmiany `git restore`.

**Wniosek:** ostrzeżenie w edytorze to nie dowód błędu — najpierw sprawdzić, czy coś naprawdę
nie działa. Gdy AI idzie w złą stronę, lepiej przerwać od razu i wrócić do czystego stanu
z gita niż prostować zmiany kolejnymi poleceniami. Ograniczenie opisane w komentarzu
w `docs/api.http` (commit `02a8952`).

### 2026-10-30 — Test z `toMatchObject`: najpierw kod, potem test

**Sytuacja:** test z asercją `toMatchObject` nie przechodził.

**Co zrobiło AI:** najprostszą drogą do zielonego testu była zmiana samego testu
(oczekiwanej wartości), tak żeby pasował do tego, co zwraca kod.

**Jak to wyłapałem:** zanim zgodziłem się na zmianę testu, sprawdziłem, czy błąd nie leży
w kodzie — czyli czy test nie wyłapuje prawdziwej regresji.

**Wniosek:** czerwony test to informacja, nie przeszkoda. Zmiana testu „pod kod" jest
dopuszczalna dopiero, gdy wiadomo, że to test był błędny. AI ma tendencję do wybierania
najkrótszej drogi do zielonego wyniku.

### 2026-10-30 — Pole `kind` wbrew rekomendacji AI

**Sytuacja:** projektowanie schematu bazy — jak odróżnić kawy (wymagane pochodzenie i stopień
palenia) od akcesoriów.

**Co zrobiło AI:** rekomendowało rozwiązanie bez osobnego pola `kind`.

**Jak to wyłapałem:** przy przeglądzie propozycji uznałem, że drzewo kategorii nie powinno
decydować o strukturze danych — kategorie się zmieniają, a reguły walidacji muszą być stabilne.

**Wniosek:** wybrałem `Product.kind` (COFFEE | ACCESSORY): kategoria = nawigacja, `kind` =
struktura danych. Ta sama reguła w CHECK constraint (`products_coffee_fields_check`) i w Zod
(`productAttributesSchema`) — SPEC, sekcja 7.4. Rekomendacja AI to punkt wyjścia, decyzja
architektoniczna należy do mnie.

### 2026-10-29 — Claude API nie liczy embeddingów

**Sytuacja:** pierwotna specyfikacja projektu, sekcja AI.

**Co zrobiło AI:** w specyfikacji Claude API było wskazane także do liczenia embeddingów
(wyszukiwarka semantyczna, „podobne kawy"). Anthropic nie udostępnia modelu embeddingów.

**Jak to wyłapałem:** przegląd SPEC przed rozpoczęciem implementacji.

**Wniosek:** do embeddingów Voyage AI (rekomendowany przez Anthropic), Claude API tylko do
generowania tekstu i zamiany zapytania na filtry — SPEC, sekcja 7.1. Fakty o zewnętrznych
usługach z odpowiedzi AI trzeba weryfikować w dokumentacji.
