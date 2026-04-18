# Nudge — PRD v1 (PWA, full scope)

- **Wersja:** 1.1
- **Data:** 2026-04-18
- **Autor:** Bartek + Claude (sparring)
- **Status:** Draft do rewizji
- **Zakres:** pełne PWA, wszystkie funkcje. Natywne iOS/Android w kolejnej iteracji produktu (poza tym PRD).
- **Zespół:** 1 osoba (Bartek) + Claude Code / Codex / Gemini Pro jako pomoc kodowa.

## Jak czytać ten dokument

Dokument ma dwa "poziomy czytania":
1. **Produktowy** — sekcje Problem, Cele, Non-goals, User stories, Metryki, Iteracje (zakres produktowy). To jest „co budujemy i po co".
2. **Wykonawczy** — w każdej iteracji sekcja **Brief dla AI** z konkretnym promptem / instrukcją do wklejenia do Claude Code, Codex lub Gemini Pro. To jest „jak to zakodujemy".

Powiązane artefakty:
- [ADR-001..004](../ADR/) — decyzje architektoniczne
- [Product Principles](../Principles/nudge_product_principles.md) — zasady produktu
- [Schema DBML](../Schema/nudge_schema.dbml) + [Dokumentacja schematu](../Schema/nudge_schema_documentation.md)

Każda iteracja jest **samodzielnie testowalna** i buduje użyteczną zdolność — nie żadne „placeholderów i stubów". Zasada: **po każdej iteracji da się pokazać aplikację testerowi i powiedzieć: „zrób to".**

---

## 1. Problem statement

Dorośli, którzy chcą zadbać o formę, trafiają na jedną z dwóch barier. Albo dostają plan dla osoby z mocnym backgroundem (RIR, objętość, split) — za skomplikowany, porzucają w 2 tygodnie. Albo dostają generyczny „6-tygodniowy plan na brzuch" bez rozumienia ich ciała, celu i życia — po 2 miesiącach stagnacja i frustracja.

Rynek apek fitness zakłada, że user wie, czego chce i umie zmierzyć porcję. W rzeczywistości większość potencjalnych userów nie umie nazwać ćwiczeń, nie zna RIR, nie ma wagi kuchennej i nie odróżnia kalorii od makro. **Nudge celuje dokładnie w tę grupę** — daje praktyczny coaching, który działa na niepełnych danych, dopytuje inteligentnie i stopniowo zwiększa precyzję.

Koszt nie rozwiązania: odpływ userów w pierwszych 14 dniach, niski LTV, powtarzalny cykl „dołączam → odpuszczam" dla milionów ludzi.

## 2. Cele (outcomes)

1. **Time to First Plan < 5 minut** — od zainstalowania PWA do pierwszego pełnego planu treningowego dopasowanego do profilu.
2. **Retencja D30 ≥ 35%** — user aktywny po 30 dniach (mierzona zalogowanym się + co najmniej jednym log/check-in).
3. **Trial→Paid conversion ≥ 15%** — z 7-dniowego trialu bez karty.
4. **Koszt na aktywnego usera ≤ $2.50/mc** — LLM + hosting łącznie; marżowo sensowne przy cenie 49 PLN/mc.
5. **0 incydentów bezpieczeństwa** związanych z guardrails (nieletni / ED risk / ciąża / ostry ból niebezpiecznie obsłużone) w pierwszych 6 miesiącach.

## 3. Non-goals

1. **Nie robimy natywnych aplikacji w tym PRD.** PWA jest pełnoprawnym produktem; natywne iOS/Android to osobny projekt po walidacji tezy.
2. **Nie robimy social features** (follow, feed, challenges, leaderboards). Retencja Nudge ma opierać się na jakości coachingu, nie na porównywaniu się z innymi.
3. **Nie wchodzimy w treningi kardio-centric** (bieganie, kolarstwo, triathlon). Fokus: siłownia/dom. Cardio jest jako dodatek, nie główna oferta.
4. **Nie budujemy własnego treningu z personal trenerem-człowiekiem** w v1. Osobna usługa premium — rozważamy po 6 miesiącach.
5. **Nie liczymy kalorii z „aptekarską dokładnością".** Zdjęcia → zakresy szacunkowe zgodnie z Principles §13.
6. **Nie obsługujemy zaburzeń odżywiania klinicznych, ciąży, osób <18.** Guardrails blokują i kierują do specjalisty.

## 4. User personas (segmenty priorytetowe)

Z ADR-003: 8 segmentów aktywnych, ale 3 najważniejsze dla persony v1:

- **Ania, 34, `beginner_zero × general_health × female`** — po drugim dziecku, nie ćwiczyła regularnie od lat, chce „po prostu się ruszać i czuć lepiej". Ma w domu lekkie hantle. Potrzebuje prostych instrukcji krok po kroku i spokojnego wejścia.
- **Kuba, 28, `beginner × muscle_building × male`** — chodzi od pół roku na siłownię z kolegą, który powiedział mu „rób 3x10". Chce „coś więcej wyciągnąć z czasu tam spędzonego".
- **Marta, 42, `intermediate × weight_loss × female × parent_young_kids`** — pracująca, dwójka dzieci, trenuje w domu 3 razy w tygodniu od 2 lat. Zgubiła motywację bo „nic się nie dzieje".

Pozostałe 5 segmentów obsługujemy tym samym silnikiem, ale content/UX optymalizujemy najpierw pod te trzy.

### Aktualizacja 2026-04-18 — osobna ścieżka `beginner_zero`

`beginner_zero` nie jest wariantem zwykłego planu siłowego. To osobna ścieżka wejścia do produktu:

- neutralny onboarding L1: wiek, wzrost, masa, cel, realna liczba treningów, miejsce ćwiczeń, ostatnia regularna aktywność, przeciwwskazania/ból/leki, typ pracy i bezpieczna samoocena poziomu,
- automatyczna kwalifikacja do `entry_path='guided_beginner'` na bazie historii ruchu, wieku, BMI i safety screeningu,
- trzy fazy: `phase_0_familiarization`, `phase_1_adaptation`, `phase_2_foundations`,
- osobny generator planu, który zwraca trening prowadzony krok po kroku zamiast samej listy ćwiczeń,
- domyślny interfejs `Today Guided Workout` oraz mini check-in po treningu skupiony na zrozumieniu, bezpieczeństwie i pewności siebie,
- warunkowa sugestia rozmowy z trenerem jako naturalny kolejny krok, a nie pytanie wejściowe.

## 5. User stories — high level

Podzielone na 5 obszarów. Szczegółowe akceptacje w każdej iteracji niżej.

### Onboarding i profil
- Jako nowy user chcę w < 5 min dostać pierwszy plan treningowy na bazie podstawowych danych, żeby od razu zobaczyć wartość.
- Jako user chcę, żeby aplikacja prosiła o dodatkowe dane tylko wtedy, gdy to ma sens — z wyjaśnieniem dlaczego pyta.
- Jako user chcę edytować swój profil w każdej chwili, ale nie muszę — aplikacja i tak działa.
- Jako user `beginner_zero` chcę, żeby pierwszy onboarding nie zawstydzał mnie i nie wymagał znajomości ćwiczeń ani sprzętu.

### Plan treningowy
- Jako user chcę zobaczyć „co mam dziś zrobić na treningu", od razu po otwarciu aplikacji.
- Jako user `beginner_zero` chcę zobaczyć przede wszystkim dzisiejszy prosty krok, a nie pełną tabelę tygodnia.
- Jako user chcę szybko wymienić ćwiczenie, jeśli nie mogę go zrobić (brak sprzętu, ból, nuda).
- Jako user chcę widzieć, czy moja siła rośnie.

### Jedzenie
- Jako user chcę zrobić zdjęcie posiłku i dostać sensowne oszacowanie, bez ważenia.
- Jako user chcę widzieć dzienne podsumowanie bez obsesyjnego liczenia.
- Jako user, jeśli chcę, mogę dokładnie zalogować posiłek ręcznie.

### Coaching i check-in
- Jako user chcę zapytać coacha o konkrety („mogę masło orzechowe?", „jak zrobić martwy ciąg?", „alternatywa dla ławki").
- Jako user chcę raz w tygodniu zrobić krótki check-in i dostać konkretną rekomendację.
- Jako user `beginner_zero` chcę po każdym treningu krótki check-in o tym, czy wiedziałem/am co robić i czy czułem/am się bezpiecznie.
- Jako user chcę dostawać proaktywne wiadomości tylko gdy coś się zmienia (nie spam).

### Bezpieczeństwo i zdrowie
- Jako user z bólem pleców chcę, żeby aplikacja nie kazała mi robić martwego ciągu.
- Jako user początkujący chcę, żeby aplikacja nie wrzucała mnie od razu w technicznie złożone ćwiczenia i nie zasypywała żargonem.
- Jako user z sygnałem ED/zaburzeń odżywiania chcę zostać przekierowany do specjalisty, a nie dostać kolejną dietę.
- Jako user nastolatek lub w ciąży chcę jasną informację, że to nie jest apka dla mnie.

## 6. Wymagania przekrojowe (dotyczą każdej iteracji)

### Product Principles
Każda funkcja musi być zgodna z [Product Principles](../Principles/nudge_product_principles.md). Jeśli feature łamie principle — nie buduje się go bez ADR superseding.

### Ultra-intuicyjny UX
- Każda prośba o dane: krótkie „po co pytamy" + krótkie „jak to łatwo zmierzyć".
- Maksymalnie 1 pytanie kontekstowe per sesja (poza onboardingiem warstwy 1).
- Żadnych formularzy 20+ pól dla usera. Dane zbierane kontekstowo.
- „Złożoność ukryta, prostota na wierzchu" — filozofia Apple.

### Observability od pierwszej linii
- Każda funkcja: PostHog event przy głównej akcji (pole widoczne w schema `product_events`).
- Każde wywołanie LLM: wpis do `llm_calls` z kosztem.
- Każda decyzja reguł: wpis do `ai_decisions`.
- Sentry wire-up od pierwszej iteracji.

### Guardrails zawsze aktywne
Z ADR-002. Żadna iteracja nie ignoruje guardrails. Jeśli feature dotyka zdrowia, warstwa guardrails musi być dołączona.

### Testowalność
Każda iteracja musi się dać pokazać testerowi i wygenerować feedback. Jeśli nie da się nic pokazać, podział jest zły.

## 7. Sukces — metryki i targety

### Leading indicators (patrzymy tygodniowo)
- **Onboarding completion rate** — % userów, którzy przeszli warstwę 1. Target ≥ 80%.
- **Time to First Plan** — mediana czasu instalacja → plan. Target < 5 min.
- **Trial start rate** — % odwiedzających, którzy zaczęli trial. Target ≥ 40%.
- **Day-7 activation** — % userów w trialu, którzy wrócili w dniu 7. Target ≥ 50%.
- **Meal photo success rate** — % zdjęć posiłków z confidence ≥ 0.6. Target ≥ 70%.
- **Guardrail false positive rate** — % wyzwoleń guardrails, które user oflagował jako niesłuszne. Target ≤ 10%.

### Lagging indicators (patrzymy miesięcznie)
- **Retencja D30** — target ≥ 35%.
- **Trial→Paid conversion** — target ≥ 15%, stretch 20%.
- **Monthly churn** — target < 7%.
- **Yearly renewal rate** — target > 60% w pierwszym roku (mierzone od miesiąca 12).
- **NPS** — target ≥ 40 po 3 miesiącach.
- **Cost per active user** — alert > $3/mc.

Wszystkie metryki mają swoje queries w `product_events` i są widoczne w dashboardzie PostHog + własnym dashboardzie SQL.

## 8. Założenia i zależności

- Supabase działa (uptime ≥ 99.9%); mamy płatny tier od dnia 1.
- OpenAI API stabilne; mamy abstrakcję pod backup (Anthropic, Google).
- Stripe obsługuje rynek polski (TAK, od lat).
- Design system na shadcn/ui wystarczy na v1 (weryfikujemy w Iteracji 1).
- Katalog ~150 ćwiczeń do seedowania — robimy ręcznie (Bartek + trener).
- Przed publicznym launchem: review guardrails z dietetykiem klinicznym + fizjoterapeutą.

---

## 9. Iteracje budowy

**10 iteracji + Iteracja 0 (setup).** Każda niezależnie testowalna. Każda kończy się:
- deployem na production URL (nudge.app lub subdomena),
- demo do pokazania testerowi,
- checklistą „co powinno działać",
- update'em metryk w PostHog.

Legenda:
- **Cel iteracji** — co użytkownik zyskuje po tej iteracji.
- **Zakres produktowy** — user stories + wymagania funkcjonalne.
- **Wymagania techniczne** — tabele, endpointy, promptowe zmiany, integracje.
- **Kryteria akceptacji** — lista testowalnych rzeczy.
- **Zależności** — co musi być gotowe wcześniej.
- **Brief dla AI** — konkretny prompt do wklejenia do Claude Code / Codex / Gemini.

---

### Iteracja 0 — Fundament projektu

**Cel:** projekt da się uruchomić, zadeployować, zalogować testowym kontem. „Hello Nudge" na produkcyjnym URL z auth.

#### Zakres produktowy
- Monorepo Turborepo (apps/web, apps/api, packages/core, packages/ui, packages/config).
- Next.js 14 z App Router + Tailwind + shadcn/ui (apps/web).
- Supabase projekt (auth, postgres, storage).
- Node.js/Fastify backend (apps/api) — placeholder health endpoint.
- Deploy: web → Vercel, api → Fly.io, supabase jako managed.
- CI/CD: GitHub Actions — lint, typecheck, test, deploy.
- Sentry + PostHog wire-up (puste projekty, SDK podłączony).
- PWA manifest + service worker (Next-PWA).
- ESLint, Prettier, Husky, commitlint.

#### Wymagania techniczne
- `.env` schema z walidacją (zod).
- Typy wspólne w `packages/core`.
- Dockerfile dla `apps/api`.
- Migracje Supabase w `supabase/migrations/` (empty na start, ale framework gotowy).

#### Kryteria akceptacji
- [ ] `pnpm install && pnpm dev` uruchamia web na :3000 i api na :3001.
- [ ] Produkcyjny URL działa: https://nudge-web.vercel.app lub podobny.
- [ ] Migrations CLI działa: `pnpm supabase:migrate`.
- [ ] Sentry łapie celowo wywołany błąd.
- [ ] PostHog łapie event `app_loaded`.
- [ ] PWA instaluje się na iOS Safari i Chrome Android.

#### Zależności
Brak.

#### Brief dla AI
```
ROLA: Jesteś senior full-stack engineerem. Budujesz monorepo dla aplikacji Nudge.

KONTEKST:
- Stack: Next.js 14 (App Router) + Supabase + Node.js/Fastify backend + Turborepo + pnpm.
- Przeczytaj: ADR-001 (stack), Schema README, Product Principles.
- Deploy: Vercel (web), Fly.io (api), Supabase managed.

ZADANIE:
1. Zainicjuj monorepo Turborepo z pnpm workspaces.
2. Utwórz apps/web (Next.js 14 + Tailwind + shadcn/ui + Next-PWA).
3. Utwórz apps/api (Fastify + TypeScript + zod).
4. Utwórz packages/core, packages/ui, packages/config.
5. Skonfiguruj Supabase CLI z pustą bazą i migrations folder.
6. Skonfiguruj GitHub Actions: lint, typecheck, test, deploy preview.
7. Wire-up Sentry (web + api) i PostHog (web).
8. Skonfiguruj PWA manifest (name: Nudge, theme: neutral, offline shell).
9. ESLint + Prettier + Husky + commitlint (conventional commits).

OGRANICZENIA:
- Żadnych mock-ów ani TODO. Musi działać end-to-end.
- Wszystkie zmienne środowiskowe walidowane przez zod w runtime.
- Typescript strict mode.
- No `any` w kodzie produkcyjnym.

DELIVERABLES:
- Działający monorepo, commit initial.
- README.md w głównym folderze z instrukcjami setup.
- Produkcyjny URL (web + api health endpoint).

PRZED ZROBIENIEM PR: sprawdź checklistę akceptacji wyżej.
```

---

### Iteracja 1 — Auth, shell aplikacji, PWA

**Cel:** user się rejestruje, loguje, widzi pustą aplikację z nawigacją. Da się zainstalować jako PWA na telefonie.

#### Zakres produktowy
**User stories:**
- Jako nowy user chcę zarejestrować się emailem + hasłem lub Google/Apple, żeby nie robić osobnego konta.
- Jako user chcę zainstalować aplikację na telefonie jak natywną, żeby wracać do niej łatwo.
- Jako user chcę zobaczyć spójną nawigację aplikacji od razu po zalogowaniu.

**Funkcje:**
- Sign up / sign in: email+hasło, magic link, Google OAuth, Apple OAuth.
- Reset hasła.
- Onboarding splash (1 ekran) po pierwszym logowaniu — potem redirect do warstwy 1 onboardingu (Iteracja 2).
- App shell: bottom nav z 5 zakładkami (Dziś / Plan / Jedzenie / Postępy / Profil). Na początku 4 z nich to placeholdery.
- Trwały bąbelek coacha w prawym dolnym rogu (disabled — pokazuje „Wkrótce" po tapnięciu).
- Ustawienia konta: timezone, locale, logout.
- Dark mode + jasny (domyślnie system).

#### Wymagania techniczne
- Supabase Auth z providerami: email, Google, Apple.
- Tabele: `users` (mirror auth.users).
- RLS policies dla `users`: user widzi tylko swój rekord.
- Middleware Next.js: ochrona ścieżek `/app/*`.
- Design tokens: kolory, typografia, spacing (ustalamy tu na cały produkt).
- Komponenty bazowe z shadcn/ui: Button, Input, Card, Dialog, Toast, Avatar, NavBar.
- Error boundaries i fallback UI.
- Loading states dla async akcji.

#### Kryteria akceptacji
- [ ] Nowy user rejestruje się emailem w < 30s i widzi splash.
- [ ] Google OAuth działa.
- [ ] Apple OAuth działa (wymaga developer cert — można zasłonić jeśli blokada).
- [ ] Magic link działa.
- [ ] Reset hasła działa (email z linkiem).
- [ ] Po zalogowaniu widać 5 zakładek; 4 puste placeholders.
- [ ] Dark mode przełącza się z jasnego (user preference zapamiętany).
- [ ] PWA instaluje się na iOS Safari i Chrome Android.
- [ ] Offline shell pokazuje przyjazny komunikat „Brak połączenia".
- [ ] RLS: user A nie widzi danych usera B (test ręczny z dwoma kontami).

#### Zależności
Iteracja 0.

#### Brief dla AI
```
ROLA: Full-stack engineer. Dodajesz auth i shell do Nudge.

KONTEKST:
- Monorepo z Iteracji 0 już działa.
- Supabase Auth z email + Google + Apple.
- Design system: shadcn/ui + Tailwind.
- PWA z Next-PWA.
- Schema: tabela `users` (patrz /Schema/nudge_schema.dbml, grupa 1).

ZADANIE:
1. Skonfiguruj providerów Supabase Auth (email+hasło, magic link, Google, Apple).
2. Dodaj tabelę `users` z RLS policy (user widzi tylko swój rekord). Trigger: insert do `public.users` po każdej rejestracji w `auth.users`.
3. Zbuduj ekrany: /signin, /signup, /forgot-password, /verify.
4. Middleware Next.js: `/app/*` wymaga auth, redirect do /signin.
5. App shell: bottom nav (5 zakładek), top bar z avatarem (otwiera /profile).
6. Bubble coacha: komponent fixed w /app shell, stan disabled, tooltip „Wkrótce".
7. Strona /profile: ustawienia (timezone, locale, dark mode, logout, delete account).
8. Error boundary + Loading fallback.
9. Zainstaluj i skonfiguruj next-pwa.

WYMAGANIA UX (z Product Principles):
- Ciepły ton komunikacji.
- Ciemny mode i jasny: tokens w packages/config.
- Polski na start. i18n-ready (i18next) ale tylko jedna paczka lokalizacji.

TESTY:
- Unit: helpery auth (sesja, middleware).
- E2E (Playwright): happy path sign up → signin → see app shell.
- RLS test: user A nie czyta danych user B (pgTAP lub dedicated test).

DELIVERABLES:
- PR z opisem zmian.
- Zaktualizowane README.md z instrukcjami setup providerów OAuth.

PRZED ZROBIENIEM PR: checklist akceptacji.
```

---

### Iteracja 2 — Onboarding warstwy 1 + profil + segmentacja

**Cel:** user kończy onboarding w < 5 min i widzi zapisany profil z wyliczonym segmentem. Aplikacja „wie kim jest" — nawet jeśli jeszcze nic nie robi.

#### Zakres produktowy
**User stories:**
- Jako user chcę odpowiedzieć na minimum neutralnych pytań, żeby dostać plan.
- Jako user przy każdym pytaniu chcę widzieć dlaczego o to pytamy i jak łatwo to sprawdzić.
- Jako user `beginner_zero` nie chcę na starcie pytań zawstydzających ani wymagających wiedzy treningowej.
- Jako user chcę zobaczyć swój profil i móc go edytować.

**Funkcje:**
- Onboarding warstwy 1 (10 neutralnych pól):
  - Cel główny (weight_loss / muscle_building / strength_performance / general_health).
  - Wiek.
  - Wzrost, masa (orientacyjna OK).
  - Realna liczba treningów / tydzień.
  - Miejsce ćwiczeń.
  - Ostatnia regularna aktywność fizyczna.
  - Ograniczenia zdrowotne, ból, urazy, leki wpływające na wysiłek.
  - Typ pracy i poziom siedzenia w ciągu dnia.
  - Bezpieczna samoocena poziomu („dopiero zaczynam”, „wracam po przerwie”, „znam podstawy”, „ćwiczę regularnie”).
- Automatyczna kwalifikacja do `experience_level`, `entry_path`, `adaptation_phase`, `guided_mode`.
- Dla `beginner_zero` domyślny tone preset `calm_guided` i tryb żywieniowy `simple`.
- Każde pole z „po co" + „jak to zmierzyć" (tooltip lub inline pod labelem).
- Ekran podsumowania: „Oto co wiemy o Tobie. Przejdź do planu →”.
- Strona /profile z edycją każdego pola.
- Automatyczna klasyfikacja segmentu i ścieżki po onboardingu.

#### Wymagania techniczne
- Tabele: `user_profile`, `user_profile_facts`, `user_equipment`, `user_health`, `user_goals`, `user_segment_snapshots`, `field_explanations`, `question_library` (seed warstwy 1), `user_question_asks`, `product_events`.
- Migracje: wszystkie z grupy 2, 4, 5, 13, 16, 18 dla MVP warstwy 1.
- Kod w `packages/core`:
  - `calculateAgeBucket(birthDate)`
  - `classifySegment(profile): SegmentKey`
  - `generateFactsFromOnboarding(answers): Fact[]`
  - `qualifyEntryPath(input): { experienceLevel, entryPath, adaptationPhase, guidedMode, inferredBeginnerStatus }`
- Endpointy API:
  - `POST /api/onboarding/complete` — zapisuje facts, update profile, wylicza segment i zwraca `experience_level`, `entry_path`, `adaptation_phase`, `guided_mode`, `inferred_beginner_status`.
  - `GET /api/profile` — zwraca cały profil.
  - `PATCH /api/profile/field` — update single field (z zapisem w facts z nowym `observed_at`).
- Komponent React `<OnboardingWizard>` z progress bar.
- Komponent `<FieldWithExplanation>` reusable: label + why + how + input.
- Seed danych: neutralne wpisy w `field_explanations` (pl-PL), ~10 pytań w `question_library` (warstwa 1).

#### Kryteria akceptacji
- [ ] Nowy user przechodzi warstwę 1 w < 5 min (measure z Playwright).
- [ ] Każde pole ma widoczne „po co pytamy" i „jak zmierzyć".
- [ ] Po onboardingu `user_segment_snapshots` ma wpis z poprawnym `segment_key`.
- [ ] Po onboardingu response zawiera `entry_path`, `adaptation_phase` i `guided_mode`.
- [ ] Profil widoczny na /profile i edytowalny.
- [ ] Edycja pola tworzy nowy wpis w `user_profile_facts` (nie update).
- [ ] PostHog eventy: `onboarding_started`, `onboarding_field_answered`, `onboarding_completed`.
- [ ] RLS: user widzi tylko swoje facts.
- [ ] Test: 3 profile testowe dla 3 person (Ania, Kuba, Marta) — każdy daje właściwy segment.
- [ ] User bez regularnych treningów w ostatnich 12 miesiącach trafia do `beginner_zero` i `guided_beginner`.

#### Zależności
Iteracja 1.

#### Brief dla AI
```
ROLA: Full-stack engineer + UX-conscious. Budujesz onboarding warstwy 1 Nudge.

KONTEKST:
- Schema: /Schema/nudge_schema.dbml — grupy 2, 4, 5, 13, 16, 18.
- ADR-003: segmentacja dwuosiowa + flagi.
- Product Principles §12: każde pole ma „po co" i „jak zmierzyć".
- Dane persona: Ania (beginner_zero × general_health × female), Kuba (beginner × muscle_building × male), Marta (intermediate × weight_loss × female × parent).

ZADANIE:
1. Migracje: utwórz tabele z grup 2 (user_profile, user_profile_facts), 4 (user_equipment, user_health — pola tylko wymagane na warstwę 1), 5 (user_goals, user_segment_snapshots), 13 (question_library, user_question_asks), 16 (field_explanations), 18 (product_events). Wszystkie user-scoped z RLS.
2. Seed `question_library` z neutralnymi pytaniami warstwy 1 (cel, wiek, wzrost, masa, dni/tydzień, miejsce ćwiczeń, ostatnia regularna aktywność, ograniczenia, typ pracy, bezpieczna samoocena poziomu).
3. Seed `field_explanations` z 15 wpisami pl-PL (why_we_ask + how_to_measure per pole).
4. Kod w packages/core:
   - funkcja `classifySegment(profile)` → jeden z 8 segment_keys
   - funkcja `calculateAgeBucket(birthDate)`
   - funkcja `qualifyEntryPath(input)` → `experience_level`, `entry_path`, `adaptation_phase`, `guided_mode`
   - funkcja `generateFactsFromOnboarding(answers)` — generuje array facts z source='onboarding', confidence 0.9-1.0
5. API endpoints: POST /api/onboarding/complete, GET /api/profile, PATCH /api/profile/field.
6. Frontend:
   - /onboarding — wizard z progress bar (11 kroków), każdy krok z komponentem <FieldWithExplanation>.
   - /app/profile — strona profilu z grupami pól, każde z edit inline.
   - /onboarding/done — podsumowanie („Oto co wiemy...") z CTA do planu.
7. Guardrails warstwy 1: jeśli wiek < 18 → wyzwól flagę `underage` + ekran blokujący z kontaktem do specjalisty (z ADR-002). Ograniczenia zdrowotne i leki mają wymusić safety screening, ale nie zawstydzać usera.

WYMAGANIA UX:
- Jedno pytanie na ekran na mobile, max 3 na desktop.
- Progress bar z liczbą kroków.
- Animacje transition między krokami (framer-motion).
- Po każdym polu: zapis local (sessionStorage) żeby nie zgubić postępu.

TESTY:
- Unit: classifySegment z 10 test cases pokrywającymi wszystkie segmenty.
- E2E: 3 pełne ścieżki onboardingu (po jednej per persona), każda kończy się właściwym segmentem.
- Manual: 2 konta, user A nie widzi profilu B.

DELIVERABLES:
- PR z migracjami + seed + kod.
- Zaktualizowane /Schema/nudge_schema.dbml jeśli potrzebne zmiany.
- Storybook stories dla <FieldWithExplanation> i <OnboardingWizard>.
```

---

### Iteracja 3 — Silnik reguł, kalkulatory, guardrails v1

**Cel:** cała „matematyka" Nudge jest gotowa, pokryta testami i wywoływalna. Bez UI zmian — to jest warstwa wewnętrzna, ale testuje się ją unit testami i prostym sandbox UI dla Bartka.

#### Zakres produktowy
**User stories (dev-facing):**
- Jako engineer chcę jednej funkcji `calculateTDEE(profile)` i mieć pewność, że zwraca właściwe wartości.
- Jako engineer chcę mieć testy, które pokazują mi, że guardrail na niski kcal się wyzwala.

**Funkcje:**
- Kalkulatory: BMR (Mifflin-St Jeor), TDEE (z activity_level), macro distribution per cel, volume per segment, progression rules.
- Guardrails v1:
  - `low_calorie_intake` (< 1200 F, < 1500 M).
  - `rapid_weight_loss` (> 1% tygodniowo, 3+ tygodnie).
  - `underage`, `pregnancy` (samodeklaracja).
  - `bmi_extreme` (BMI < 16 lub > 40 — ostrzeżenie).
- Sandbox UI (internal only, za feature flag): `/dev/calculators` — wklep profil, zobacz obliczenia.

#### Wymagania techniczne
- `packages/core/rules/`:
  - `bmr.ts`, `tdee.ts`, `macros.ts`, `volume.ts`, `progression.ts`
  - `guardrails/index.ts` + file per flaga.
- `packages/core/types/`: `Profile`, `MacroTargets`, `VolumeTargets`, `GuardrailResult`.
- Tabele: `user_safety_flags` (z grupy 4).
- Funkcja `evaluateGuardrails(profile, context): GuardrailResult[]` wywoływana przed każdą generacją planu.
- Endpoint `POST /api/dev/calculate` — dla sandbox UI (tylko dev env, feature flag).

#### Kryteria akceptacji
- [ ] Unit tests (Vitest) pokrywają ≥ 90% kodu `packages/core/rules`.
- [ ] Każdy kalkulator ma 5+ test cases (kobieta/mężczyzna × wiek × cel).
- [ ] Każdy guardrail ma 3+ test cases (wyzwala się / nie wyzwala / edge).
- [ ] `evaluateGuardrails` zwraca właściwe flagi dla profili z dataset "red flags".
- [ ] Sandbox UI pokazuje wszystkie wyliczenia dla podanego profilu.
- [ ] CI failuje jeśli coverage < 90%.

#### Zależności
Iteracja 2 (mamy typy Profile).

#### Brief dla AI
```
ROLA: Senior backend engineer, ekspert od testów. Budujesz warstwę reguł Nudge.

KONTEKST:
- Product Principles §11: LLM nie liczy, reguły liczą.
- ADR-002: guardrails jako osobna warstwa, każda rekomendacja przechodzi przez evaluateGuardrails.
- Wzory: BMR Mifflin-St Jeor; TDEE = BMR × activity_factor; makro per cel (redukcja: 2g białka/kg, 25% tłuszczy, reszta węgle).
- Typy profilu z Iteracji 2.

ZADANIE:
1. Utwórz packages/core/rules/:
   - bmr.ts: calculateBMR(profile) - Mifflin-St Jeor
   - tdee.ts: calculateTDEE(profile) - BMR × activity_factor
   - macros.ts: calculateMacroTargets(profile, deficit_pct): MacroTargets
   - volume.ts: recommendedVolume(profile): VolumeTargets per grupa mięśniowa, per segment
   - progression.ts: shouldProgress(lastNSessions, exercise) → { action: 'weight' | 'reps' | 'deload' | 'hold' }
2. Utwórz packages/core/rules/guardrails/:
   - low_calorie_intake.ts, rapid_weight_loss.ts, underage.ts, pregnancy.ts, bmi_extreme.ts
   - index.ts: evaluateGuardrails(profile, context): GuardrailResult[]
3. Tabela user_safety_flags z migracją. Funkcja `persistFlags(userId, flags)`.
4. Sandbox UI /dev/calculators (za feature flag NEXT_PUBLIC_DEV_MODE):
   - form dla profilu
   - wyświetla wyniki wszystkich kalkulatorów + listę wyzwolonych guardrails
5. Testy: Vitest z coverage ≥ 90%. Fixtures dla profili (Ania, Kuba, Marta + red flag profiles).

WAŻNE:
- ŻADEN kalkulator nie wywołuje LLM.
- Każda funkcja jest pure (tylko profile in, wartość out).
- Typy strict, żadnych any.

TESTY:
- BMR: 5 test cases (różne wieki/płcie/wagi).
- TDEE: 4 test cases (sedentary → very_active).
- Macros: 3 test cases (weight_loss / muscle_building / general_health).
- Volume: jeden test case per segment (8).
- Progression: 5 test cases (wzrost/stagnacja/spadek/deload/reset).
- Guardrails: 3 test cases per guardrail (2 positive, 1 negative).
- evaluateGuardrails: profil Ani bez flag, profil z bmi=15 zwraca bmi_extreme, profil nieletni zwraca underage.

DELIVERABLES:
- PR z kodem + testami + sandbox UI.
- Dokumentacja wzorów w packages/core/rules/README.md.
- Coverage report widoczny w PR.
```

---

### Iteracja 4 — Plan treningowy: generacja, rendering, zmiana

**Cel:** user po onboardingu dostaje pierwszy plan treningowy. Widzi dzisiejszy trening, listę tygodnia, rozpiskę ćwiczeń. Może wymienić ćwiczenie.

#### Zakres produktowy
**User stories:**
- Jako user po onboardingu chcę dostać plan w < 30s.
- Jako user chcę zobaczyć plan na cały tydzień i dzisiejszy trening z jednego kliknięcia.
- Jako user chcę zobaczyć każde ćwiczenie z czytelnym opisem (nie akronimami).
- Jako user chcę wymienić ćwiczenie jeśli nie mam sprzętu albo nie chcę.
- Jako user chcę zobaczyć wideo lub ilustrację techniki.

**Funkcje:**
- Katalog ćwiczeń (seed ~150) z technique_notes, muscle groups, equipment.
- Generator planu — reguły wybierają szablon (split/FBW/upper-lower) + LLM wypełnia konkretnymi ćwiczeniami z katalogu.
- Dla `beginner_zero` osobny generator guided path z fazami `phase_0_familiarization`, `phase_1_adaptation`, `phase_2_foundations`.
- Wersjonowanie planu (training_plan_versions).
- Widok „Dziś" na zakładce /app/today.
- Dla `beginner_zero` widok `Today Guided Workout` jako domyślny.
- Widok „Plan tygodnia" na zakładce /app/plan pozostaje główny dla standardowych ścieżek.
- Ekran szczegółu ćwiczenia: zdjęcie/wideo, 3-5 punktów techniki, zamienniki (klik → zamiana w planie).
- Copy-language dopasowany do tonu segmentu.

#### Wymagania techniczne
- Tabele: `exercises`, `training_plans`, `training_plan_versions`, `plan_workouts`, `plan_exercises`, `plan_workout_steps`, `ai_tasks`, `llm_calls`, `prompts`.
- Seed: 150 ćwiczeń (Bartek + trener w osobnej sesji).
- `packages/core/planners/training/`:
  - `selectTemplate(profile): PlanTemplate` — deterministycznie (reguły).
  - `fillTemplate(template, profile, catalog): PlanVersion` — LLM z structured output (schema: lista ćwiczeń z plan_exercises).
  - `generateGuidedBeginnerPlan(profile, catalog): GuidedPlanVersion` — deterministyczny generator guided path.
  - `substituteExercise(planVersion, exerciseSlug, reason): PlanVersion` — reguły + LLM dla lepszego copy.
- Prompty `training_plan_fill` i `guided_beginner_plan_fill` w tabeli `prompts`.
- Endpoint `POST /api/plan/training/generate` (async via ai_tasks queue).
- Endpoint `POST /api/plan/training/substitute`.
- UI: ekran `/app/today`, `/app/plan`, `/app/plan/exercise/:slug`.
- Inngest job: `generate_training_plan` worker.

#### Kryteria akceptacji
- [ ] Nowy user z Iteracji 2 + onboarding → plan wygenerowany w < 30s.
- [ ] Plan ma 2-6 treningów per tydzień w zależności od `days_per_week` i ścieżki wejścia.
- [ ] Każdy trening ma 4-7 ćwiczeń z katalogu (żadne halucynacje).
- [ ] Dla `beginner_zero` generator zwraca kroki `arrival_prep`, `warmup`, `main_block`, `cooldown`, `post_workout_summary`.
- [ ] Rozpiska zawiera: nazwę, serie, zakres reps, RIR, przerwa, zamiennik.
- [ ] Dla `beginner_zero` w podstawowym UI nie pokazujemy RIR/RPE/objętości jako głównego języka.
- [ ] Technique_notes są ludzkie, nie akronimy (test dla segmentu `beginner_zero` / `beginner`).
- [ ] Zamiana ćwiczenia działa w < 5s i zapisuje nową wersję planu.
- [ ] Historia wersji widoczna na /app/plan/history.
- [ ] Guardrails blokują generację dla `bmi_extreme` lub `injury_reported` z severity=critical.
- [ ] Każda generacja → wpis w `llm_calls` z cost.
- [ ] Każda zmiana planu → wpis w `ai_decisions` z rationale.
- [ ] 3 persony dają 3 wyraźnie różne plany (manual review).

#### Zależności
Iteracja 3 (guardrails, kalkulatory).

#### Brief dla AI
```
ROLA: Senior full-stack + AI engineer. Budujesz generator planów treningowych Nudge.

KONTEKST:
- Schema: grupy 6, 7, 15 w /Schema/nudge_schema.dbml.
- ADR-002: LLM z structured outputs, reguły robią strukturę, LLM dobiera treść.
- Product Principles §7: plan zawiera podział tygodnia, ćwiczenia, serie, reps, RIR, przerwy, progresję, zamienniki.
- Segmenty (ADR-003): per segment szablon różny.

ZADANIE:
1. Katalog ćwiczeń: migracja `exercises`, seed skrypt do uruchomienia z CSV/JSON 150 ćwiczeń. Jeśli brak danych seed — stwórz placeholder strukturę i wygeneruj mock z ~20 dla testów.
2. Migracje: training_plans, training_plan_versions, plan_workouts, plan_exercises (grupa 7), ai_tasks, llm_calls, prompts (grupa 15).
3. packages/core/planners/training/:
   - templates/fbw.ts, upper_lower.ts, ppl.ts, split.ts (każdy zwraca deterministyczną strukturę tygodnia)
   - selectTemplate(profile) — reguła decyzyjna
   - fillTemplate(template, profile, catalog) — LLM call z JSON Schema output zgodnym z plan_exercises
   - substituteExercise(planVersion, slug, reason)
4. Dodaj prompt `training_plan_fill` do tabeli prompts (wersja 1). System prompt z Product Principles §5, §7. User prompt zawiera: profile summary, template structure, available exercises from catalog.
5. Kolejka: Inngest `generate_training_plan` job.
6. API:
   - POST /api/plan/training/generate (enqueue task, zwróć task_id)
   - GET /api/ai-tasks/:id (status + wynik — generyczne dla wszystkich ai_tasks)
   - POST /api/plan/training/substitute
   - GET /api/plan/training/current
   - GET /api/plan/training/versions
7. UI:
   - /app/today — karta „Dziś" z treningiem, przycisk „Zacznij trening" (prowadzi do Iteracji 5).
   - /app/plan — lista tygodnia z dniami treningowymi, tap → /app/plan/workout/:id.
   - /app/plan/workout/:id — lista ćwiczeń, każde tap → /app/plan/exercise/:slug.
   - /app/plan/exercise/:slug — szczegóły, technika, zamienniki.
   - /app/plan/history — wersje planu z change_reason.

GUARDRAILS:
- Przed każdą generacją: evaluateGuardrails. Jeśli critical → nie generuj, pokaż referral screen.
- Warning → generuj z modyfikatorami (np. low_volume dla bmi < 18).

STRUCTURED OUTPUT SCHEMA (OpenAI):
```json
{
  "workouts": [
    {
      "day_label": "mon",
      "name": "Upper A",
      "order_in_week": 1,
      "duration_min_estimated": 45,
      "exercises": [
        {
          "exercise_slug": "barbell_bench_press",
          "order_num": 1,
          "sets": 3,
          "reps_min": 8,
          "reps_max": 12,
          "rir_target": 2,
          "rest_seconds": 120,
          "technique_notes": "Short human-friendly, no acronyms for beginner_zero/beginner",
          "substitute_exercise_slugs": ["dumbbell_bench_press", "pushups"]
        }
      ]
    }
  ],
  "week_structure": {"mon":"upper_a","wed":"lower_a","fri":"upper_b"},
  "progression_rules": {"method":"double_progression","add_weight_kg":2.5,"when":"all_sets_at_top_rep_range_for_2_weeks"},
  "additional_notes": "Keep RIR 2-3, focus on form."
}
```

TESTY:
- Unit: selectTemplate dla 8 segmentów.
- Integration: pełen flow dla 3 person → plan zapisany w DB.
- E2E: user kończy onboarding → widzi plan na /app/today.
- Coverage kluczowych funkcji ≥ 80%.

OBSERVABILITY:
- Każde LLM call: zapis do llm_calls z cost_usd (OpenAI pricing).
- Każda zmiana planu: zapis do ai_decisions z rule_ids_applied.

DELIVERABLES:
- PR z kodem, migracjami, seed, promptami, UI.
- Test report: 3 persony × plan artifactual dump w PR description.
```

---

### Iteracja 5 — Log treningu + historia + behavior signals

**Cel:** user loguje realny trening w < 3 min, widzi progres siły, system zaczyna rozumieć jego zachowanie.

#### Zakres produktowy
**User stories:**
- Jako user na siłowni chcę szybko wpisać serie, żeby nie zgubić rytmu treningu.
- Jako user chcę widzieć moją poprzednią wagę / reps w tym ćwiczeniu, żeby wiedzieć, co mam pokonać.
- Jako user chcę podmienić ćwiczenie ad-hoc i żeby zostało to odnotowane.
- Jako user chcę po treningu krótką ocenę i notatki, żeby poprawiać się.
- Jako user chcę widzieć trend siły w wykresach.

**Funkcje:**
- Workout flow: start → lista ćwiczeń → per ćwiczenie rejestracja serii (waga, reps, RIR) → after-workout rating.
- Poprzednia waga/reps widoczne inline przy każdym ćwiczeniu.
- Inline substitution podczas treningu (z zapisem `was_substituted`).
- Historia treningów na `/app/plan/history/workouts`.
- Wykresy siły per ćwiczenie (proste line charts z Recharts).
- Automatyczna aktualizacja `behavior_signals`.

#### Wymagania techniczne
- Tabele: `workout_logs`, `workout_log_exercises`, `workout_log_sets`, `behavior_signals`.
- `packages/core/signals/`:
  - `updateBehaviorSignals(userId, event)` — wywoływane po każdym workout_log complete.
- Worker (Inngest): `update_signals_after_workout`.
- UI:
  - `/app/today/workout` — aktywny trening, progresywne kroki.
  - `/app/history` — lista treningów z filtrowaniem.
  - `/app/plan/exercise/:slug/history` — historia tego ćwiczenia + wykres.
- Optymistyczne UI dla wpisów serii (klik-klik-klik bez czekania na serwer).

#### Kryteria akceptacji
- [ ] Log pełnego treningu (5 ćwiczeń × 3 serie) w < 3 min.
- [ ] Poprzednia waga/reps widoczna inline.
- [ ] Zamiana ćwiczenia inline: zapis do `workout_log_exercises.was_substituted`.
- [ ] Po treningu `behavior_signals` aktualizuje się: `workout_completion_rate_7d`, `days_since_last_workout_log`.
- [ ] Wykres siły dla martwego ciągu pokazuje trend jeśli user miał 3+ sesje.
- [ ] Offline mode: log trwa w sessionStorage, sync przy wejściu online.
- [ ] Auto-save co 10 sekund.

#### Zależności
Iteracja 4.

#### Brief dla AI
```
ROLA: Full-stack + UX engineer. Budujesz workout logger Nudge.

KONTEKST:
- Schema: grupa 8 (workout_logs*), grupa 12 (behavior_signals).
- User loguje w warunkach siłowni — musi być SZYBKO i jednoznacznie.
- Product Principles §5: krótko, konkretnie.

ZADANIE:
1. Migracje: workout_logs, workout_log_exercises, workout_log_sets, behavior_signals.
2. packages/core/signals/updateBehaviorSignals.ts — funkcja aktualizująca 10 liczników. Wywoływana przez Inngest job.
3. API:
   - POST /api/workout/start (zwraca workout_log_id)
   - POST /api/workout/:id/set (dodaje set; optymistyczne)
   - POST /api/workout/:id/substitute-exercise
   - POST /api/workout/:id/finish (rating + notes)
   - GET /api/workout/history
   - GET /api/exercise/:slug/history
4. UI:
   - /app/today/workout/:workoutLogId — pełnoekranowy flow treningu:
     * Top: nazwa ćwiczenia, tap → szczegóły (Iteracja 4 screen w modal).
     * Środek: lista serii (input waga + reps + RIR slider).
     * Inline „poprzednia waga/reps" nad inputami.
     * Duże przyciski „Dodaj serię", „Następne ćwiczenie".
     * Przycisk „Zamień ćwiczenie" → modal z listą zamienników.
   - Ekran after-workout: 1-5 gwiazdek, 3 pola tekstowe (dobrze/słabo/poprawić).
   - /app/history — lista z infinite scroll.
   - /app/plan/exercise/:slug/history — wykres (Recharts) + lista sesji.
5. Offline: useLocalStorage dla bieżącego treningu, sync po online.
6. Auto-save co 10s (debounced).

KLUCZOWA UX ZASADA:
- Input wagi: NIE spinner. Używaj keyboard numeric + szybkie +/- 2.5.
- Input reps: keyboard numeric.
- RIR slider: 0-5, domyślnie 2.
- Całość musi działać jedną ręką na telefonie (wszystkie ważne akcje w bottom half).

TESTY:
- E2E: log pełnego treningu w timer < 180s.
- Unit: updateBehaviorSignals dla różnych scenariuszy.
- Integration: offline log → online sync.

DELIVERABLES:
- PR z kodem + testami + screenshots flow.
- Loom / screencast nagrywający log w 3 min (optional ale helpful).
```

---

### Iteracja 6 — Plan żywieniowy + log wagi i obwodów

**Cel:** user widzi proste zalecenia żywieniowe dopasowane do celu i trybu, loguje wagę/obwody, widzi trend.

#### Zakres produktowy
**User stories:**
- Jako user w trybie simple chcę talerzowych wytycznych, bez liczenia.
- Jako user w trybie ranges chcę zakresów kcal i priorytetów (białko, warzywa, woda).
- Jako user w trybie exact chcę dokładnych makro targets.
- Jako user chcę logować wagę raz w tygodniu w 10 sekund.
- Jako user chcę widzieć wykres trendu wagi (z smoothing), a nie skoki dzień do dnia.
- Jako user chcę widzieć emergency plan (co robić przy imprezie / braku czasu / głodzie).

**Funkcje:**
- Generator planu żywieniowego (nutrition_plan_versions).
- Ekran `/app/nutrition` — zakładka z planem + log wagi.
- Quick log wagi (1-tap z bottom nav).
- Obwody pasa/bioder/klatki/uda/ramienia jako optional pola.
- Wykres trendu wagi z 7-dniową średnią.
- Emergency plan jako rozwijane karty.

#### Wymagania techniczne
- Tabele: `nutrition_plans`, `nutrition_plan_versions`, `body_measurements`.
- `packages/core/planners/nutrition/`:
  - `generateNutritionPlan(profile, mode, goals): PlanVersion` — reguły (kcal/makro) + LLM (wytyczne, plan awaryjny, suplementy).
- Prompt `nutrition_plan_fill`.
- UI: `/app/nutrition`, `/app/nutrition/log-weight`, `/app/progress/weight`.

#### Kryteria akceptacji
- [ ] 3 persony dostają plany w 3 trybach (simple dla Ani, ranges dla Marty, ranges/exact dla Kuby).
- [ ] Każdy plan zawiera emergency plan z minimum 5 scenariuszami.
- [ ] Log wagi w < 10s.
- [ ] Wykres wagi pokazuje 7-dniową średnią i trend.
- [ ] Guardrails: plan z target kcal < 1200 F / 1500 M jest zablokowany (z override'em tylko z podpisem medycznym user).

#### Zależności
Iteracja 3 (kalkulatory), Iteracja 4 (wzorzec planu z wersjonowaniem).

#### Brief dla AI
```
ROLA: Full-stack + AI engineer. Budujesz nutrition plan + weight logging.

KONTEKST:
- Schema: grupa 9 (nutrition_plans*), grupa 3 (body_measurements).
- Product Principles §8: 3 tryby dokładności.
- Szablon zaleceń żywieniowych (patrz /06 Szablony/) jako bazowa struktura pól.
- Emergency plan jest diferenciatorem Nudge — musi być konkretny.

ZADANIE:
1. Migracje: nutrition_plans, nutrition_plan_versions, body_measurements.
2. packages/core/planners/nutrition/:
   - generateNutritionPlan(profile, mode): wyjście z polami: calories_target, protein_g, fat_g, carbs_g, fiber_g, water_ml, meal_distribution, strategy_notes, practical_guidelines, supplement_recommendations (sensible/optional/unnecessary), emergency_plan.
   - Reguły liczą kcal i makro. LLM wypełnia teksty (strategy_notes, practical_guidelines, emergency_plan, supplements).
3. Prompt nutrition_plan_fill z JSON Schema dla output.
4. API:
   - POST /api/plan/nutrition/generate
   - GET /api/plan/nutrition/current
   - POST /api/measurements/weight
   - POST /api/measurements/circumference
   - GET /api/measurements/weight-history
5. UI:
   - /app/nutrition — zakładka z aktualnym planem: header z targets (jeśli mode != simple), scrollowane sekcje (strategia, wytyczne, suplementy, emergency plan jako akkordeon).
   - /app/nutrition/log-weight — szybki input wagi, optional obwody.
   - /app/progress/weight — Recharts line chart z raw + 7-day rolling average + trend arrow.
6. Empty states: jeśli user nie ma planu żywieniowego (np. nie przeszedł warstwy 2 onboardingu), pokazuj „Odpowiedz na 3 pytania, żeby otrzymać plan".

GUARDRAILS:
- Przed generacją planu: evaluateGuardrails.
- Generator NIE daje planu z kcal < limit bez override, jawnie informuje.

TESTY:
- Unit: generator dla 3 trybów × 3 person.
- E2E: user loguje wagę 3 razy w różnych dniach → wykres pokazuje dane.
- Snapshot test: wygenerowane plany dla 3 person (committed fixtures).

DELIVERABLES:
- PR z kodem + testami + przykładowymi planami w description.
```

---

### Iteracja 7 — Check-in tygodniowy + warstwa 2 progressive profiling

**Cel:** raz w tygodniu user dostaje ustrukturyzowany moment refleksji + konkretną rekomendację. System uczy się userów przez stopniowe dopytywanie w warstwie 2.

#### Zakres produktowy
**User stories:**
- Jako user w niedzielę wieczór chcę 5-minutowy check-in z konkretnym werdyktem.
- Jako user chcę, żeby agregaty liczyły się same (waga, liczba treningów), a ja tylko podaję subiektywne (sen, stres, energia).
- Jako user chcę dostać co tydzień 1-2 pytania warstwy 2 w kontekstowych momentach (nie w formularzu).

**Funkcje:**
- Scheduler check-inów (notyfikacja w niedzielę 19:00 lokalnego czasu).
- Formularz check-inu z auto-agregowanymi polami + subiektywnymi.
- Check-in analyzer (LLM z structured output): verdict + recommended_action + ewentualna korekta planu.
- Priorytetyzacja pytań warstwy 2 per user: wybór 1-2 pytań tygodniowo.
- Pytania kontekstowe (po zdjęciu / treningu / check-inie).

#### Wymagania techniczne
- Tabele: `checkin_sessions`, `user_question_asks` (użycie warstwy 2).
- Seed `question_library` warstwy 2 (~30 pytań per obszar).
- `packages/core/analyzers/checkin.ts`.
- `packages/core/questions/pickNext.ts` — scoring i wybór.
- Prompt `checkin_analysis`.
- Notifications (tabela notifications) z workerem Inngest.

#### Kryteria akceptacji
- [ ] Niedziela 19:00 user dostaje powiadomienie push (in-app; email jako backup).
- [ ] Check-in form pokazuje auto-agregaty (bez edycji) + subiektywne (edytowalne).
- [ ] Po submit: verdict w < 10s + rekomendowana akcja.
- [ ] Jeśli plan trzeba zmienić → generuje się nowa wersja (link „Zobacz nowy plan").
- [ ] 1-2 pytania warstwy 2 pojawiają się w przyszłym tygodniu w kontekstowych miejscach.
- [ ] Dla `guided_beginner` pytania warstwy 2 mają priorytet bezpieczeństwo / regeneracja / zrozumienie planu i nie pojawiają się w krótkich seriach.
- [ ] Pytanie pominięte 3 razy → dłuższy cooldown (90 dni).

#### Zależności
Iteracje 4, 5, 6.

#### Brief dla AI
```
ROLA: Full-stack + AI engineer. Budujesz weekly check-in + adaptive layer 2.

KONTEKST:
- Schema: grupa 11 (`checkin_sessions`), grupa 13 (question_library, user_question_asks), grupa 17 (notifications).
- Szablon check-inu z /06 Szablony/ jako struktura pól.
- Product Principles §9: trendy, nie pojedyncze dni. Zmiana nie częściej niż co 2-3 tygodnie.

ZADANIE:
1. Migracje: `checkin_sessions` + enums, user_question_asks rozszerzenie.
2. Seed question_library warstwy 2: ~30 pytań per obszar (trening, dieta, sen, życie). Każde z: field_key, applicable_segments, priority_base, why_we_ask, how_to_measure, phrasing_options.
3. packages/core/analyzers/checkin.ts:
   - computeAggregates(userId, weekOf): pola z workout_logs, meal_logs, body_measurements.
   - analyzeCheckin(aggregates, subjective, profile) → LLM call → verdict + action + plan_change_needed.
4. packages/core/questions/pickNext.ts:
   - score = base × (1 - alreadyKnown(field_key)) × segmentFit × cooldown.
   - Top 1-2 pytania per tydzień.
5. API:
   - GET /api/checkin/current (zwraca prefilled form dla tego tygodnia)
   - POST /api/checkin/submit
   - GET /api/questions/next (zwraca 1-2 pytania do zadania)
   - POST /api/questions/:id/answer
   - POST /api/questions/:id/skip
6. Scheduler: Inngest cron job „weekly_checkin_notification" — niedziela 19:00 lokalnego czasu per user.
7. UI:
   - /app/checkin — form z sekcjami: Auto-agregaty (read-only), Subiektywne (slidery), Wolny tekst (3 pola).
   - /app/checkin/result — werdykt, rekomendowana akcja, jeśli plan zmieniony → CTA „Zobacz nowy plan".
   - Kontekstowe pytania: komponent <ContextualQuestion> osadzany w bottom sheet na różnych ekranach.
8. Anti-spam reguły:
   - Max 1 kontekstowe pytanie per sesja.
   - Max 1 proaktywny nudge coacha per 3 dni.

TESTY:
- Unit: pickNext dla 3 person × 3 stany profilu.
- Integration: check-in submit → werdykt + ai_decisions wpis.
- E2E: scheduler triggerowany → powiadomienie → user wypełnia → widzi werdykt.

DELIVERABLES:
- PR z kodem, migracjami, seedem.
- Dokumentacja formuły pickNext w packages/core/questions/README.md.
```

---

### Iteracja 8 — AI Coach (chat + kontekstowe skróty + guardrails)

**Cel:** user może zapytać coacha o cokolwiek — w chacie lub przez kontekstowe skróty. Guardrails chronią przed niebezpiecznymi odpowiedziami.

#### Zakres produktowy
**User stories:**
- Jako user z bąbelkiem w rogu chcę zapytać coacha o cokolwiek.
- Jako user przy konkretnym ćwiczeniu chcę zapytać „jak to zrobić" bez przepisywania pytania.
- Jako user przy posiłku chcę zapytać „czy to pasuje do mojego planu".
- Jako user z bólem chcę, żeby coach NIE kazał mi robić ćwiczenia, tylko zasugerował konsultację.

**Funkcje:**
- Persistent chat bubble (z Iteracji 1 — teraz aktywujemy).
- Kontekstowe skróty: „Jak to zrobić?" przy ćwiczeniu, „Czy to pasuje?" przy posiłku, „Zamień na łatwiejsze" przy treningu.
- Intent classification (technical / diet / motivation / pain / other).
- Routing do dedykowanych promptów per intent.
- Pełen guardrails layer na wyjściach.
- Proaktywne bąbelki: pierwsze 2 scenariusze:
  - „Zauważyłem, że opuściłeś 2 treningi. Pogadajmy?"
  - „Mamy Cię 2 tygodnie. Zrobić mini podsumowanie?"
- Historia rozmów w /app/profile/conversations.

#### Wymagania techniczne
- Tabele: `coach_conversations`, `coach_messages`.
- `packages/core/coach/`:
  - `classifyIntent(message, context): Intent`
  - `routeToPrompt(intent, context): PromptId`
  - `applyGuardrailsToOutput(output, userFlags): SafeOutput`
- Prompty: `coach_technical`, `coach_diet_question`, `coach_pain_flagged`, `coach_motivation`.
- Streaming response (SSE) z backendu.

#### Kryteria akceptacji
- [ ] Tap w bąbelek → otwiera chat.
- [ ] „Jak zrobić martwy ciąg?" dla segmentu `beginner_zero` → odpowiedź ludzka, bez akronimów.
- [ ] „Czy mogę jeść masło orzechowe na redukcji?" → konkret + kontekst planu.
- [ ] „Boli mnie bark przy wyciskaniu" → wyzwala guardrail pain → referral do fizjoterapeuty + NIE kontynuuje z rekomendacją.
- [ ] „Alternatywa dla ławki" → lista 3 zamienników z katalogu + komentarz.
- [ ] Kontekstowe skróty działają z pre-filled promptem.
- [ ] Guardrail na ED-risk pattern: „chcę schudnąć 10 kg w miesiąc" → empatyczne przekierowanie.
- [ ] Historia rozmów widoczna i przeszukiwalna.
- [ ] Maks 50 wiadomości / dzień per user (soft limit z friendly message).

#### Zależności
Iteracje 2, 4, 6 (kontekst: profil, plan, dieta).

#### Brief dla AI
```
ROLA: Full-stack + AI engineer. Budujesz AI Coach.

KONTEKST:
- Schema: grupa 14 (coach_conversations, coach_messages), grupa 15 (llm_calls, prompts, safety_escalations).
- ADR-002: guardrails na wyjściach LLM. Structured output nie jest wymagany dla chat (to free-form), ale intent classification TAK.
- Product Principles §10, §14.

ZADANIE:
1. Migracje: coach_conversations, coach_messages.
2. packages/core/coach/:
   - classifyIntent(message, context) → LLM call z structured output (enum).
   - routeToPrompt(intent, context) → wybór prompt_slug.
   - applyGuardrailsToOutput(text, userFlags) → sprawdza czy nie ma: diagnozy, dawkowania, schlebiania niebezpiecznym celom; jeśli problem → modyfikuje lub blokuje.
3. Prompty (dodaj do tabeli prompts):
   - coach_technical_exercise (z katalogu ćwiczeń)
   - coach_diet_question (z planu żywieniowego)
   - coach_pain_flagged (zawsze → referral)
   - coach_motivation (krótkie, nie patetyczne)
4. API:
   - POST /api/coach/conversations (start new or return current open)
   - POST /api/coach/conversations/:id/messages (streaming response SSE)
   - GET /api/coach/conversations
5. UI:
   - Floating bubble globally (z Iteracji 1 — aktywujemy).
   - Chat screen: /app/coach/:conversationId.
   - Entry points:
     * /app/plan/exercise/:slug → button „Spytaj o technikę" (pre-fills message)
     * /app/nutrition → button „Spytaj o produkt"
     * /app/today/workout → button „Zamień ćwiczenie" (przy ćwiczeniu)
     * Po check-in → link „Pogadaj o tym z coachem"
   - /app/profile/conversations — historia.
6. Proaktywny coach: Inngest job `proactive_coach_check` (co 6h) → jeśli signals wskazują (missing 2 workouts, 2 weeks without check-in) → tworzy notification + conversation opener.

GUARDRAILS (przykłady):
- Wejście zawiera „boli" / „strzyka" / „drętwi" → intent = `pain` → prompt = coach_pain_flagged → odpowiedź: empatyczna + skierowanie do fizjoterapeuty.
- Wejście zawiera „schudnąć X kg w Y dni" (ekstremalne tempo) → prompt modyfikuje: wyjaśnia ryzyko + proponuje realistyczny cel.
- Wyjście zawiera diagnozę medyczną → blokuj, wyślij fallback „Nie mogę postawić diagnozy — skonsultuj z lekarzem".

TESTY:
- Unit: classifyIntent na 20 test inputs.
- Unit: applyGuardrailsToOutput na 10 niebezpiecznych wzorcach.
- Integration: pełna rozmowa z streamingiem.
- E2E: 3 scenariusze per persona.

DELIVERABLES:
- PR z kodem, promptami, testami.
- Test report: 20 rzeczywistych pytań na różnych segmentach + odpowiedzi (manual review).
```

---

### Iteracja 9 — Zdjęcia posiłków (Vision) + dzienne podsumowania

**Cel:** user robi zdjęcie posiłku → dostaje oszacowanie kcal w zakresie + makro + dzienne podsumowanie.

#### Zakres produktowy
**User stories:**
- Jako user chcę zrobić zdjęcie i dostać wynik w < 15s bez wpisywania.
- Jako user chcę dodać krótki opis („z majonezem, duża porcja") i dostać lepszy wynik.
- Jako user chcę poprawić wynik ręcznie (ingredient / grama).
- Jako user chcę widzieć dziś (kcal, białko, węgle, tłuszcze) w jednym widoku.

**Funkcje:**
- Upload zdjęcia z kompresją (512×512 max po stronie klienta).
- Quick estimate (photo-only) / photo+note / manual entry.
- OpenAI Vision (gpt-4o) z structured output.
- Zakresy (kcal min/max) + confidence score.
- Item-by-item korekta.
- Dzienne podsumowanie na /app/nutrition/today.
- Nutrition_daily_totals aktualizowane triggerem.

#### Wymagania techniczne
- Tabele: `meal_logs`, `meal_log_items`, `meal_images`, `nutrition_daily_totals`.
- Supabase Storage: bucket `meal_photos` z RLS.
- `packages/core/vision/`:
  - `compressImage(file): Blob` (client-side).
  - `analyzeMealPhoto(storagePath, note): MealAnalysis` — OpenAI Vision call.
- Prompt `meal_vision_analysis` z JSON Schema.
- Worker Inngest `analyze_meal_photo`.

#### Kryteria akceptacji
- [ ] Zdjęcie kurczaka z ryżem → zakres 500-750 kcal z confidence ≥ 0.5.
- [ ] Dodanie notatki „z sosem majonezowym" → wyższy max kcal.
- [ ] Kompresja: plik > 5MB → wysyłane < 1MB.
- [ ] Item-by-item korekta działa: zmiana „ryż: 150g" → 200g → total się przelicza.
- [ ] Dzienne podsumowanie aktualizuje się po każdym logu.
- [ ] Manual entry działa bez zdjęcia.
- [ ] Guardrail ED-risk: 7 dni z <1200 kcal → push komunikat z kierowaniem do specjalisty.

#### Zależności
Iteracje 2, 6.

#### Brief dla AI
```
ROLA: Full-stack + AI engineer. Budujesz meal photo analyzer.

KONTEKST:
- Schema: grupa 10 (meal_logs, meal_log_items, meal_images, nutrition_daily_totals).
- ADR-002: structured output, kompresja przed Vision (oszczędność ~70% kosztów).
- Product Principles §13: ZAKRESY, nie pojedyncze wartości. Bez udawania precyzji.

ZADANIE:
1. Migracje: meal_logs + enums, meal_log_items, meal_images, nutrition_daily_totals.
2. Supabase Storage bucket `meal_photos` z RLS (user widzi tylko swoje).
3. packages/core/vision/:
   - compressImage(file) w kliencie: canvas → 512×512 max, jpeg quality 0.8.
   - analyzeMealPhoto(storagePath, note): OpenAI Vision gpt-4o call z JSON schema output.
4. Prompt meal_vision_analysis (dodaj do prompts):
```json
output_schema: {
  "meal_type_guess": "breakfast|lunch|dinner|snack|drink|dessert",
  "ingredients_detected": [
    {"label":"kurczak grillowany","portion_estimate":"~150g","grams_estimate":150,"kcal_estimate":245,"protein_g":46,"carbs_g":0,"fat_g":5}
  ],
  "kcal_estimate_min": 500,
  "kcal_estimate_max": 750,
  "protein_g_min": 35, "protein_g_max": 55,
  "carbs_g_min": 50, "carbs_g_max": 90,
  "fat_g_min": 10, "fat_g_max": 25,
  "confidence_score": 0.65,
  "user_warnings": ["Niepewna wielkość porcji — jeśli jadłeś inną ilość, skoryguj"]
}
```
5. Worker Inngest `analyze_meal_photo` — input: meal_log_id, storage_path. Output: update meal_logs + meal_log_items. Max retries: 1.
6. Trigger Postgres: po INSERT/UPDATE na meal_logs → aktualizuj nutrition_daily_totals.
7. API:
   - POST /api/meal/photo (multipart upload → enqueue task, zwróć meal_log_id)
   - GET /api/meal/:id (status + wyniki)
   - PATCH /api/meal/:id/items/:itemId (korekta)
   - POST /api/meal/manual (ręczny wpis bez zdjęcia)
   - GET /api/nutrition/daily/:date
8. UI:
   - /app/nutrition/log — 3 CTA: Zdjęcie / Zdjęcie+notatka / Ręcznie.
   - /app/nutrition/log/photo — kamera + preview + optional note.
   - /app/nutrition/log/:mealLogId — wynik z zakresem (zawsze min-max, confidence jako stars).
   - /app/nutrition/log/:mealLogId/edit — item-by-item edit.
   - /app/nutrition/today — card z kcal/protein/carbs/fat jako progress rings (dziennie).
9. Rate limiting: max 6 zdjęć / dzień per user (z komunikatem jak przekroczone).

KOSZTY:
- Każde zdjęcie: kompresja do 512px → ~$0.01-0.02 na gpt-4o call.
- Log do llm_calls z cost_usd.
- Alert jeśli user_ai_usage przekroczy budżet miesięczny.

TESTY:
- Unit: compressImage dla plików 10MB → < 1MB.
- Integration: upload → analysis → meal_logs + items.
- E2E: user loguje 3 posiłki → dzienne totals się zgadza.
- Manual: zbiór 10 zdjęć testowych → snapshot wyników w repo.

DELIVERABLES:
- PR z kodem + testami + 10 przykładowych zdjęć i wyników w description.
```

---

### Iteracja 10 — Monetyzacja, trial, notifications, retention

**Cel:** pełen flow komercyjny działa end-to-end. Od rejestracji przez trial do płatności, pauzy, reaktywacji.

#### Zakres produktowy
**User stories:**
- Jako user po rejestracji dostaję 7-dniowy trial bez karty.
- Jako user w dniu 4 trialu dostaję email podsumowujący „co już wiemy o Tobie".
- Jako user w dniu 7 widzę paywall z 2 opcjami (monthly / yearly).
- Jako user chcę zapauzować subskrypcję, nie kasować.
- Jako user po 60 dniach nieaktywności dostaję re-engagement email.

**Funkcje:**
- Stripe integration (Checkout + Portal).
- Trial counter widoczny w UI.
- Paywall po trial.
- Pauza subskrypcji z portalu.
- Email sequences (trial D4, D7, re-engagement D60, yearly renewal T-14).
- Admin dashboard (minimal): liczba active, trial, cost per user.

#### Wymagania techniczne
- Tabele: `subscriptions`, `user_ai_usage`, `notifications`.
- Stripe webhook handler.
- `packages/core/billing/`:
  - `getAccess(userId): AccessLevel` — sprawdza trial/active/paused.
  - `enqueueEmail(userId, sequence, stage)`.
- Email provider: Resend (dobry dla PL).
- Inngest cron jobs: daily check trial states.

#### Kryteria akceptacji
- [ ] Nowy user → automatyczny trial 7 dni (bez karty).
- [ ] Middleware: po trialu user widzi paywall, nie może używać core features.
- [ ] Stripe Checkout działa (test mode) dla monthly i yearly.
- [ ] Webhook aktualizuje `subscriptions.status`.
- [ ] Pauza subskrypcji z Customer Portal → status `paused`, `paused_until` set, user zachowuje dane.
- [ ] Trial email D4 („oto co wiemy") wysłany.
- [ ] Trial email D7 („kontynuuj") wysłany z deep linkiem do paywall.
- [ ] User anulujący → widzi „Wróć za 30 dni — trzymamy dane".
- [ ] Admin dashboard pokazuje: liczba trial / active / churned / MRR / cost_per_active_user.
- [ ] Alert Slack/email jeśli cost_per_active_user > $3.

#### Zależności
Wszystkie poprzednie (bo monetyzacja blokuje dostęp do core features po trialu).

#### Brief dla AI
```
ROLA: Senior full-stack engineer. Budujesz monetyzację + retention.

KONTEKST:
- ADR-004: 7-dniowy trial bez karty → 49 PLN/mc lub 349 PLN/rok. Pauza zamiast kasowania. Brak free tier.
- Stack: Stripe (web) + Resend (email) + Inngest (scheduling).
- Rynek: Polska głównie (CEE).

ZADANIE:
1. Migracje: subscriptions, user_ai_usage, notifications (grupa 17).
2. Konfiguracja Stripe:
   - Produkty: Nudge Monthly (49 PLN) i Nudge Yearly (349 PLN).
   - Customer Portal z możliwością pauzy (via Stripe pause_collection).
   - Webhook handler: subscription.created/updated/deleted, invoice.paid, etc.
3. packages/core/billing/:
   - startTrial(userId) — tworzy subscriptions record status='trial'.
   - getAccess(userId) — returns 'full' | 'trial' | 'paywall' | 'paused'.
   - recordAIUsage(userId, cost) — increments user_ai_usage.
4. Middleware `requirePaidAccess` w apps/web:
   - trial/active/paused → dostęp pełny (paused tylko read-only).
   - trial_expired → paywall.
5. UI:
   - /app/billing — status subskrypcji, historia faktur, pauza, cancel.
   - /paywall — 2 opcje (monthly / yearly), Stripe Checkout.
   - Global trial banner (day N of 7) na /app/today gdy status=trial.
6. Email sequences (Resend):
   - D4: „Oto co już wiemy o Tobie" — personalizowane z profilu.
   - D7 (przed końcem trialu): „Kontynuuj z planem" + CTA paywall.
   - Post-cancellation D1: „Wróć za 30 dni — trzymamy dane".
   - Inactivity D60: personalizowany re-engagement z ostatnim progresem + 30% rabat.
   - Pre-renewal D-14 (yearly): podsumowanie roku + CTA renew.
7. Admin dashboard /admin (za feature flag + role check):
   - Active/trial/paused/churned users.
   - MRR, churn rate.
   - Cost per active user (last 30d).
   - Top consumption users (do optymalizacji).
8. Alert: jeśli cost_per_active_user > $3 → Slack webhook (env var).

TESTY:
- Unit: getAccess dla wszystkich stanów subscriptions.
- Integration: Stripe webhook handlers (z fixtures).
- E2E: nowy user → trial → D7 → paywall → Stripe Checkout (test mode) → active → portal → pauza → wraca → active.
- Manual: ścieżka refund, cancel, renewal.

DELIVERABLES:
- PR z kodem + testami + Stripe config (products, prices, webhooks).
- Runbook: co zrobić gdy webhook fails, gdy refund request, gdy fraud suspected.
- Copy dla 4 email sequences (polski, zgodny z Product Principles).
```

---

## 10. Zależności między iteracjami

| Iteracja | Wymaga ukończenia |
|---|---|
| 0 — Fundament | — |
| 1 — Auth + Shell | 0 |
| 2 — Onboarding v1 + Profil | 1 |
| 3 — Reguły + Guardrails | 2 |
| 4 — Plan treningowy | 3 |
| 5 — Log treningu | 4 |
| 6 — Plan żywieniowy + Pomiary | 3 |
| 7 — Check-in + Warstwa 2 | 4, 5, 6 |
| 8 — AI Coach | 2, 4, 6 |
| 9 — Zdjęcia posiłków | 2, 6 |
| 10 — Monetyzacja | Wszystkie (blokuje dostęp) |

**Możliwa równoległość (jeśli kiedyś będzie 2 osoby):**
- 6 i 5 mogą iść równolegle po 3-4.
- 8 i 9 mogą iść równolegle po 6.

## 11. Open questions

### Produktowe (odpowie Bartek)
- **Kto dostarcza seed 150 ćwiczeń** (Iteracja 4)? Bartek sam + trener konsultant? Czy kupujemy dataset?
- **Katalog żywieniowy** dla zaawansowanych zaleceń (makro produktów) — budujemy własny czy używamy API (USDA, Open Food Facts)?
- **Czy mamy personal trenera-konsultanta** do review guardrails, ćwiczeń, planów? Rekomendacja: tak, przed launchem.
- **Cena w PLN czy EUR** jako baza? (iOS/Android w fazie 2 pomnoży decyzję). Rekomendacja: PLN teraz, EUR gdy wychodzimy poza CEE.

### Design (do review po Iteracji 1)
- Design tokens (kolory, typografia) — szybki brief z Figma lub wybieramy palet shadcn/ui i idziemy?
- Ikonografia — lucide-react wystarczy, czy zamawiamy custom?
- Logo — mamy? Jeśli nie, to Iteracja 0 albo 1 wymaga prostego wordmarka.

### Techniczne
- **Inngest vs Supabase Queues** dla worker jobs — testujemy oba w Iteracji 4, wybór po 1 tygodniu.
- **PostHog self-hosted vs cloud** — cloud dla v1 (tanio, szybko); self-hosted rozważamy po 10k userów.
- **Monitoring API** (Better Stack / Dead Man's Snitch / UptimeRobot) — Uptime Robot dla v1.

### Prawne (przed publicznym launchem)
- **GDPR** — prywatność, eksport danych, delete. Musimy mieć w Iteracji 1 (delete account) ale pełna zgodność przed launchem.
- **Terms of Service** dla Polski. 
- **Disclaimer medyczny** — review prawnika przed launchem.
- **Rejestracja działalności** — jednoosobowa czy sp. z o.o.? (poza zakresem PRD)

## 12. Ryzyka i mitigacja

| Ryzyko | Impact | Prawdopodobieństwo | Mitigacja |
|---|---|---|---|
| Koszt LLM wymyka się | Wysoki | Średnie | Monitoring per user od dnia 1; kompresja zdjęć; cache odpowiedzi; rate limits |
| Trial→paid < 10% | Wysoki | Średnie | Weekly review; dzień 5 value email; A/B testy onboardingu |
| Halucynacje AI mimo guardrails | Wysoki | Niskie | Structured outputs wszędzie; evals; copy templates; user reporting mechanism |
| Plateau wzrostu po 3 miesiącach | Średni | Wysokie | Content marketing + SEO + referral w kolejnym PRD |
| Awaria OpenAI | Wysoki | Niskie | Abstrakcja klienta; fallback Anthropic; degradacja graceful |
| Wypalenie jednoosobowego zespołu | Wysoki | Wysokie | Jasne iteracje; nie kumulowanie scope; wsparcie AI; przerwy |

## 13. Standard PR / workflow

Każda iteracja ma jeden duży PR (albo kilka mniejszych — decyzja per iteracja).

**Checklist przed merge:**
- [ ] Kryteria akceptacji iteracji spełnione (sprawdzone ręcznie).
- [ ] Testy zielone (unit + integration + E2E gdzie zdefiniowane).
- [ ] Coverage na zmienionych plikach ≥ 80%.
- [ ] Lint i typecheck zielone.
- [ ] Migracje mają down (rollback).
- [ ] Zmienione ADR-y lub Principles (jeśli dotyczy) — link w PR description.
- [ ] Sentry wire-up nowych crashes (jeśli nowy moduł).
- [ ] PostHog eventy zdefiniowane.
- [ ] Screenshots / Loom w PR description dla UI changes.
- [ ] Security review dla nowych endpointów (RLS, rate limits, CSRF).
- [ ] Deploy na staging i manual smoke test.

## 14. Definicja „skończone" dla całego PRD

PRD uznajemy za zrealizowany, gdy:
- Wszystkie 10 iteracji są na produkcji.
- Przynajmniej 10 testerów przeszło pełny flow (onboarding → plan → trening → jedzenie → check-in → coach → trial paywall).
- Wszystkie metryki leading są mierzone w PostHog i pokazują liczby (bez targetów — te walidujemy w kolejnych 3 miesiącach).
- Guardrails wywołały się w testach z 0 false negatives dla krytycznych scenariuszy (ED, pain, underage, pregnancy).
- Cost per active user na stagingu < $2.50/mc.

Po realizacji PRD: pisanie v2 (natywne iOS/Android, segmenty 4-8, content marketing, referral).

---

## Historia wersji

- **1.1** (2026-04-18) — aktualizacja pod `beginner_zero`, neutralny onboarding L1, guided path, mini check-in po treningu i jakościową progresję.
- **1.0** (2026-04-15) — inicjalna wersja. Autor: Bartek + Claude.
