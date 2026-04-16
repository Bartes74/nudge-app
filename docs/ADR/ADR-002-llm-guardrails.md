# ADR-002: Strategia LLM i guardrails

- **Status:** Accepted
- **Data:** 2026-04-15
- **Decydent:** Bartek
- **Kontekst:** Nudge App — MVP v1

## Kontekst i problem

Nudge używa LLM w wielu miejscach (rozmowa, interpretacja pytań, analiza zdjęć, podsumowania check-inów). Produkt dotyczy zdrowia — kontuzji, diety, ciała. Bez jasnej strategii LLM i guardrails mamy trzy realne zagrożenia:

1. **Halucynacje medyczne** — LLM mówi usere „to nic poważnego, ćwicz dalej” o bólu kolana, który jest uszkodzeniem więzadła.
2. **Niebezpieczne rekomendacje** — 900 kcal dziennie dla osoby z objawami zaburzenia odżywiania.
3. **Niekontrolowane koszty** — free-form chat bez limitów, 3 zdjęcia dziennie × 10k userów × $0.03 = realny rachunek.

Potrzebujemy strategii, która jednocześnie daje ciepły, ludzki coach i twarde bariery bezpieczeństwa.

## Decyzja

### 1. Podział odpowiedzialności: LLM vs reguły

**LLM robi:**
- rozmowę, wyjaśnienia, empatyczne odpowiedzi
- interpretację niepełnych wypowiedzi usera
- generowanie pytań w ludzkim tonie (z kandydatów dostarczonych przez reguły)
- analizę zdjęć posiłków (z Structured Outputs)
- podsumowania check-inów i progresu

**Reguły (czyli deterministyczny kod w `@nudge/core`) robią:**
- wszystkie liczby: BMR, TDEE, kalorie, makro, objętość, progresja
- walidację bezpieczeństwa (guardrails)
- wersjonowanie planu i decyzje o korektach
- wybór NASTĘPNEGO pytania (priorytet; LLM tylko formułuje je po ludzku)

**Zasada:** jeśli coś można policzyć wzorem albo sprawdzić regułą — NIE pytamy LLM. LLM nie liczy makro. LLM nie decyduje o deficycie. LLM nie klasyfikuje ryzyka zdrowotnego.

### 2. Wybór dostawcy i modeli

- **Primary:** OpenAI
  - GPT-4o-mini — wszystko konwersacyjne (80% wywołań), tanie
  - GPT-4o — Vision (zdjęcia posiłków), structured outputs dla planu
- **Abstrakcja:** cały kod używa `llmClient` z `@nudge/core/llm`, który ma interfejs dostawcy. Nie piszemy nigdzie `openai.chat.completions.create` bezpośrednio w apps.
- **Backup:** Anthropic Claude jako fallback dla Vision w razie outage'u OpenAI; łatwa zmiana dostawcy jeśli pricing się zmieni.

### 3. Structured Outputs jako obowiązek

Każde wywołanie LLM, które ma zwrócić dane do logiki aplikacji, MUSI używać JSON Schema (OpenAI Structured Outputs lub równoważnik u innego dostawcy). Free-form tekst dopuszczamy WYŁĄCZNIE dla wiadomości pokazywanych userowi w chacie.

Przykłady:
- Analiza zdjęcia → schema z polami `ingredients_detected[]`, `kcal_min`, `kcal_max`, `confidence`, `user_warnings[]`
- Wybór kolejnego pytania → schema z polami `field_id`, `rationale`, `phrasing_options[]`
- Klasyfikacja check-inu → schema z polami `progress_status`, `recommended_action`, `red_flags[]`

### 4. Wersjonowanie promptów

Prompty siedzą w `packages/core/prompts/` jako stałe z numerem wersji. Każda zmiana promptu = nowy numer wersji + commit. Logujemy `prompt_version` przy każdym wywołaniu, żeby dało się odtworzyć decyzję.

### 5. Guardrails — warstwa bezpieczeństwa

Guardrails to **osobna warstwa**, nie część Training/Nutrition Planner. Każda rekomendacja, każda odpowiedź chatu i każdy nowy plan przechodzi przez nią przed dotarciem do usera.

#### Kategorie guardrails

**A. Guardrails danych wejściowych (gdy user coś wpisuje)**

Flagi wyzwalane przez wzorce w danych:
- `low_calorie_intake_flag` — kcal < 1200 dla kobiet / 1500 dla mężczyzn przez 7+ dni
- `rapid_weight_loss_flag` — > 1% masy ciała tygodniowo przez 3+ tygodnie
- `injury_mention_flag` — detekcja słów kluczowych: ból, strzykanie, opuchlizna, trzask, drętwienie
- `ed_risk_flag` — wzorce wskazujące na zaburzenia odżywiania (obsesyjne logowanie, ekstremalne ograniczenia, słownictwo)
- `medical_condition_flag` — cukrzyca, nadciśnienie, ciąża, choroby tarczycy, leki
- `underage_flag` — wiek < 18
- `pregnancy_flag` — samodeklaracja lub wzorzec pytań

**B. Guardrails wyjść LLM (przed pokazaniem userowi)**

Każda odpowiedź LLM jest filtrowana:
- nie zawiera stwierdzeń medycznych bez disclaimera („to nie jest porada medyczna, skonsultuj z lekarzem/fizjoterapeutą")
- nie zawiera konkretnych dawek leków ani suplementów
- nie diagnozuje („masz kontuzję stożka rotatorów" → zabronione; „to brzmi na temat, który warto skonsultować z fizjoterapeutą" → OK)
- nie schlebia niebezpiecznym celom („chcę schudnąć 10 kg w miesiąc" → przekierowanie, nie wsparcie)

**C. Guardrails rekomendacji planu**

Twarde limity, poniżej/powyżej których plan nie zostaje wydany:
- minimum 1200 kcal dla kobiet, 1500 dla mężczyzn (niższe wymagają user override z ostrzeżeniem)
- max deficyt 25% TDEE
- max przyrost masy treningowej tygodniowo: 10% (dla początkujących)
- minimum 1 dzień regeneracji między intensywnymi sesjami

#### Eskalacja

Gdy guardrail flaguje sytuację poważną (ED risk, kontuzja, ciąża, nieletni):
1. Coach nie generuje planu i nie udziela porady
2. Komunikat: „To ważne, żebyś pogadał/a z [lekarzem / fizjoterapeutą / dietetykiem klinicznym]. Nudge nie zastąpi specjalisty w tym obszarze."
3. Link do bazy zasobów (później: krajowe telefony zaufania, wytyczne WHO)
4. Event logowany do `safety_escalations` table dla późniejszego audytu

### 6. Koszty i limity

- Rate limit per-user: 50 wywołań LLM / dzień (soft; powyżej → friendly komunikat „porozmawiamy jutro")
- Zdjęcia: max 6 per dzień, kompresja do 512px przed wysyłką
- Cache odpowiedzi: te same pytania o ćwiczenia (np. „jak zrobić martwy ciąg") cachujemy per-prompt-version, wygasza po 30 dniach
- Budget alert: cost per active user > $2/mc → alert do założyciela

### 7. Wiadomości pokazywane userowi przy guardrail

Każdy komunikat „stop" musi:
- mieć ludzki ton (nie urzędowy)
- wyjaśniać DLACZEGO („chcemy, żebyś był/a bezpieczny/a")
- proponować następny krok (gdzie się udać)
- nie zawstydzać

Copy do tych komunikatów pisane z pomocą `design:ux-copy` w osobnej iteracji.

## Konsekwencje

### Pozytywne
- Wyraźny podział odpowiedzialności → łatwiejszy debug i testy
- Guardrails jako osobna warstwa → łatwa do rozszerzania bez dotykania planerów
- Structured outputs → testowalne wywołania, stabilna struktura danych
- Abstrakcja dostawcy → nie jesteśmy uwięzieni w OpenAI

### Negatywne / koszty
- Więcej kodu niż „zapytaj LLM i pokaż odpowiedź" — realnie każde wywołanie AI ma ~3 warstwy
- Utrzymanie guardrails wymaga pracy z trenerem, dietetykiem klinicznym, potencjalnie psychologiem ED — zanim wejdziemy na rynek
- Structured outputs kosztują trochę więcej tokenów niż free-form

### Ryzyka i mitigacja
- **Ryzyko:** guardrails są za agresywne i frustrują userów. **Mitigacja:** A/B testujemy wiadomości guardrail; PostHog event na każdą blokadę; raz w miesiącu review listy eskalacji.
- **Ryzyko:** LLM wciąż halucynuje mimo Structured Outputs. **Mitigacja:** walidatory w kodzie na wyjściu LLM; nigdy nie przekazujemy odpowiedzi LLM bezpośrednio do usera bez przejścia przez copy template.
- **Ryzyko:** zmiana modelu OpenAI psuje prompty. **Mitigacja:** evals dla najważniejszych 10 scenariuszy, odpalane przed każdym upgrade modelu.

## Decyzje do rewizji później

- Czy przejść częściowo na self-hosted model (Llama) dla tańszych wywołań — po osiągnięciu 5k aktywnych userów
- Czy zatrudnić konsultanta medycznego/psychologa do review guardrails — TAK, przed publicznym launchem
- Warstwa RAG z wewnętrzną bazą wiedzy treningowej — rozważamy w v2
