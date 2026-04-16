# Nudge — Schemat bazy danych

Folder zawiera pełny schemat bazy dla MVP v1 aplikacji Nudge.

## Pliki

- **[nudge_schema.dbml](./nudge_schema.dbml)** — źródłowy schemat w formacie DBML (~40 tabel, 18 grup). Wklej do [dbdiagram.io](https://dbdiagram.io) dla interaktywnego diagramu.
- **[nudge_schema_documentation.md](./nudge_schema_documentation.md)** — dokumentacja: po co każda grupa tabel istnieje, jakie decyzje za nimi stoją, kolejność implementacji w sprintach.
- **[nudge_schema_diagram.mermaid](./nudge_schema_diagram.mermaid)** — uproszczony diagram ER w Mermaid. Podgląd: [mermaid.live](https://mermaid.live).

## Jak czytać

1. **Najpierw dokumentacja** — da Ci kontekst i wyjaśnia kluczowe decyzje (event-sourcing, wersjonowanie planów, RLS, podział LLM/reguły).
2. **Potem DBML** — pełna specyfikacja z enumami, indeksami i notatkami.
3. **Diagram** — do szybkiej mapy relacji między głównymi tabelami.

## Zasady przekrojowe (TL;DR)

- Event-sourcing dla profilu: `user_profile_facts` to źródło prawdy, `user_profile` to cache.
- Wersjonowanie planów treningowych i żywieniowych: kontener + wersje, nigdy nie nadpisujemy.
- RLS Supabase na każdej user-scoped tabeli.
- Wszystkie id = UUID.
- Pełna obserwowalność AI: każde wywołanie LLM, koszt, latency, prompt_version, structured output.
- Guardrails i safety_escalations jako osobna warstwa, nie w planerach.

## Kolejność implementacji

7 sprintów. Szczegóły w [dokumentacji](./nudge_schema_documentation.md#kolejność-implementacji-dla-sprintów).

## Powiązane dokumenty

- [ADR-001: Stack technologiczny](../ADR/ADR-001-stack-technologiczny.md)
- [ADR-002: LLM i guardrails](../ADR/ADR-002-llm-guardrails.md)
- [ADR-003: Segmentacja użytkowników](../ADR/ADR-003-segmentacja-uzytkownikow.md)
- [ADR-004: Monetyzacja i pricing](../ADR/ADR-004-monetyzacja-pricing.md)
- [Nudge Product Principles](../Principles/nudge_product_principles.md)
