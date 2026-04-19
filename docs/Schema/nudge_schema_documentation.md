# Nudge — Dokumentacja schematu bazy danych

*Wersja: 0.2 (MVP v1 + guided beginner path) — 2026-04-18*
*Plik źródłowy: [nudge_schema.dbml](./nudge_schema.dbml)*
*Diagram: [nudge_schema_diagram.md](./nudge_schema_diagram.md)*

## Cel dokumentu

Schemat zawiera 18 grup tabel i kilka rozszerzeń wdrożonych po MVP v1, w tym osobną ścieżkę `beginner_zero`, guided workout, jakościową progresję i audyt bezpieczeństwa. Ten dokument wyjaśnia, po co każda grupa istnieje, jakie decyzje produktowe/architektoniczne za nimi stoją i w jakiej kolejności je implementujemy. Bez tego kontekstu schemat jest trudny do zrozumienia, a łatwo go zepsuć przy pierwszej modyfikacji.

## Zasady przekrojowe

**1. Event-sourcing dla danych "miękkich", snapshot dla "twardych".**
`user_profile_facts` jest źródłem prawdy (każdy fakt z confidence/source/timestamp). `user_profile` to zdenormalizowany cache do szybkich zapytań. Trigger PG lub job aktualizuje cache po zmianach facts.

**2. Wersjonowanie planów, nie nadpisywanie.**
`training_plans` to kontener. Realna treść siedzi w `training_plan_versions`. Każda zmiana planu = nowy version + pointer `current_version_id`. To daje audyt i możliwość „dlaczego tak zmieniliśmy".

**3. RLS na każdej user-scoped tabeli.**
Supabase RLS z polityką `user_id = auth.uid()` dla wszystkich tabel z kolumną `user_id`. Katalogi (`exercises`, `question_library`, `prompts`, `field_explanations`) są publiczne do czytania.

**4. UUID wszędzie, nigdy `serial`.**
Łatwiejsza synchronizacja offline, mniejsze ryzyko enumeracji, kompatybilne z Supabase.

**5. JSONB dla polimorfii, płaskie pola dla reszty.**
Pola indeksowalne (waga, daty, enum-y) — płaskie. Pola typu „snapshot celu w momencie generacji planu" — JSONB.

**6. Soft delete przez `deleted_at`.**
GDPR — użytkownik może zażądać usunięcia. Hard delete tylko w batch job po 30 dniach.

---

## Grupa 1 — Auth i subskrypcja

**Tabele:** `users`, `subscriptions`

**Po co:** Supabase zarządza auth w `auth.users`. My mirrorujemy id + trzymamy rozszerzenia (timezone, locale, last_active). Subskrypcja rozdzielona od `users`, bo ma swoje stany (trial, active, paused) i providera (Stripe web, RevenueCat mobile — ADR-001/004).

**Klucz:** `subscriptions.status` + `paused_until` — aplikacja co wejście sprawdza te pola i decyduje, czy user ma dostęp. Pauza zamiast kasowania (ADR-004).

---

## Grupa 2 — Profil użytkownika

**Tabele:** `user_profile`, `user_profile_facts`

**Po co:** `user_profile_facts` realizuje kluczową zasadę z ADR-003 (confidence, source, last_updated, inferred_from). Przykłady zapisów:

```
{field_key: "weight_kg", value_numeric: 82.3, source: "user_input", confidence: 0.95}
{field_key: "prefers_morning_workouts", value_bool: true, source: "behavioral_signal", confidence: 0.6, inferred_from: <workout_log_ids>}
{field_key: "dietary_constraints", value_json: ["vegetarian"], source: "onboarding", confidence: 1.0}
```

**Zasada:** `facts` nigdy nie są nadpisywane. Jeśli user zmieni wagę, dopisujemy nowy rekord z wyższym `observed_at`. Stary rekord zostaje dla audytu, ale ma ustawione `supersedes_id` na nowy.

**user_profile** to projekcja — ma tylko „ostatni znany stan" kluczowych pól. Rebuild po migracji = policzyć max(observed_at) per field_key.

Po wdrożeniu guided path `user_profile` trzyma też pola sterujące zachowaniem produktu:
- `entry_path` — czy user idzie ścieżką `guided_beginner`, czy standardową,
- `adaptation_phase` — na jakim etapie oswajania / adaptacji jest user,
- `needs_guided_mode` — czy uproszczony widok krok-po-kroku ma być domyślny,
- `inferred_beginner_status` + `inferred_beginner_reason_codes` — zapis auto-kwalifikacji do łagodnego startu,
- pola konsultacji z trenerem (`trainer_consultation_*`, `trainer_feedback_notes`) — bo konsultacja jest warunkowym krokiem produktu, a nie pytaniem wejściowym.

---

## Grupa 3 — Pomiary ciała

**Tabele:** `body_measurements`

**Po co:** fitness app musi mieć szybki dostęp do historii wagi i obwodów (wykresy, check-iny). Mogłoby siedzieć w `user_profile_facts`, ale wybieramy osobną tabelę, bo:
- dużo częstszy odczyt (wykresy),
- naturalne kolumny (waga, pas, bioder),
- łatwy index (user_id, measured_at).

Kopia danych w `user_profile_facts` i tak powstaje przy każdym insert (dla spójności).

---

## Grupa 4 — Sprzęt, preferencje, zdrowie, flagi

**Tabele:** `user_equipment`, `user_training_preferences`, `user_nutrition_preferences`, `user_health`, `user_safety_flags`

**Po co:** Twoje szablony z `04 Mój Profil` w formie znormalizowanej. Każda tabela to jeden obszar i jedna odpowiedzialność.

**Klucz — `user_safety_flags`:** realizacja warstwy guardrails z ADR-002. Każda flaga ma severity i status. Flagi aktywne z severity=critical blokują generowanie planu. Flagi warning modyfikują plan (np. łagodniejsza progresja) i każą wysłać disclaimer.

**Uwaga produktowa:** dalej obowiązuje progressive profiling, ale po wdrożeniu `beginner_zero` część minimalnych preferencji może powstać już po onboardingu L1. Przykład: `user_training_preferences.prefers_guided_mode = true` albo uproszczony `nutrition_mode = simple` dla guided beginnera.

`user_safety_flags` i `safety_escalations` współpracują: flagi to stan bezpieczeństwa usera, a eskalacje to audyt konkretnych zdarzeń, np. zgłoszonego bólu w klatce piersiowej lub ostrego bólu stawu.

---

## Grupa 5 — Cele i segmenty

**Tabele:** `user_goals`, `user_segment_snapshots`

**Po co:** cel nie jest statyczny. User może zaczynać od redukcji, potem zmienić na budowę masy. Trzymamy historię + flagę `is_current`.

**`user_segment_snapshots`:** nie jest źródłem prawdy — jest cachem do szybkich raportów i routingu promptów. Wyliczany po każdej zmianie profilu. Pole `segment_key` to scalona wartość do jednego z 8 priorytetowych segmentów (ADR-003), już w nazewnictwie `beginner_zero / beginner / intermediate / advanced`.

Snapshot zawiera też `entry_path` i `adaptation_phase`, bo w praktyce raporty i routing pytań muszą odróżniać nie tylko segment, ale też tryb produktu.

---

## Grupa 6 — Katalog ćwiczeń (global)

**Tabele:** `exercises`

**Po co:** wspólna pula ćwiczeń dla wszystkich userów. Tu kuratujemy: nazwa, grupy mięśniowe, sprzęt, trudność, zamienniki. Cała logika planów opiera się na slug-ach — jeśli zmienia się ćwiczenie, zmienia się wszędzie.

Po wdrożeniu guided mode katalog ćwiczeń jest też źródłem uproszczonych instrukcji dla nowicjusza: `plain_language_name`, `simple_goal_description`, `setup_instructions`, `execution_steps`, `tempo_hint`, `breathing_hint`, `safety_notes`, `stop_conditions`, `starting_load_guidance` i reason-aware zamienniki.

**Źródła danych:** start — ręczna kuracja ~150 najczęstszych ćwiczeń przez trenera. Później rozszerzenie.

**Ważne:** `alternatives_slugs` to domyślne zamienniki. Per-user override (np. z powodu bólu) siedzi w `user_training_preferences.avoid_exercises`.

---

## Grupa 7 — Plan treningowy z wersjonowaniem

**Tabele:** `training_plans`, `training_plan_versions`, `plan_workouts`, `plan_exercises`, `plan_workout_steps`

**Po co:** oddzielamy kontener (plan) od zawartości (version). `plan.current_version_id` wskazuje aktywną wersję. Zmiana = nowa wersja + update pointer.

**Zapamiętujemy w `training_plan_versions`:**
- `change_reason` — dlaczego nowa wersja (user feedback, plateau, kontuzja, automatyczna korekta)
- `goal_snapshot` — jaki cel user miał w tym momencie (bo cel może się zmienić niezależnie)
- `llm_call_id` — powiązanie z konkretnym wywołaniem LLM, które wygenerowało plan
- `guided_mode`, `adaptation_phase`, `view_mode` — czy to plan standardowy, czy guided beginner i w jakiej fazie

**To umożliwia odpowiedź na pytanie usera:** „Dlaczego mi to wtedy zmieniliście?" — odtwarzamy kontekst decyzji.

`plan_workouts` i `plan_exercises` to konkretna rozpiska. `plan_workouts.confidence_goal` opisuje dodatkowo, jaki jakościowy cel ma dana sesja (np. „oswoić bieżnię” albo „poczuć się pewniej przy pierwszej maszynie”).

`plan_workout_steps` to warstwa dla `Today Guided Workout`. Trzymamy tam sekwencję kroków: wejście i przygotowanie, rozgrzewkę, część główną, wyciszenie i krótkie podsumowanie. Krok może wskazywać ćwiczenie z katalogu, ale nie musi. Dzięki temu guided path nie jest tylko „listą ćwiczeń z innym copy”.

---

## Grupa 8 — Log treningu

**Tabele:** `workout_logs`, `workout_log_exercises`, `workout_log_sets`

**Po co:** co user realnie zrobił. Odnosi się do `plan_workout_id`, ale może też być NULL (ad-hoc trening).

**Pole `was_substituted`:** jeśli user podmienił ćwiczenie (np. wyciskanie → pompki), zachowujemy to. Po guided path zamiana ma też reason code (`machine_busy`, `unclear`, `discomfort`, `too_hard`) — to sygnał do uproszczenia planu albo niewprowadzania progresji.

**`workout_log_sets`:** pojedyncza seria — ciężar, powtórzenia, RIR, to_failure. To jest źródło do wykresów siły i heurystyk progresji.

`workout_logs` po rozszerzeniu guided path trzyma też mini check-in po sesji:
- `clarity_score`, `confidence_score`, `felt_safe`,
- flagi `exercise_confusion_flag`, `machine_confusion_flag`, `too_hard_flag`, `pain_flag`.

To ważne, bo dla `beginner_zero` progresja zależy nie tylko od wykonania treningu, ale też od zrozumienia planu, poczucia bezpieczeństwa i braku czerwonych flag bólowych.

---

## Grupa 10 — Log żywienia (zdjęcia + wpisy)

**Tabele:** `meal_logs`, `meal_log_items`, `meal_images`, `nutrition_daily_totals`

**Po co:** serce modułu zdjęć.

**`meal_logs` z zakresami (min/max) + point:** zgodnie z Principles §13 i pierwotnym planem — nie udajemy precyzji. Trzymamy zakres oszacowania + `confidence_score`. Pole `kcal_estimate_point` wypełnia się dopiero gdy user skoryguje wpis.

**`meal_log_items`:** rozbicie posiłku na składniki (ryż, kurczak, warzywa...). Każdy z własnym oszacowaniem. User może korygować item-by-item.

**`meal_images`:** osobna tabela z pathą w Supabase Storage. Nie trzymamy base64 w bazie. Liczymy też `original_size_bytes` i `compressed_size_bytes` do monitoringu kosztów (kompresja przed Vision API zmniejsza bill ~70%).

**`nutrition_daily_totals`:** pre-aggregated (materialized view lub trigger-updated). Wyświetlanie dziennych podsumowań nie robi SUM przez 30 posiłków.

**Uwaga produktowa:** stary, wersjonowany nutrition plan został usunięty. Aktualny moduł żywieniowy w aplikacji opiera się na logach posiłków i pomiarach masy ciała, bez generowanego planu.

---

## Grupa 11 — Check-iny tygodniowe

**Tabele:** `checkin_sessions`

**Po co:** mapowanie Twojego `szablon_checkin_tygodniowy.md`.

**Kluczowa decyzja:** agregaty (waga avg, wykonane treningi) **liczone automatycznie z danych**, nie pytamy o nie usera. User podaje tylko subiektywne (sen, stres, energia, głód, komentarze).

**`diet_adherence_estimate`:** liczone heurystycznie (meals_logged / expected_meals), NIE samoocena. Samoocena „trzymanie diety w %" jest notorycznie niewiarygodna.

**Unique constraint `(user_id, week_of)`:** jeden check-in na tydzień.

**`ai_verdict` i `ai_recommended_action`:** wypełniane przez Check-in Analyzer (AI task). Plan działa / mała korekta / większa korekta.

Osobno od tygodniowego check-inu istnieje jeszcze mini check-in po treningu dla `beginner_zero`. Nie mieszamy tych dwóch rzeczy w jednej tabeli, bo służą innym decyzjom.

---

## Grupa 12 — Sygnały behawioralne

**Tabele:** `behavior_signals`

**Po co:** realizacja uproszczonego „silnika monitoringu" z ADR-003. Nie ML, nie clustering — rolling liczniki i średnie per user, aktualizowane po każdym evencie.

**Użycie:** reguły pyta-dopytują patrzą na te liczniki. Przykłady:
- `meal_logs_per_day_7d < 1` → nie wprowadzamy strict tracking
- `workout_completion_rate_7d < 0.5` → nie progresujemy obciążeń
- `weight_log_regularity_score > 0.7` → możemy proponować automatyczną korektę kalorii
- `clarity_score_avg_7d < 4` albo `confidence_score_avg_7d < 3.5` → nie przechodzimy do kolejnej fazy `beginner_zero`
- `pain_flag_count_7d > 0` albo dużo `too_hard_flag_count_7d` → rekomendacja `slow_down`, `repeat_similar_session` lub `trainer_consultation`

**Jedna tabela z `user_id` jako PK** — zawsze jeden rekord na usera, update in-place. Bez historii (historia siedzi w eventach źródłowych).

---

## Grupa 13 — Pytania adaptacyjne

**Tabele:** `question_library`, `user_question_asks`

**Po co:** serce progressive profiling.

**`question_library`:** katalog wszystkich pytań, jakie Nudge może zadać. Każde pytanie ma:
- `field_key` — które pole profilu wypełnia
- `layer` — 1 minimum / 2 segment / 3 behavioral / 4 advanced
- `applicable_segments` — dla kogo pytanie ma sens
- `why_we_ask` i `how_to_measure` — copy pokazywane userowi
- `phrasing_options` — różne warianty wypowiedzi per ton (`calm_guided`, `warm_encouraging`, `partnering`, `factual_technical`)

**`user_question_asks`:** każda instancja zadania pytania. Zapisujemy, że zapytaliśmy, kiedy odpowiedział (albo pominął), jaki był priority_score w momencie zadania.

To jest **źródło do testowania „czy nasza logika wyboru pytań działa"**.

Po wdrożeniu `guided_beginner` pytania dla nowicjusza są też throttle'owane: najpierw doświadczenie użytkownika, potem pytanie o zrozumienie, bezpieczeństwo lub regenerację. Nie zasypujemy początkującego dodatkowymi pytaniami w krótkich odstępach.

---

## Grupa 14 — Coach (rozmowy)

**Tabele:** `coach_conversations`, `coach_messages`

**Po co:** realizacja AI Coach jako kontekstowego towarzysza (ADR feedback).

**`coach_conversations.entry_point`:** z jakiego miejsca usera wszedł (bąbelek globalny, skrót przy ćwiczeniu, skrót przy posiłku, check-in, proaktywny nudge, onboarding). To jest kluczowa metryka — zobaczymy, skąd naprawdę przychodzą rozmowy.

**`coach_messages`:**
- `intent` — klasyfikacja (pytanie_techniczne, dieta, motywacja, ból, inne) — przez osobny prompt.
- `guardrail_flagged` + `guardrail_reasons` — jeśli wiadomość wywołała guardrail (np. wykryty ból stawu), zapisujemy co i dlaczego.

---

## Grupa 15 — AI tasks, decyzje, koszty

**Tabele:** `ai_tasks`, `ai_decisions`, `llm_calls`, `prompts`, `safety_escalations`, `user_ai_usage`

**Po co:** cała warstwa obserwowalności i kosztów AI.

**`ai_tasks`:** kolejka zadań (generuj plan, analizuj zdjęcie, tygodniowy check-in, wybierz następne pytanie...). Z polami status i timestampami łatwo debugować „czemu ten plan się nie wygenerował".

**`ai_decisions`:** audyt decyzji warstwy reguł. Zapisujemy jakie reguły zadziałały, snapshot profilu w momencie decyzji, co rekomendowaliśmy, czy wykonano.

Po rozszerzeniu guided path `ai_decisions` ma jawny `recommendation_type`, a także `entry_path` i `adaptation_phase`. Dzięki temu da się odtworzyć, czy system zalecił np. `repeat_similar_session`, `show_more_guidance` albo `trainer_consultation` i w jakim trybie produktu to nastąpiło.

**`llm_calls`:** KAŻDE wywołanie LLM — model, tokens, cost USD, latency, prompt_version. To jest źródło do:
- monitoringu kosztów (alert gdy cost_per_active_user > $3/mc)
- A/B testów promptów
- debug produkcji

**`prompts`:** wersjonowane prompty (zgodnie z ADR-002). Kod odwołuje się do `slug + version`. Zmiana promptu = nowa wersja, nie edit.

**`safety_escalations`:** każda eskalacja (ADR-002). Dla audytu, raportowania, ewentualnych interakcji prawnych.

To tutaj zapisujemy czerwone flagi, które blokują progresję: ból w klatce piersiowej, zawroty głowy, nietypową duszność wysiłkową, promieniujący ból czy ostry ból stawu.

**`user_ai_usage`:** miesięczny licznik użycia per user. Do rate limiting (50 calls/dzień, 6 zdjęć/dzień) i reporting.

---

## Grupa 16 — Kontekstowe „po co / jak"

**Tabele:** `field_explanations`

**Po co:** realizacja Twojego wymogu „każda prośba o dane ma po co + jak to łatwo zmierzyć".

**Dlaczego osobna tabela, a nie kolumny w `question_library`:**
- te same pole może mieć różne explanations w różnych kontekstach (onboarding vs check-in)
- łatwiej lokalizować na inne języki (kolumna `locale`)
- copywriting iteruje się niezależnie od reszty schematu

**Przykład zapisu:**
```
field_key: "waist_cm"
locale: "pl-PL"
why_we_ask: "Waga może nie drgnąć, a pas tak — to lepszy wskaźnik postępu."
how_to_measure: "Taśmą krawiecką w wysokości pępka, rano na czczo. 10 sekund."
```

---

## Grupa 17 — Powiadomienia

**Tabele:** `notifications`

**Po co:** wszystko, co ma dotrzeć do usera (push, email, in-app).

**Typy:** workout_reminder, meal_reminder, checkin_due, plan_ready, coach_proactive_nudge, milestone, trial_reminder, re_engagement, subscription_renewal.

**Scheduling:** `scheduled_for` — worker (Inngest) zabiera wpisy z `scheduled_for <= now() AND sent_at IS NULL` i wysyła przez odpowiedni kanał.

**Anti-spam:** proaktywny coach maksymalnie raz na 3 dni — walidacja w regule przed insertem.

Dla `beginner_zero` powiadomienia mają wspierać, a nie dyscyplinować. Priorytet mają przypomnienia o prostym dzisiejszym kroku, spokojnym tempie, check-inie po treningu i komunikaty obniżające stres wejścia na siłownię.

---

## Grupa 18 — Eventy produktowe

**Tabele:** `product_events`

**Po co:** lokalny mirror tego, co lecimy do PostHog. Powód:
- niezależność od zewnętrznego narzędzia (backup),
- możliwość łączenia eventów z danymi domenowymi w SQL,
- retencja ≥ 1 rok (PostHog ma limity).

**Przykład użycia:** „pokaż mi userów, którzy zrobili onboarding, dodali 3+ zdjęcia, ale nie skończyli trial-a" — SQL join z `users`, `meal_logs`, `subscriptions` + filter na eventach.

Po wdrożeniu guided path mirrorujemy też eventy jakościowe, a nie tylko „twarde completion”. Przykłady: `guided_workout_started`, `guided_workout_completed`, `exercise_help_opened`, `exercise_marked_confusing`, `trainer_consultation_prompt_shown`, `confidence_improved`.

---

## Kolejność implementacji (dla sprintów)

**Sprint 1 (fundament, 1-2 tyg):**
Grupa 1 (auth, subscriptions), Grupa 2 (user_profile, user_profile_facts), Grupa 3 (body_measurements).

**Sprint 2 (onboarding, 2 tyg):**
Grupa 4 (equipment, preferences, health), Grupa 5 (goals), Grupa 13 (question_library + user_question_asks), Grupa 16 (field_explanations).

**Sprint 3 (plan treningowy, 2 tyg):**
Grupa 6 (exercises catalog — seedowane), Grupa 7 (training_plans z wersjonowaniem), Grupa 15 (ai_tasks, llm_calls, prompts).

**Sprint 4 (log treningu + product events, 2 tyg):**
Grupa 8 (workout_logs), Grupa 18 (product_events).

**Sprint 5 (check-in + sygnały + coach, 2 tyg):**
Grupa 11 (`checkin_sessions`), Grupa 12 (behavior_signals), Grupa 14 (coach_conversations).

**Sprint 6 (zdjęcia posiłków — MVP v1.5, 2-3 tyg):**
Grupa 10 (meal_logs, meal_images, meal_log_items, nutrition_daily_totals), wizja, guardrails zdjęciowe.

**Sprint 7 (notifications, safety, usage limits):**
Grupa 17 (notifications), reszta z Grupy 15 (safety_escalations, user_ai_usage), Grupa 4 (user_safety_flags — już wcześniej widoczne, ale pełna mechanika escalacji tu).

---

## Decyzje do rewizji później

- **Partycjonowanie tabel eventowych** (`product_events`, `llm_calls`, `user_profile_facts`) — gdy przekroczymy 10M wierszy.
- **Materialized views dla dashboardów** (`nutrition_daily_totals` już jest) — gdy check-iny zaczynają mielić dużo rekordów.
- **Separate read replica** dla analytics — po 5k aktywnych.
- **Timescale extension dla time-series** (waga, treningi) — rozważamy przy wykresach z dużą gęstością danych.
- **Full-text search po ćwiczeniach** — Postgres FTS wystarczy dla ~150-500 ćwiczeń; Elastic dopiero przy katalogu > 2000.
