# Nudge — Kontekst projektu dla Claude Code

> Ten plik jest automatycznie wczytywany do kontekstu każdej sesji Claude Code.
> **Przeczytaj go w całości przed rozpoczęciem pracy.**
> Jeśli coś tu jest sprzeczne z moją wiadomością — zapytaj, nie zgaduj.

## Czym jest Nudge

**Nudge** to adaptacyjny AI coach treningowo-żywieniowy w formie PWA. Główna przewaga: działa przy niepełnych danych, dopytuje inteligentnie, stopniowo zwiększa precyzję planu, analizuje zdjęcia posiłków.

**Stan projektu:** pre-code. Mamy pełną dokumentację (ADR-y, Principles, schemat bazy, PRD) i zaczynamy kodować od zera.

**Zespół:** 1 osoba (Bartek, founder) + AI (Ty, Codex, Gemini).

## Obowiązkowa lektura przed pracą

Przed każdą zmianą kodu upewnij się, że rozumiesz zawartość:

1. **`docs/PRD/nudge_prd_v1.md`** — roadmapa 11 iteracji. Każda iteracja ma sekcję "Brief dla AI", której używaj jako głównej instrukcji.
2. **`docs/ADR/`** — 4 decyzje architektoniczne:
   - ADR-001: stack (Next.js 14 PWA + Supabase + Node/Fastify API + Turborepo)
   - ADR-002: LLM i guardrails
   - ADR-003: segmentacja użytkowników
   - ADR-004: monetyzacja (7-dniowy trial bez karty → 49 PLN/mc)
3. **`docs/Principles/nudge_product_principles.md`** — zasady produktu. Każda funkcja musi być z nimi zgodna. Jeśli prosię Cię o coś, co łamie Principles — zapytaj mnie przed implementacją.
4. **`docs/Schema/nudge_schema.dbml`** + **`docs/Schema/nudge_schema_documentation.md`** — schemat bazy i uzasadnienia. ~40 tabel, 18 grup.

## Stack (nieNegocjowalny bez nowego ADR)

- **Monorepo:** Turborepo + pnpm workspaces
- **Web:** Next.js 14 App Router + TypeScript strict + Tailwind + shadcn/ui + Next-PWA
- **Backend API:** Node.js + Fastify + TypeScript + zod walidacja envów
- **Baza:** Supabase (Postgres + Auth + Storage + RLS)
- **LLM:** OpenAI (gpt-4o-mini konwersacja, gpt-4o Vision i structured outputs) za abstrakcją `llmClient` w `packages/core/llm`
- **Worker/kolejki:** Inngest
- **Płatności:** Stripe
- **Email:** Resend
- **Observability:** Sentry + PostHog
- **Deploy:** Vercel (web), Fly.io (api), Supabase (managed)
- **Testy:** Vitest (unit/integration), Playwright (E2E)

## Struktura monorepo (dla Iteracji 0)

```
nudge-app/
├── apps/
│   ├── web/              # Next.js PWA (user-facing)
│   └── api/              # Fastify backend (orkiestracja AI, worker jobs)
├── packages/
│   ├── core/             # Logika domeny — WSPÓLNA między apps
│   │   ├── domain/       # Typy: Profile, Plan, Meal, CheckIn
│   │   ├── rules/        # BMR, TDEE, progresja, guardrails
│   │   ├── prompts/      # Wersjonowane prompty + JSON schemas
│   │   ├── llm/          # Klient LLM z abstrakcją dostawcy
│   │   ├── planners/     # Training/Nutrition planner
│   │   ├── analyzers/    # Check-in analyzer, meal vision
│   │   ├── signals/      # Behavior signals update
│   │   ├── questions/    # Progressive profiling scoring
│   │   └── billing/      # Subskrypcje, trial, dostęp
│   ├── ui/               # Wspólne komponenty React (faza 2 z natywnym)
│   └── config/           # ESLint, TS, Tailwind presets
├── supabase/
│   ├── migrations/       # Migracje SQL
│   ├── seeds/            # Dane startowe (exercises, question_library, field_explanations)
│   └── config.toml
├── docs/                 # Cała dokumentacja (ADR, Principles, Schema, PRD)
├── .claude/
│   └── CLAUDE.md         # TEN PLIK
├── .github/workflows/    # CI/CD
└── package.json
```

**Zasada krytyczna:** cała logika domeny siedzi w `packages/core`. `apps/web` i `apps/api` to cieńkie warstwy prezentacji/transportu. Nigdy nie duplikuj kalkulatora BMR w komponencie React.

## Zasady kodu — nie do negocjacji

1. **TypeScript strict mode.** Żadnych `any` w kodzie produkcyjnym. Jeśli typ jest naprawdę nieznany — `unknown` + zawężenie.
2. **Brak mocków i TODO-zaślepek.** Każdy kod musi działać end-to-end. Jeśli czegoś nie wiesz — zapytaj. Nie zostawiaj `// TODO: implement`.
3. **Envy walidowane przez zod runtime.** Brak brakującego env = crash na starcie, nie silent fallback.
4. **Structured outputs wszędzie, gdzie LLM coś zwraca do logiki.** Free-form tekst tylko dla wiadomości pokazywanych userowi w chacie.
5. **RLS na każdej tabeli user-scoped.** Test RLS w migracji (pgTAP lub integration test). Nie polegaj tylko na aplikacji.
6. **Każde wywołanie LLM = wpis do `llm_calls`.** Z kosztem, tokensami, prompt_version.
7. **Każda migracja ma `down`** (rollback).
8. **UUID wszędzie, nigdy serial.**
9. **Kalkulatory = pure functions.** Profile in → wartość out. Żadnych side effects.
10. **Guardrails przed każdą rekomendacją.** Zero wyjątków.

## Zasady pracy ze mną (Bartek)

1. **Plan przed kodem.** Dla każdej nietrywialnej zmiany (> 1 plik) najpierw pokaż mi plan: kroki, pliki, decyzje. Poczekaj na OK.
2. **Jedna iteracja = jedna sesja.** Nie mieszaj iteracji. Kiedy kończymy jedną, zacznij nową sesję dla kolejnej.
3. **Checkpointy.** Po każdym logicznym bloku (migracja, setup, endpoint, komponent) zatrzymaj się i daj mi zweryfikować.
4. **Commity logiczne.** Jeden commit = jedna koherentna zmiana. Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
5. **PR z opisem.** W każdym PR: co, dlaczego, jak testować, screenshots dla UI, link do iteracji w PRD.
6. **Jeśli coś łamie Principles lub ADR — zapytaj.** Nie ignoruj. Lepiej zatrzymać się i dogadać.
7. **Nie zgaduj w sprawach biznesowych.** Jeśli PRD nie jest jasny — pytasz.
8. **Po polsku w kodzie (UI copy), po angielsku w nazwach zmiennych/funkcji.** Commity i komentarze w kodzie — angielski.

## Konwencje nazewnicze

- Pliki TS: `camelCase.ts` dla modułów, `PascalCase.tsx` dla komponentów React.
- Funkcje: `camelCase`, czasownik pierwszy (`calculateBMR`, `generatePlan`).
- Typy/interfejsy: `PascalCase`, bez prefiksu `I`.
- Enum/const: `UPPER_SNAKE_CASE` dla stałych, `PascalCase` dla enumów TS.
- Tabele Postgres: `snake_case`, liczba mnoga (`user_profile_facts`, `workout_logs`).
- Kolumny: `snake_case`.
- React komponenty: `PascalCase` w nazwach plików i eksportach.

## Komendy projektowe

```bash
# Setup
pnpm install

# Development
pnpm dev                    # Uruchamia web (3000) + api (3001)
pnpm dev --filter web       # Tylko web
pnpm dev --filter api       # Tylko api

# Supabase
pnpm supabase:start         # Lokalny Supabase (docker)
pnpm supabase:migrate       # Run migracje
pnpm supabase:reset         # Reset db + seedy
pnpm supabase:gen-types     # Generuj types z DB → packages/core/types/db.ts

# Testy
pnpm test                   # Vitest wszystko
pnpm test:unit              # Tylko unit
pnpm test:integration       # Tylko integration (wymaga Supabase local)
pnpm e2e                    # Playwright

# Jakość
pnpm lint
pnpm typecheck
pnpm format                 # Prettier

# Build
pnpm build
pnpm build --filter web
```

## Rzeczy, których NIE rób bez pytania

- Nie instaluj nowych zależności bez uzasadnienia. Sprawdź, czy nie masz już czegoś co to robi.
- Nie zmieniaj schematu bazy (DBML) bez dyskusji. Schemat jest decyzyjny, nie emergentny.
- Nie dodawaj feature flags "na wszelki wypadek". Flagi tylko gdy realnie potrzebne.
- Nie pomijaj RLS, "bo to tylko test".
- Nie commituj secretów. Używaj `.env.local` i `.env.example`.
- Nie robirefaktoringu "przy okazji". Osobny PR, osobna dyskusja.
- Nie używaj `localStorage` dla wrażliwych danych (tokenów, profilu). Tylko Supabase session.
- Nie mieszaj angielskiego i polskiego w UI copy. Polski konsekwentnie.

## Gdy coś nie działa

- **Supabase lokalne nie startuje:** `docker ps` → sprawdź czy nie ma kolizji portów. `supabase stop && supabase start`.
- **Typy DB się rozjechały:** `pnpm supabase:gen-types` po każdej migracji.
- **LLM zwraca dziwne rzeczy:** sprawdź `prompts` w bazie, wersję promptu w wywołaniu, i zvalidowany schema.
- **Koszty LLM skoczyły:** `SELECT SUM(cost_usd) FROM llm_calls WHERE created_at > now() - interval '1 day'`.

## Domeny vs biznes

**LLM dostaje:** profile summary + relevantne preferencje + ostatnie logi/check-iny.
**LLM nie dostaje:** haseł, emaili, IP, danych innych userów.
**LLM nigdy nie zwraca:** diagnoz, dawek leków, porad medycznych, stwierdzeń kategorycznych o zdrowiu.

## Bieżący stan (aktualizuj po każdej iteracji)

- **Ostatnia ukończona iteracja:** Brak (przed Iteracją 0)
- **Aktywne migracje:** —
- **Otwarte feature flags:** —
- **Znane bugi w produkcji:** —

---

*Wersja: 1.0 — 2026-04-15*
*Aktualizuj po każdej iteracji (sekcja "Bieżący stan").*
