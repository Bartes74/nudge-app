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
- `zero` — nigdy nie ćwiczył regularnie; nie zna żadnych ćwiczeń z nazwy
- `beginner` — < 6 miesięcy nieregularnej aktywności; zna podstawowe ćwiczenia
- `amateur` — regularnie trenuje > 6 miesięcy, ale bez systematycznego planu
- `advanced` — rozumie pojęcia: split, objętość, progresja, RPE/RIR

Klasyfikacja opiera się na 2-3 pytaniach w onboardingu, nie na samoocenie (ludzie systematycznie przeceniają/niedoceniają swój poziom).

### Oś 2 — Główny cel (`primary_goal`)

Cztery cele:
- `weight_loss` — redukcja masy ciała
- `muscle_building` — budowa masy / sylwetki
- `strength_performance` — siła, sprawność, performance sportowy
- `general_health` — zdrowie, kondycja, „chcę się lepiej ruszać" (bardzo częste u 40+)

### Segmenty aktywne

Teoretycznie 4 × 4 = 16 kombinacji. Realnie aktywujemy na start **8 priorytetowych**:

1. `zero × general_health`
2. `zero × weight_loss`
3. `beginner × weight_loss`
4. `beginner × muscle_building`
5. `beginner × general_health`
6. `amateur × weight_loss`
7. `amateur × muscle_building`
8. `advanced × muscle_building`

Dla pozostałych kombinacji używamy najbliższego segmentu + modyfikatorów (patrz niżej). Po 3-6 miesiącach produkcji dane pokażą, które kombinacje warto wyodrębnić osobno.

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
  experience_level      enum
  primary_goal          enum
  gender                enum
  age_bucket            enum   (derived from birth_date)
  life_context          text[]
  dietary_constraints   text[]
  guardrail_flags       jsonb  (z ADR-002)
```

Funkcje w `@nudge/core/rules/` dostają cały obiekt profilu i zwracają decyzje. **Nigdy nie piszemy `if segment === "beginner_weight_loss_woman"`** — to prowadzi do eksplozji warunków. Piszemy małe reguły, które patrzą na konkretne pola.

Przykład:
```typescript
function shouldSkipMacroDetails(profile: UserProfile): boolean {
  return profile.experience_level === 'zero' 
      || profile.experience_level === 'beginner'
      || profile.guardrail_flags.ed_risk_flag === true;
}
```

### Ton komunikacji per segment

Każdy segment ma swój preset tonu (definiowany w `@nudge/core/prompts/tone.ts`):

- `zero`: bardzo ciepły, dużo zachęty, zero żargonu, krótkie wiadomości, „super, że tu jesteś"
- `beginner`: ciepły, tłumaczący, definicje przy nowych pojęciach
- `amateur`: partnerski, pokazujemy „dlaczego" za decyzjami
- `advanced`: rzeczowy, skracamy preambuły, używamy terminologii (RIR, objętość, MRV)

Ton wpływa też na styl pytań — nowicjuszowi mówimy „ile razy w tygodniu realnie możesz ćwiczyć?", zaawansowanemu „jaka jest Twoja typowa objętość na grupę mięśniową?".

### Pytania per segment — zasada

Dla każdego segmentu (8 aktywnych) mamy zdefiniowane **priorytety pytań w warstwie 2**. Warstwa 1 (minimum startowe) jest wspólna dla wszystkich.

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
- **Ryzyko:** user źle sam siebie klasyfikuje. **Mitigacja:** pytania behawioralne zamiast samooceny; przykład: zamiast „oceń swój poziom 1-5" pytamy „czy robiłeś/aś kiedyś martwy ciąg ze sztangą?".
- **Ryzyko:** pewne segmenty mają znikomą liczbę userów i nie opłaca się im dedykować treści. **Mitigacja:** metryka "active users per segment" w dashboardzie od dnia 1; jeśli segment < 5% userów przez 3 miesiące, scalamy.
- **Ryzyko:** flagi modyfikatorów kolidują ze sobą (np. `pregnancy_flag` + cel `weight_loss`). **Mitigacja:** guardrails z ADR-002 mają priorytet nad segmentami; dokumentacja precedencji.

## Decyzje do rewizji później

- Dokładne ścieżki pytań per segment — osobny dokument (krok następny po ADR-ach)
- Możliwość user-override segmentu po onboardingu — decyzja po pierwszych testach
- Dodanie 9. i 10. segmentu dla kombinacji `advanced × weight_loss` i `amateur × general_health` jeśli dane to uzasadnią
