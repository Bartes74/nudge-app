# ADR-001: Stack technologiczny

- **Status:** Accepted
- **Data:** 2026-04-15
- **Decydent:** Bartek
- **Kontekst:** Nudge App — MVP v1

## Kontekst i problem

Nudge to adaptacyjny coach AI (trening + dieta + zdjęcia posiłków). Produkt musi:

- działać online jako PWA od razu,
- docelowo trafić na iOS i Android,
- obsługiwać wejście obrazowe (zdjęcia posiłków) z akceptowalnymi kosztami,
- mieć spójną logikę biznesową współdzieloną między web i natywne,
- być utrzymywalny przez mały zespół (w skrajnym przypadku jednoosobowy).

Trzeba zdecydować o stacku i wzorcu współdzielenia kodu, zanim zaczniemy cokolwiek kodować, bo zła decyzja tutaj kosztuje przepisanie połowy aplikacji przy migracji PWA → natywne.

## Rozważane opcje

### Opcja A — React Native + Expo od razu, bez webu
- **Za:** jeden codebase dla iOS/Android, spójne UI.
- **Przeciw:** wolniejsza iteracja na wczesnym etapie, brak łatwego „wejdź z linku w przeglądarce”, trudniejsze demo dla testerów, App Store review jako dodatkowe tarcie.

### Opcja B — Flutter
- **Za:** świetne natywne performance, jeden codebase.
- **Przeciw:** odcięty od ekosystemu TypeScript i AI SDK (OpenAI, Anthropic, Vercel AI SDK są JS-first), znacznie mniejsza społeczność dla części AI, bariera wejścia dla ewentualnych kontraktorów.

### Opcja C — Next.js PWA teraz, Expo później, współdzielony `@nudge/core` ✅
- **Za:** szybka iteracja na webie (3× szybciej niż natywne), łatwe testy z userami przez link, pełny ekosystem AI SDK, współdzielona logika domeny, możliwość migracji bez przepisywania core.
- **Przeciw:** dwa środowiska UI do utrzymania w fazie 2, PWA na iOS ma ograniczenia (push, kamera działa inaczej niż natywna).

### Opcja D — Firebase + Flutter/RN
- **Za:** szybki start, gotowe Auth i Storage.
- **Przeciw:** słabszy model uprawnień niż RLS Supabase, lock-in Google, Firestore źle pasuje do modelu danych z events i wersjonowaniem planów.

## Decyzja

Wybieramy **Opcję C: Next.js PWA jako faza 1, Expo jako faza 2, wspólny pakiet `@nudge/core` w monorepo**.

### Stack faza 1 (PWA — pierwsze 3-6 miesięcy)

- **Frontend:** Next.js 14 (App Router) + Tailwind + shadcn/ui
- **PWA:** `next-pwa` lub ręczny service worker; manifest + offline shell
- **Auth i baza:** Supabase (Postgres + Auth + Storage + Row Level Security)
- **Backend logiki AI:** osobny serwis Node.js/TypeScript (Fastify lub Hono), hostowany na Fly.io
- **Proste backend-side handlery:** Supabase Edge Functions (Deno) — dla auth hooks, walidacji, webhooków płatności
- **LLM:** OpenAI API (GPT-4o-mini do rozmowy, GPT-4o do Vision + structured outputs) z warstwą abstrakcji `llmClient` pozwalającą na zmianę dostawcy
- **Kolejka zadań:** Inngest lub Supabase Queues (zdjęcia posiłków, tygodniowe podsumowania, proaktywne bąbelki coacha)
- **Płatności:** Stripe (web) + RevenueCat (natywne w fazie 2, żeby ogarnąć App Store / Play)
- **Observability:** Sentry (errors) + PostHog (events, feature flags, produktowe metryki)
- **Monorepo:** Turborepo + pnpm workspaces

### Stack faza 2 (natywne, gdy PWA udowodni tezę)

- **Mobile:** Expo (managed workflow) + Expo Router + EAS Build
- **Zdjęcia:** `expo-camera` + `expo-image-manipulator` (kompresja PRZED wysyłką → oszczędność ~70% kosztów Vision API)
- **Push:** Expo Notifications
- **Współdzielenie:** logika z `@nudge/core`, komponenty UI — na razie duplikowane, Solito rozważymy dopiero przy 3. ekranie powtórzeń

### Struktura monorepo

```
apps/
  web/              # Next.js PWA
  mobile/           # Expo (faza 2)
  api/              # Node.js backend dla orkiestracji AI
packages/
  core/             # @nudge/core: typy, reguły, kalkulatory, prompty
    domain/         # Profile, Plan, Meal, CheckIn (typy + walidacje)
    rules/          # BMR, TDEE, progresja, guardrails
    prompts/        # Wersjonowane prompty + schemas JSON
    llm/            # Klient LLM z abstrakcją dostawcy
  ui/               # Wspólne komponenty (later)
  config/           # ESLint, TS, Tailwind presets
```

### Zasada krytyczna

**Cała logika domeny siedzi w `packages/core`.** `apps/web` i `apps/mobile` to tylko warstwa prezentacji + wywołania do `api` lub Supabase. Nigdy nie duplikujemy kalkulatora BMR w komponencie React.

## Konsekwencje

### Pozytywne
- Szybkie MVP w 8-12 tygodni jednej osoby + kontraktorzy designu
- Łatwe testy na userach bez App Store review
- Pełne wykorzystanie ekosystemu TypeScript/AI SDK
- Migracja do natywnego nie wymaga przepisywania core'a
- RLS Supabase daje prawdziwy model uprawnień per-user

### Negatywne / koszty
- Dwa środowiska UI w fazie 2 (web + mobile). Akceptujemy, bo retencja i konwersja w natywnym są na tyle lepsze, że warto.
- PWA na iOS ma ograniczenia (push ograniczony, kamera działa przez web API, brak prawdziwego background processing). To nas pcha do natywnego szybciej, niż byśmy chcieli — ale nie w fazie 1.
- Monorepo wymaga dyscypliny w granicach pakietów. Bez niej `core` zostanie zaśmiecony rzeczami z UI.

### Ryzyka i mitigacja
- **Ryzyko:** koszty LLM wybuchają. **Mitigacja:** kompresja zdjęć przed wysyłką, cache odpowiedzi dla powtarzalnych pytań, rate limiting per-user, monitoring kosztu w PostHog od dnia 1.
- **Ryzyko:** Supabase ma limity na darmowym tierze. **Mitigacja:** od razu płatny tier od ~500 aktywnych userów; partycjonowanie tabel eventowych (`ai_decisions`, `meal_logs`) zaplanowane od początku.
- **Ryzyko:** migracja web → natywne okaże się cięższa, niż zakładamy. **Mitigacja:** trzymamy `core` w czystości; jeśli zaczniemy pisać logikę w komponentach, stop i refaktor.

## Decyzje do rewizji później

- Wybór między Inngest a Supabase Queues — zdecydujemy po pierwszym prototypie kolejki zdjęć
- Solito (współdzielenie komponentów) — dopiero gdy będziemy mieć 3+ ekrany do duplikowania
- Wybór hostingu dla `apps/api` (Fly.io vs Railway vs Render) — Fly.io domyślnie, ale nie blokujemy
