# ADR-003: Model segmentacji użytkowników

- **Status:** Accepted
- **Data:** 2026-04-15
- **Decydent:** Bartek
- **Kontekst:** Nudge App — MVP v1

## Kontekst i problem

Aplikacja musi traktować totalnego nowicjusza, regularnego amatora i zaawansowanego zawodnika różnie — w pytaniach, w planie, w tonie komunikacji. Jednocześnie nie mamy na start danych do ML-owej segmentacji. Musimy zdecydować:

1. Ile jest segmentów, i po czym je ciąć?
2. Jak ten model segmentacji wpływa na logikę aplikacji bez kombinatoryjnej eksplozji?
3. Co jest segmentem, a co modyfikatorem?

Wstępna propozycja 3-4 segmentów została uznana za za małą — brak uwzględnienia różnic płciowych, wiekowych i kontekstu życiowego.

## Rozważane opcje

### Opcja A — Jednowymiarowa segmentacja (3-4 segmenty)
**Za:** prostota, szybki start. **Przeciw:** tracimy krytyczne różnice (np. beginner-redukcja-kobieta-40+ ≠ beginner-redukcja-mężczyzna-25).

### Opcja B — ML clustering od dnia 1
**Przeciw:** zero danych, niemożliwe.

### Opcja C — Dwuosiowa segmentacja + flagi modyfikatorów ✅
Dwie osie dające klasyczne segmenty + kilka flag modyfikujących zachowanie bez tworzenia osobnego segmentu.

## Decyzja

Wybieramy **Opcję C**.

### Oś 1 — Doświadczenie treningowe (`experience_level`)

Cztery poziomy:
- `beginner_zero` — brak regularnych treningów w ostatnich 12 miesiącach albo odpowiedź „dopiero zaczynam”; dostaje osobną ścieżkę guided
- `beginner` — wraca po dłuższej przerwie albo zna podstawy, ale potrzebuje spokojnego wejścia bez guided mode jako domyślnego UI
- `intermediate` — regularnie trenuje albo zna podstawy i potrzebuje planu, nie oswojenia z siłownią
- `advanced` — rozumie pojęcia: split, objętość, progresja, RPE/RIR; ten poziom pozostaje wspierany, ale nie jest nadawany z lekkiego onboardingu L1

Klasyfikacja opiera się na neutralnych pytaniach faktograficznych, bezpiecznej samoocenie i regułach inferencji. L1 onboarding nie pyta nowicjusza o wiedzę treningową ani pytania zawstydzające.

### Oś 2 — Główny cel (`primary_goal`)

Cztery cele:
- `weight_loss` — redukcja masy ciała
- `muscle_building` — budowa masy / sylwetki
- `strength_performance` — siła, sprawność, performance sportowy
- `general_health` — zdrowie, kondycja, „chcę się lepiej ruszać" (bardzo częste u 40+)

### Segmenty aktywne

Teoretycznie 4 × 4 = 16 kombinacji. Realnie aktywujemy na start **8 priorytetowych**:

1. `beginner_zero × general_health`
2. `beginner_zero × weight_loss`
3. `beginner × general_health`
4. `beginner × weight_loss`
5. `beginner × muscle_building`
6. `intermediate × weight_loss`
7. `intermediate × muscle_building`
8. `advanced × muscle_building`

Dla pozostałych kombinacji używamy najbliższego segmentu + modyfikatorów (patrz niżej). Po 3-6 miesiącach produkcji dane pokażą, które kombinacje warto wyodrębnić osobno.

### Dodatkowe pola sterujące ścieżką startową

Poza samym segmentem wprowadzamy trzy pola, które sterują zachowaniem produktu:

- `entry_path` — `guided_beginner` albo `standard_training`
- `adaptation_phase` — `phase_0_familiarization`, `phase_1_adaptation`, `phase_2_foundations`
- `needs_guided_mode` — czy user powinien domyślnie dostać uproszczony, krok-po-kroku interfejs

`beginner_zero` nie jest wariantem zwykłego planu siłowego. To osobna ścieżka produktowa z neutralnym onboardingiem, własnym generatorem planu, widokiem `Today Guided Workout` i progresją jakościową opartą o zrozumienie, pewność siebie i bezpieczeństwo.

### Flagi modyfikatorów

Flagi NIE tworzą nowych segmentów — modyfikują pytania, ton, priorytety i guardrails w ramach istniejącego segmentu.

**A. `gender` (enum: `female`, `male`, `other`, `prefer_not_to_say`)**
- Kobiety: wyższy priorytet obwodu bioder/pasa niż samej wagi; pytania o cykl miesiączkowy (opcjonalne); unikamy mitu „zmęsnienia"; inne wzorce BMR.
- Mężczyźni: wyższy priorytet klatki/ramion; częściej ego-lifting → guardrails na tempo progresji; inne wzorce BMR.
- Other / prefer_not_to_say: domyślnie używamy uśrednionego BMR + neutralnych pytań; user może doprecyzować w ustawieniach.

**B. `age_bucket` (enum: `under_25`, `25_40`, `40_55`, `55_plus`)**
- `under_25`: szybsza regeneracja, wyższa tolerancja objętości, prostszy plan wystarcza.
- `25_40`: baseline produktu.
- `40_55`: większy nacisk na mobilność, dłuższe rozgrzewki, łagodniejsza progresja.
- `55_plus`: priorytet: siła funkcjonalna, równowaga, unikanie high-impact; obowiązkowy disclaimer medyczny.

**C. `life_context[]` (multi-select, zbierane kontekstowo)**

Nie w onboardingu — zbierane z jednego pytania w warstwie 2: „Co najbardziej komplikuje Ci regularne ćwiczenia?"
- `parent_young_kids` — krótsze sesje, treningi domowe, elastyczność czasowa
- `shift_work` — nieregularne godziny, plan niezależny od dnia tygodnia
- `frequent_travel` — treningi hotelowe, minimalny sprzęt
- `sedentary_job` — nacisk na postawę, mobilność, przerwy
- `physical_job` — uwzględniamy zmęczenie, regeneracja priorytetem

**D. `dietary_constraints[]` (multi-select, zbierane w pytaniach żywieniowych)**
- `vegetarian`, `vegan`, `gluten_free`, `lactose_free`, `kosher`, `halal`, `allergy_*`
- Wpływa na propozycje posiłków i suplementację

**E. Guardrail flags (automatyczne, z ADR-002)**
- `underage_flag`, `pregnancy_flag`, `medical_condition_flag`, `ed_risk_flag`, itd.
- Te flagi mają priorytet ponad segmentami — odcinają pewne rekomendacje niezależnie od segmentu.

### Jak to implementujemy w bazie

Zamiast jednego pola `segment` mamy:

```sql
user_profile:
  experience_level                    enum
  primary_goal                        enum
  gender                              enum
  age_bucket                          enum   (derived from birth_date lub age_years)
  life_context                        text[]
  dietary_constraints                 text[]
  entry_path                          enum
  adaptation_phase                    enum
  needs_guided_mode                   boolean
  inferred_beginner_status            boolean
  inferred_beginner_reason_codes      text[]
  trainer_consultation_recommended_at timestamptz
  trainer_consultation_completed_at   timestamptz
```

Flagi bezpieczeństwa i eskalacje nie siedzą w jednym blobie JSON. Trzymamy je jawnie w `user_safety_flags` i `safety_escalations`.

Funkcje w `@nudge/core/rules/` dostają cały obiekt profilu i zwracają decyzje. **Nigdy nie piszemy `if segment === "beginner_weight_loss_woman"`** — to prowadzi do eksplozji warunków. Piszemy małe reguły, które patrzą na konkretne pola.

Przykład:
```typescript
function shouldHideTrainingJargon(profile: UserProfile): boolean {
  return profile.experience_level === 'beginner_zero'
      || profile.needs_guided_mode === true
      || profile.experience_level === 'beginner';
}
```

### Ton komunikacji per segment

Każdy segment ma swój preset tonu (definiowany w `@nudge/core/prompts/tone.ts`):

- `beginner_zero` (`calm_guided`): prosty, spokojny, nieoceniający, bardzo konkretny, bez żargonu, krok po kroku
- `beginner` (`warm_encouraging`): ciepły, tłumaczący, definicje przy nowych pojęciach
- `intermediate` (`partnering`): partnerski, pokazujemy „dlaczego" za decyzjami
- `advanced` (`factual_technical`): rzeczowy, skracamy preambuły, używamy terminologii (RIR, objętość, MRV)

Ton wpływa też na styl pytań. Dla `beginner_zero` pytamy: „ile razy w tygodniu realnie możesz ćwiczyć?" i „kiedy ostatnio ruszałeś/aś się regularnie?". Dla poziomów wyższych możemy pytać bardziej technicznie.

### Pytania per segment — zasada

Dla każdego segmentu (8 aktywnych) mamy zdefiniowane **priorytety pytań w warstwie 2**. Warstwa 1 jest wspólna tylko częściowo: dla `beginner_zero` onboarding L1 jest neutralny, faktograficzny i nie wymaga znajomości sprzętu ani terminologii.

Dla `guided_beginner` pytania warstwy 2 pojawiają się po doświadczeniu użytkownika, a nie przed nim. Priorytet mają bezpieczeństwo, regeneracja, zrozumienie planu i pewność siebie. Optymalizacja jest wtórna.

Konkretne ścieżki pytań rozpisujemy w osobnym dokumencie — tutaj tylko decyzja architektoniczna.

### Migracja do ML-segmentacji (faza 2/3)

Po zebraniu 3-6 miesięcy danych produkcyjnych (≥ 2000 aktywnych userów z pełnym onboardingiem):
1. Clustering na kombinacji cech (experience, goal, gender, age, life_context) + zachowań (completion rate, churn, typy pytań).
2. Porównujemy wynikowe clustery z naszymi ręcznymi segmentami.
3. Jeśli dane pokazują inne naturalne grupy — aktualizujemy segmenty.

## Konsekwencje

### Pozytywne
- Elastyczność bez kombinatoryjnej eksplozji — reguły patrzą na konkretne pola, nie na kombinacje
- Realistyczny zakres dla MVP (8 segmentów × warstwa pytań, nie 16)
- Flagi life_context pozwalają personalizować bez tworzenia 50 segmentów
- Gotowy do migracji do ML, gdy będą dane

### Negatywne / koszty
- 8 segmentów × treści (pytania, ton, szablony planów) = sporo pracy copywriterskiej/contentowej
- Reguły muszą być testowane dla każdej kombinacji — większa macierz testów
- Ryzyko, że 8 segmentów to wciąż za dużo lub za mało — zweryfikujemy po pierwszych 100 userach

### Ryzyka i mitigacja
- **Ryzyko:** user źle sam siebie klasyfikuje. **Mitigacja:** samoocena jest tylko jednym z sygnałów; o kwalifikacji decydują też historia regularnej aktywności, wiek, BMI i safety screening.
- **Ryzyko:** pewne segmenty mają znikomą liczbę userów i nie opłaca się im dedykować treści. **Mitigacja:** metryka "active users per segment" w dashboardzie od dnia 1; jeśli segment < 5% userów przez 3 miesiące, scalamy.
- **Ryzyko:** flagi modyfikatorów kolidują ze sobą (np. `pregnancy_flag` + cel `weight_loss`). **Mitigacja:** guardrails z ADR-002 mają priorytet nad segmentami; dokumentacja precedencji.

## Decyzje do rewizji później

- Dokładne ścieżki pytań per segment — osobny dokument (krok następny po ADR-ach)
- Możliwość user-override segmentu po onboardingu — decyzja po pierwszych testach
- Dodanie 9. i 10. segmentu dla kombinacji `advanced × weight_loss` i `intermediate × general_health` jeśli dane to uzasadnią
