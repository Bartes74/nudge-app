# Architecture Decision Records — Nudge App

Ten folder zawiera decyzje architektoniczne i produktowe podjęte dla aplikacji Nudge.
Każdy ADR opisuje jeden problem, rozważane opcje i wybraną decyzję wraz z konsekwencjami.

## Format

Każdy ADR ma:
- **Status:** Proposed / Accepted / Deprecated / Superseded
- **Datę** i **decydenta**
- **Kontekst** — jaki problem rozwiązujemy i dlaczego teraz
- **Rozważane opcje** z plusami i minusami
- **Decyzję** z uzasadnieniem
- **Konsekwencje** — co zyskujemy, co tracimy, jakie są ryzyka
- **Decyzje do rewizji później** — co świadomie odkładamy

## Spis

| # | Tytuł | Status | Data |
|---|---|---|---|
| [001](./ADR-001-stack-technologiczny.md) | Stack technologiczny | Accepted | 2026-04-15 |
| [002](./ADR-002-llm-guardrails.md) | Strategia LLM i guardrails | Accepted | 2026-04-15 |
| [003](./ADR-003-segmentacja-uzytkownikow.md) | Model segmentacji użytkowników | Accepted | 2026-04-15 |
| [004](./ADR-004-monetyzacja-pricing.md) | Monetyzacja i pricing | Accepted | 2026-04-15 |

## Kiedy pisać nowy ADR

Nowy ADR piszemy, gdy:
- Podejmujemy decyzję, którą ktoś inny (lub my za 6 miesięcy) będzie chciał zrozumieć
- Wybieramy między ≥ 2 sensownymi opcjami
- Decyzja wpływa na więcej niż jeden moduł
- Odwracanie decyzji kosztowałoby więcej niż tydzień pracy

Nie piszemy ADR dla: wyboru nazw zmiennych, lokalnego refaktoringu, decyzji trywialnych.

## Jak modyfikować ADR

ADR-y są **immutable** po statusie Accepted. Jeśli decyzja się zmienia:
1. Tworzymy nowy ADR opisujący nową decyzję
2. W nowym ADR sekcja „Superseduje" wskazuje stary numer
3. W starym ADR zmieniamy status na `Superseded by ADR-XXX`

## Następne kroki

Po tych ADR-ach:
- **PRD MVP v1** — na bazie decyzji architektonicznych rozpisujemy zakres, user stories, metryki
- **Schemat bazy danych** — DBML i diagram, uwzględniający confidence, wersjonowanie, segmentację, koszty AI
- **Ścieżki pytań dla segmentów** — konkretne drzewa onboardingu i warstw pytań dla 2-3 priorytetowych segmentów
