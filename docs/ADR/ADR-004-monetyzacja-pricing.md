# ADR-004: Monetyzacja i pricing

- **Status:** Accepted
- **Data:** 2026-04-15
- **Decydent:** Bartek
- **Kontekst:** Nudge App — MVP v1

## Kontekst i problem

Nudge używa drogich wywołań LLM (szczególnie Vision dla zdjęć posiłków). Potrzebujemy modelu monetyzacji, który:

1. Pokrywa koszty API na każdego aktywnego usera
2. Nie odstrasza testerów na etapie walidacji tezy
3. Jest zgodny z normami premium w kategorii fitness/zdrowie
4. Daje rozsądny LTV i rozsądny CAC payback

Realny koszt LLM per active user = $1.50-$3.00/mc (zdjęcia × 3 dziennie + rozmowa + check-iny). Free tier → strata liniowa do liczby userów.

## Rozważane opcje

### Opcja A — Freemium (darmowa wersja ograniczona + premium)
**Za:** szeroki top-of-funnel, niski próg. **Przeciw:** w kategorii fitness 95% zostaje w free; koszty API per free user rosną; churn z free do premium <3%; „darmowa apka fitness" to zatłoczona półka gdzie wyróżnienie jest trudne.

### Opcja B — Jednorazowy zakup ($50-80)
**Za:** prostota. **Przeciw:** nie pokrywa kosztów LLM które rosną z czasem użytkowania; userzy oczekują updatów; trudno na tym zbudować firmę.

### Opcja C — 7-dniowy trial z kartą → subskrypcja
**Za:** wysoka konwersja trial→paid (~50-60%). **Przeciw:** wpisywanie karty to bariera psychologiczna; top-of-funnel 3-5× węższy.

### Opcja D — 7-dniowy trial bez karty → subskrypcja ✅
**Za:** szeroki top-of-funnel, demo pozwala zbudować engagement PRZED decyzją o płatności. **Przeciw:** konwersja niższa (~15-25%), ale przy szerokim topie matematyka działa.

### Opcja E — Lifetime deal
**Przeciw:** zabija LTV, przyciąga niewłaściwy segment, niemożliwy do obronienia przy kosztach LLM.

## Decyzja

Wybieramy **Opcję D** z następującą strukturą:

### Struktura pricingu

**Trial**
- 7 dni bez karty
- Pełna funkcjonalność, żadnych ograniczeń feature'owych
- Dzienny soft limit na AI: 50 wywołań, 6 zdjęć (te same co w produkcyjnym — chcemy, żeby user doświadczył realnej apki, nie okrojonej)
- 2 przypomnienia emailem: dzień 4 („oto co już wiemy o Tobie") i dzień 7 („kontynuuj z planem")
- Po 7 dniach: hard paywall, dane zachowane, dostęp tylko do read-only profilu i historii

**Subskrypcja**
- Monthly: **49 PLN / mc** (~$11)
- Yearly: **349 PLN / rok** (~$79) — 41% taniej niż monthly
- Brak tańszego tieru; jest jedna dobra apka za jedną cenę

**Dlaczego te ceny:**
- Fitbod, MacroFactor, Freeletics: $10-15/mc → Nudge lekko poniżej przy monthly, konkurencyjnie przy yearly
- PLN → iOS/Android: RevenueCat auto-local pricing, ale baseline w PLN dla rynku PL

### Regiony i cennik

Start: **Polska i region CEE**.
- Polska, Czechy, Słowacja, Węgry: ceny w PLN/CZK/HUF via RevenueCat
- Globalny: USD $11/mc, $79/rok

Lokalizacja cennika na bazie RevenueCat price tiers — nie definiujemy ręcznie cen per kraj.

### Mechanizmy retencji

**A. Roczny plan z silnym rabatem (41%)**
- Buforuje decyzję o churnie do 12 miesięcy
- Poprawia cash flow
- Sygnalizuje userowi, że to nie jest „apka na tydzień"

**B. Pauza subskrypcji zamiast kasowania**
- „Wracasz za miesiąc? Wstrzymaj subskrypcję na 30/60/90 dni. Trzymamy Twoje dane."
- MacroFactor pokazał że to zmniejsza net churn o ~20%

**C. Reaktywacja po 60 dniach**
- Email z personalizowanym podsumowaniem („Twój ostatni progres: -2.3 kg, 14 treningów. Wróć.")
- 30% zniżki na pierwszy miesiąc powrotu

**D. Yearly renewal reminder**
- 14 dni przed odnowieniem — email z podsumowaniem progresu z całego roku
- Działa psychologicznie: widzisz wartość, którą dostałeś

### Anti-abuse

- Trial 1× per email + per device fingerprint
- Wykrywanie refund abuse (pattern: subscribe → use heavily → refund) — flag i ban
- Rate limits z ADR-002 dotyczą wszystkich, też trial

### Tego NIE robimy

- **Reklamy** — kolidują z premium pozycjonowaniem, irytują w apce zdrowotnej
- **Referral z darmowymi miesiącami** — przed PMF to rozpraszacz, nie ruch. Rozważymy w fazie 3.
- **Lifetime deal** — zabija LTV
- **Freemium** — ekonomia się nie zgadza przy kosztach LLM
- **Cheaper basic tier** — psuje komunikat „jedna dobra apka"

### Metryki, które śledzimy od dnia 1

- **Trial start rate** — % ściągnięć, które dotarły do trial starta (oczekiwany baseline: 40%)
- **Trial→paid conversion** — % trial, które konwertują na płatność (cel: ≥ 15%, dobry: ≥ 20%)
- **Monthly churn** — % subskrybentów, którzy odpadli (target: < 7%)
- **Yearly renewal rate** — % rocznych, którzy się odnowili (target: > 60% w pierwszym roku)
- **LTV / CAC** — oczekiwany LTV @ 15% monthly churn = ~$70 dla monthly, ~$130 dla yearly
- **Cost per active user** — koszt LLM + hosting / active users. Alert: > $3/mc
- **Active users per segment** — czy pricing konwertuje wszystkie segmenty równo

### Ekonomia — zdroworozsądkowe modelowanie

Założenia (ostrożne):
- 1000 trial startów miesięcznie
- 18% konwersja trial→paid = 180 nowych subskrybentów
- 50/50 split monthly/yearly
- 7% monthly churn

Po 6 miesiącach w steady state:
- ~1100 aktywnych płacących
- MRR: ~40k PLN (~$9k)
- COGS (LLM + hosting): ~$3.3k
- Gross margin: ~63%

Te liczby są hipotezą. Real kalibracja po pierwszych 3 miesiącach.

## Konsekwencje

### Pozytywne
- Matematyka pokrywa koszty API z marginesem
- Trial bez karty buduje szeroki top-of-funnel
- Brak freemium → nie musimy utrzymywać dwóch produktów
- Rok z rabatem → kapitał w kieszeni i niższy churn

### Negatywne / koszty
- Bariera płatności po 7 dniach → część userów odpadnie, nawet jeśli produkt jest dobry — musimy bardzo dobrze domknąć trial
- Niższa konwersja niż z kartą przy trialu → potrzebujemy szerokiego topu (marketing, content, SEO)
- Brak free tier → brak virality typowej dla darmowych apek

### Ryzyka i mitigacja
- **Ryzyko:** konwersja trial→paid < 10% i nie opłaca się budować produktu. **Mitigacja:** weekly review konwersji; jeśli < 10% po 3 miesiącach → zmiana onboardingu, dodanie dnia 5 insightu „o Tobie", testy cenowe.
- **Ryzyko:** koszty LLM rosną szybciej niż przychody. **Mitigacja:** alerty budżetowe; kompresja zdjęć; cache; w ostateczności — self-hosted Llama dla prostych wywołań.
- **Ryzyko:** App Store / Play zabiorą 30% → kanibalizuje marżę. **Mitigacja:** push userów na web (PWA w fazie 1 zostaje jako kanał tańszy niż native stores), yearly plan częściej przez web, app stores tylko jako kanał akwizycji.

## Decyzje do rewizji później

- Family plan (2-4 userów) — rozważamy w v2, jeśli pojawi się sygnał popytu
- Gift subscriptions — okazjonalnie przy świętach
- B2B / employer wellness — osobny track, dopiero po PMF w B2C
- Lokalne ceny per kraj poza CEE — via RevenueCat, ale bez ręcznego tuningu w fazie 1
