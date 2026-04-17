-- =============================================================
-- Seed: question_library — Layer 2 Segment (~30 questions)
-- Areas: training (8), diet (8), sleep (7), life (7)
-- =============================================================

INSERT INTO question_library (
  id, field_key, layer,
  applicable_segments, applicable_goals,
  priority_base,
  why_we_ask, how_to_measure,
  answer_type, answer_options,
  blocks_if_unanswered, expected_time_seconds,
  phrasing_options, is_active
) VALUES

-- =============================================================
-- TRAINING (8)
-- =============================================================

-- T1: Preferred workout time
(
  gen_random_uuid(), 'preferred_workout_time', 'layer_2_segment',
  NULL, NULL,
  70,
  'Trening o preferowanej porze zwiększa regularność i jakość sesji — dostosujemy powiadomienia i plan.',
  'Kiedy najczęściej trenujesz lub chciałbyś trenować?',
  'single_select',
  '{"options": [
    {"value": "morning",   "label": "Rano (6-10)"},
    {"value": "midday",    "label": "W południe (10-14)"},
    {"value": "afternoon", "label": "Popołudniu (14-18)"},
    {"value": "evening",   "label": "Wieczorem (18-22)"},
    {"value": "flexible",  "label": "Różnie — nie mam stałej pory"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Kiedy lubisz trenować?", "factual_technical": "Preferowana pora treningów."}',
  true
),

-- T2: Session duration preference
(
  gen_random_uuid(), 'session_duration_minutes', 'layer_2_segment',
  NULL, NULL,
  72,
  'Długość sesji determinuje objętość i dobór ćwiczeń. Nie tworzymy planu na 2h, jeśli masz 45 minut.',
  'Ile czasu realnie masz na trening (wliczając rozgrzewkę i schłodzenie)?',
  'single_select',
  '{"options": [
    {"value": 30,  "label": "Do 30 minut"},
    {"value": 45,  "label": "30-45 minut"},
    {"value": 60,  "label": "45-60 minut"},
    {"value": 90,  "label": "60-90 minut"},
    {"value": 120, "label": "Powyżej 90 minut"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Ile czasu masz na trening?", "factual_technical": "Czas dostępny na sesję [min]."}',
  true
),

-- T3: Cardio attitude
(
  gen_random_uuid(), 'cardio_preference', 'layer_2_segment',
  NULL, '{"goals": ["weight_loss", "general_health", "strength_performance"]}',
  65,
  'Stosunek do cardio wpływa na to, jak dużo i jakiego cardio wkomponujemy w plan.',
  'Wybierz to, co najbliżej opisuje Twój stosunek do ćwiczeń aerobowych.',
  'single_select',
  '{"options": [
    {"value": "hate",      "label": "Nie lubię — wolę unikać"},
    {"value": "tolerate",  "label": "Toleruję, jeśli trzeba"},
    {"value": "ok",        "label": "Jest OK — nie mam nic przeciwko"},
    {"value": "enjoy",     "label": "Lubię — chętnie to robię"},
    {"value": "love",      "label": "Uwielbiam — to mój ulubiony rodzaj ruchu"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Jak czujesz się z cardio?", "factual_technical": "Preferencja ćwiczeń aerobowych."}',
  true
),

-- T4: Training split preference
(
  gen_random_uuid(), 'training_split_preference', 'layer_2_segment',
  NULL, '{"goals": ["muscle_building", "strength_performance"]}',
  60,
  'Osoby z doświadczeniem często mają preference do konkretnego podziału tygodnia treningowego.',
  'Jeśli masz preferencję — powiedz nam. Jeśli nie wiesz — zostaw na „Nudge zadecyduje".',
  'single_select',
  '{"options": [
    {"value": "full_body",        "label": "Full body — całe ciało na każdym treningu"},
    {"value": "upper_lower",      "label": "Upper/Lower — góra i dół zamiennie"},
    {"value": "push_pull_legs",   "label": "Push/Pull/Legs — klasyczny split"},
    {"value": "body_part",        "label": "Body part split — jeden mięsień / trening"},
    {"value": "no_preference",    "label": "Nudge zadecyduje — ufam algorytmowi"}
  ]}',
  false, 15,
  '{"warm_encouraging": "Masz ulubiony podział tygodnia treningowego?", "factual_technical": "Preferencja splitu treningowego."}',
  true
),

-- T5: Progressive overload awareness
(
  gen_random_uuid(), 'progressive_overload_awareness', 'layer_2_segment',
  NULL, '{"goals": ["muscle_building", "strength_performance"]}',
  55,
  'Świadomość progresji to kluczowy czynnik długoterminowych wyników. Dostosujemy poziom edukacji.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "no",         "label": "Nie wiem, co to jest"},
    {"value": "heard",      "label": "Słyszałem/am, ale nie stosuję"},
    {"value": "sometimes",  "label": "Staram się, ale nie śledzę systematycznie"},
    {"value": "yes",        "label": "Tak — zapisuję ciężary i stopniowo je zwiększam"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Czy śledzisz swoje postępy na treningach?", "factual_technical": "Świadomość zasady progresji."}',
  true
),

-- T6: Rest day activity
(
  gen_random_uuid(), 'rest_day_activity', 'layer_2_segment',
  NULL, NULL,
  50,
  'Aktywność w dni przerwy wpływa na regenerację i planowanie tygodnia.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "complete_rest",   "label": "Kompletny odpoczynek — sofa i relaks"},
    {"value": "light_walk",      "label": "Lekki spacer lub ruch"},
    {"value": "active_recovery", "label": "Aktywna regeneracja — joga, stretching, rower"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Co robisz w dni bez treningu?", "factual_technical": "Aktywność w dniach przerwy."}',
  true
),

-- T7: Biggest training obstacle
(
  gen_random_uuid(), 'biggest_training_obstacle', 'layer_2_segment',
  NULL, NULL,
  68,
  'Największa bariera to miejsce, gdzie możemy Ci najbardziej pomóc. Nie chcemy ignorować realnych trudności.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "time",        "label": "Brak czasu"},
    {"value": "motivation",  "label": "Brak motywacji"},
    {"value": "soreness",    "label": "Zmęczenie i ból mięśni"},
    {"value": "equipment",   "label": "Brak sprzętu lub miejsca"},
    {"value": "knowledge",   "label": "Nie wiem, co robić"},
    {"value": "injury",      "label": "Kontuzja lub ból"},
    {"value": "none",        "label": "Nie mam dużych przeszkód"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Co najczęściej staje Ci na drodze do treningu?", "factual_technical": "Główna bariera treningowa."}',
  true
),

-- T8: Injury history detail
(
  gen_random_uuid(), 'injury_history_detail', 'layer_2_segment',
  NULL, NULL,
  52,
  'Szczegóły historii kontuzji pozwalają nam unikać ruchów, które mogą pogorszyć stan.',
  'Opisz krótko — co bolało, kiedy, czy nadal jest problem.',
  'text_short',
  '{"placeholder": "np. zerwanie ACL w 2022, leczony, teraz mogę trenować z ostrożnością", "max_length": 500}',
  false, 30,
  '{"warm_encouraging": "Chcesz powiedzieć nam coś więcej o swoich kontuzjach?", "factual_technical": "Historia kontuzji — szczegóły."}',
  true
),

-- =============================================================
-- DIET (8)
-- =============================================================

-- D1: Meals per day
(
  gen_random_uuid(), 'meal_count_per_day', 'layer_2_segment',
  NULL, NULL,
  72,
  'Liczba posiłków wpływa na rozkład kalorii i makroskładników w planie żywieniowym.',
  'Ile posiłków (wliczając przekąski) zjadasz zazwyczaj w ciągu dnia?',
  'single_select',
  '{"options": [
    {"value": 2, "label": "2 posiłki dziennie"},
    {"value": 3, "label": "3 posiłki (klasycznie)"},
    {"value": 4, "label": "4 posiłki"},
    {"value": 5, "label": "5 lub więcej posiłków"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Ile razy dziennie jesz?", "factual_technical": "Liczba posiłków dziennie."}',
  true
),

-- D2: Cooking frequency
(
  gen_random_uuid(), 'cooking_frequency', 'layer_2_segment',
  NULL, NULL,
  68,
  'Umiejętność i chęć gotowania wyznacza, jak złożone przepisy możemy Ci proponować.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "never",     "label": "Nie gotuję — zamawiają lub kupuję gotowe"},
    {"value": "sometimes", "label": "Gotuję czasami — proste dania"},
    {"value": "often",     "label": "Gotuję często — kilka razy w tygodniu"},
    {"value": "daily",     "label": "Gotuję codziennie i lubię to"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Jak często gotujesz?", "factual_technical": "Częstotliwość gotowania."}',
  true
),

-- D3: Meal prep willingness
(
  gen_random_uuid(), 'meal_prep_willingness', 'layer_2_segment',
  NULL, '{"goals": ["weight_loss", "muscle_building"]}',
  60,
  'Przygotowywanie posiłków z góry znacząco ułatwia trzymanie się planu żywieniowego.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "no",        "label": "Nie — wolę gotować na bieżąco"},
    {"value": "sometimes", "label": "Czasami — jeśli mam czas w weekend"},
    {"value": "yes",       "label": "Tak — chętnie przygotowuję z góry"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Czy byłbyś/abyś gotowy/a do przygotowywania posiłków z wyprzedzeniem?", "factual_technical": "Gotowość do meal-prep."}',
  true
),

-- D4: Disliked foods
(
  gen_random_uuid(), 'disliked_foods', 'layer_2_segment',
  NULL, NULL,
  58,
  'Produkty, których nie lubisz, nie pojawią się w planie. Lepiej wiedzieć zawczasu.',
  'Wpisz produkty lub kategorie, których zdecydowanie chcesz unikać (poza już podanymi alergiami).',
  'text_short',
  '{"placeholder": "np. ryby, warzywa strączkowe, brokułu, podroby", "max_length": 300}',
  false, 20,
  '{"warm_encouraging": "Czy jest coś, czego zdecydowanie nie chcesz jeść?", "factual_technical": "Produkty wykluczone (preferencje)."}',
  true
),

-- D5: Alcohol frequency
(
  gen_random_uuid(), 'alcohol_frequency', 'layer_2_segment',
  NULL, NULL,
  55,
  'Alkohol wpływa na regenerację, sen i bilans kaloryczny. Bez oceniania — chcemy to uwzględnić.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "never",       "label": "Nie piję alkoholu"},
    {"value": "occasional",  "label": "Okazjonalnie — 1-2x w miesiącu"},
    {"value": "weekly",      "label": "Raz lub dwa razy w tygodniu"},
    {"value": "few_weekly",  "label": "Kilka razy w tygodniu"},
    {"value": "daily",       "label": "Codziennie"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Jak często pijesz alkohol?", "factual_technical": "Częstotliwość spożycia alkoholu."}',
  true
),

-- D6: Supplement use
(
  gen_random_uuid(), 'supplement_use', 'layer_2_segment',
  NULL, NULL,
  52,
  'Wiedza o suplementacji pozwala nam dostosować rekomendacje żywieniowe (np. nie dublować białka).',
  NULL,
  'multi_select',
  '{"options": [
    {"value": "protein_powder", "label": "Odżywka białkowa"},
    {"value": "creatine",       "label": "Kreatyna"},
    {"value": "vitamins",       "label": "Witaminy / minerały"},
    {"value": "omega3",         "label": "Omega-3"},
    {"value": "pre_workout",    "label": "Pre-workout"},
    {"value": "other",          "label": "Inne suplementy"},
    {"value": "none",           "label": "Nie stosuję suplementów"}
  ]}',
  false, 15,
  '{"warm_encouraging": "Czy stosujesz jakieś suplementy?", "factual_technical": "Aktualna suplementacja."}',
  true
),

-- D7: Eating out frequency
(
  gen_random_uuid(), 'eating_out_frequency', 'layer_2_segment',
  NULL, NULL,
  50,
  'Jedzenie poza domem utrudnia kontrolę składu posiłku. Dostosujemy strategię do Twojego stylu życia.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "rarely",    "label": "Rzadko — kilka razy w miesiącu"},
    {"value": "1_2_week",  "label": "1-2 razy w tygodniu"},
    {"value": "3_5_week",  "label": "3-5 razy w tygodniu"},
    {"value": "daily",     "label": "Prawie codziennie"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Jak często jesz poza domem (restauracja, catering, fast food)?", "factual_technical": "Częstotliwość jedzenia poza domem."}',
  true
),

-- D8: Food budget
(
  gen_random_uuid(), 'food_budget_monthly', 'layer_2_segment',
  NULL, NULL,
  48,
  'Budżet na żywność wpływa na dostępność produktów i złożoność planu — nie proponujemy łososia co dzień.',
  'Orientacyjny budżet na jedzenie dla siebie miesięcznie.',
  'single_select',
  '{"options": [
    {"value": "low",       "label": "Do 400 zł — oszczędzam"},
    {"value": "medium",    "label": "400-700 zł — normalny budżet"},
    {"value": "high",      "label": "700-1200 zł — mogę pozwolić sobie na więcej"},
    {"value": "very_high", "label": "Powyżej 1200 zł — bez ograniczeń"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Mniej więcej ile wydajesz miesięcznie na jedzenie?", "factual_technical": "Budżet na żywność [PLN/miesiąc]."}',
  true
),

-- =============================================================
-- SLEEP (7)
-- =============================================================

-- S1: Average sleep hours
(
  gen_random_uuid(), 'avg_sleep_hours', 'layer_2_segment',
  NULL, NULL,
  75,
  'Sen to filar regeneracji. Poniżej 7h znacząco ogranicza postępy — chcemy to uwzględnić w planie.',
  'Ile godzin śpisz przeciętnie w ciągu nocy (nie ideał, a rzeczywistość)?',
  'numeric',
  '{"unit": "h", "min": 3, "max": 12, "step": 0.5, "placeholder": "np. 7"}',
  false, 10,
  '{"warm_encouraging": "Ile śpisz zazwyczaj?", "factual_technical": "Średnia długość snu [h]."}',
  true
),

-- S2: Sleep quality rating
(
  gen_random_uuid(), 'sleep_quality_typical', 'layer_2_segment',
  NULL, NULL,
  70,
  'Jakość snu (nie tylko ilość) ma ogromny wpływ na regenerację mięśniową i poziom energii.',
  'Oceń jakość swojego snu w skali 1-5 (1 = bardzo słaba, 5 = doskonała).',
  'scale',
  '{"min": 1, "max": 5, "labels": {"1": "Bardzo słaba", "3": "Przeciętna", "5": "Doskonała"}}',
  false, 10,
  '{"warm_encouraging": "Jak oceniasz jakość swojego snu?", "factual_technical": "Typowa jakość snu (1-5)."}',
  true
),

-- S3: Sleep schedule consistency
(
  gen_random_uuid(), 'sleep_schedule_consistency', 'layer_2_segment',
  NULL, NULL,
  62,
  'Nieregularny sen zaburza rytm dobowy — co wpływa zarówno na regenerację, jak i na hormony głodu.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "very_regular",  "label": "Bardzo regularnie — zawsze o podobnej porze"},
    {"value": "somewhat",      "label": "Zazwyczaj regularnie, weekendy różnie"},
    {"value": "irregular",     "label": "Nieregularnie — godziny bardzo się różnią"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Czy chodzisz spać o regularnych porach?", "factual_technical": "Regularność harmonogramu snu."}',
  true
),

-- S4: Sleep obstacles
(
  gen_random_uuid(), 'sleep_obstacles', 'layer_2_segment',
  NULL, NULL,
  65,
  'Wiedza o przeszkodach w śnie pomaga nam dać trafne wskazówki dotyczące regeneracji.',
  NULL,
  'multi_select',
  '{"options": [
    {"value": "stress",     "label": "Stres i natłok myśli"},
    {"value": "phone",      "label": "Telefon / ekrany przed snem"},
    {"value": "noise",      "label": "Hałas lub światło"},
    {"value": "children",   "label": "Dzieci lub inni domownicy"},
    {"value": "work",       "label": "Praca / nieregularne godziny"},
    {"value": "snoring",    "label": "Chrapanie (własne lub partnera)"},
    {"value": "none",       "label": "Nie mam problemów ze snem"}
  ]}',
  false, 15,
  '{"warm_encouraging": "Co najczęściej przeszkadza Ci w śnie?", "factual_technical": "Główne przeszkody w śnie."}',
  true
),

-- S5: Nap habit
(
  gen_random_uuid(), 'nap_habit', 'layer_2_segment',
  NULL, NULL,
  45,
  'Drzemki mogą kompensować niedobór nocnego snu lub zaburzać jego jakość — chcemy wiedzieć.',
  NULL,
  'boolean',
  '{"labels": {"true": "Tak — drzemię regularnie", "false": "Nie"}}',
  false, 5,
  '{"warm_encouraging": "Czy śpisz w ciągu dnia?", "factual_technical": "Nawyk drzemek w ciągu dnia."}',
  true
),

-- S6: Typical bedtime
(
  gen_random_uuid(), 'bedtime_typical', 'layer_2_segment',
  NULL, NULL,
  55,
  'Pora zasypiania wpływa na ilość snu głębokiego i poziom kortyzolu. Dostosujemy rekomendacje.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "before_22", "label": "Przed 22:00"},
    {"value": "22_23",     "label": "22:00-23:00"},
    {"value": "23_00",     "label": "23:00-00:00"},
    {"value": "after_00",  "label": "Po północy"}
  ]}',
  false, 10,
  '{"warm_encouraging": "O której zazwyczaj zasypiasz?", "factual_technical": "Typowa godzina zasypiania."}',
  true
),

-- S7: Wake-up feeling
(
  gen_random_uuid(), 'wake_up_feeling', 'layer_2_segment',
  NULL, NULL,
  58,
  'Samopoczucie po przebudzeniu to dobry wskaźnik jakości regeneracji nocnej.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "great",       "label": "Świetnie — wysypiam się i budzę pełen/a energii"},
    {"value": "ok",          "label": "OK — trochę potrzebuję się rozbudzić"},
    {"value": "tired",       "label": "Zmęczony/a — trudno wstać, potrzebuję kawy"},
    {"value": "exhausted",   "label": "Bardzo zmęczony/a — czuję się gorzej niż przed snem"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Jak się czujesz po przebudzeniu?", "factual_technical": "Jakość przebudzenia."}',
  true
),

-- =============================================================
-- LIFE (7)
-- =============================================================

-- L1: Work type
(
  gen_random_uuid(), 'work_type', 'layer_2_segment',
  NULL, NULL,
  65,
  'Praca siedząca vs fizyczna to kluczowa różnica dla kalkulacji TDEE i planowania energii.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "desk",      "label": "Praca przy biurku (sedentaryczna)"},
    {"value": "mixed",     "label": "Mieszana — trochę siedzę, trochę chodzę"},
    {"value": "physical",  "label": "Praca fizyczna lub dużo chodzenia"},
    {"value": "not_working","label": "Nie pracuję zawodowo"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Czym się zajmujesz zawodowo?", "factual_technical": "Rodzaj aktywności zawodowej."}',
  true
),

-- L2: Typical stress level
(
  gen_random_uuid(), 'stress_level_typical', 'layer_2_segment',
  NULL, NULL,
  68,
  'Chroniczny stres podnosi kortyzol, co utrudnia redukcję tłuszczu i regenerację. To ważna zmienna.',
  'Oceń swój typowy poziom stresu w skali 1-5 (1 = brak stresu, 5 = bardzo wysoki).',
  'scale',
  '{"min": 1, "max": 5, "labels": {"1": "Bardzo niski", "3": "Umiarkowany", "5": "Bardzo wysoki"}}',
  false, 10,
  '{"warm_encouraging": "Jak oceniasz swój typowy poziom stresu?", "factual_technical": "Typowy poziom stresu (1-5)."}',
  true
),

-- L3: Family obligations
(
  gen_random_uuid(), 'family_obligations', 'layer_2_segment',
  NULL, NULL,
  55,
  'Obowiązki rodzinne wpływają na dostępność czasu i poziom energii — dostosujemy realistyczność planu.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "none",     "label": "Brak — żyję głównie dla siebie"},
    {"value": "moderate", "label": "Umiarkowane — mam rodzinę, daję radę"},
    {"value": "heavy",    "label": "Duże — dzieci / opieka nad bliskimi, mało wolnego czasu"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Ile masz obowiązków rodzinnych?", "factual_technical": "Poziom zobowiązań rodzinnych."}',
  true
),

-- L4: Motivation driver
(
  gen_random_uuid(), 'motivation_driver', 'layer_2_segment',
  NULL, NULL,
  62,
  'Wiedza, co Cię motywuje, pozwala nam lepiej dobierać język i frame komunikacji.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "appearance",    "label": "Wygląd — chcę lepiej wyglądać"},
    {"value": "health",        "label": "Zdrowie — chcę żyć dłużej i lepiej"},
    {"value": "performance",   "label": "Wyniki — chcę być silniejszy/a, szybszy/a"},
    {"value": "energy",        "label": "Energia — chcę czuć się lepiej na co dzień"},
    {"value": "social",        "label": "Towarzystwo — motywuje mnie trening z innymi"},
    {"value": "habit",         "label": "Nawyk — po prostu stało się częścią życia"}
  ]}',
  false, 15,
  '{"warm_encouraging": "Co najbardziej motywuje Cię do dbania o siebie?", "factual_technical": "Główny driver motywacji."}',
  true
),

-- L5: Past fitness attempts
(
  gen_random_uuid(), 'past_fitness_attempts', 'layer_2_segment',
  NULL, NULL,
  50,
  'Historia prób pomoże nam uniknąć błędów poprzednich podejść i zrozumieć, co u Ciebie działa.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "first_time",  "label": "Pierwszy raz — nigdy wcześniej nie próbowałem/am"},
    {"value": "tried_once",  "label": "Próbowałem/am raz lub dwa — bez trwałych efektów"},
    {"value": "cyclic",      "label": "Kilka razy — zaczynam, kończę, zaczynam od nowa"},
    {"value": "long_break",  "label": "Trenowałem/am długo, potem był/a przerwa"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Czy już wcześniej próbowałeś/aś pracować nad formą?", "factual_technical": "Historia poprzednich prób."}',
  true
),

-- L6: Accountability preference
(
  gen_random_uuid(), 'accountability_preference', 'layer_2_segment',
  NULL, NULL,
  58,
  'Skuteczność przypomnienia i śledzenia zależy od stylu motywacji — ktoś potrzebuje przypomnień, ktoś inny nie.',
  NULL,
  'multi_select',
  '{"options": [
    {"value": "notifications",  "label": "Powiadomienia push — lubię być przypominany/a"},
    {"value": "tracking",       "label": "Logowanie postępów — sam/a się motywuję danymi"},
    {"value": "social",         "label": "Wspólna aktywność lub partner treningowy"},
    {"value": "coach_msg",      "label": "Wiadomości od coacha AI"},
    {"value": "none",           "label": "Nie potrzebuję zewnętrznej motywacji"}
  ]}',
  false, 15,
  '{"warm_encouraging": "Co pomaga Ci trzymać się planu?", "factual_technical": "Preferencja accountability."}',
  true
),

-- L7: Primary life obstacle to fitness
(
  gen_random_uuid(), 'life_obstacle_primary', 'layer_2_segment',
  NULL, NULL,
  70,
  'Najważniejsza życiowa bariera wyznacza, gdzie powinniśmy Ci najbardziej pomóc.',
  NULL,
  'single_select',
  '{"options": [
    {"value": "time",           "label": "Brak czasu"},
    {"value": "energy",         "label": "Brak energii po pracy / obowiązkach"},
    {"value": "motivation",     "label": "Trudno mi utrzymać motywację długoterminowo"},
    {"value": "knowledge",      "label": "Nie wiem, co robić — za dużo sprzecznych informacji"},
    {"value": "social_pressure","label": "Otoczenie nie wspiera — trudno mi"},
    {"value": "none",           "label": "Nie mam dużych barier"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Co jest Twoją największą życiową przeszkodą w drodze do lepszej formy?", "factual_technical": "Główna bariera (życiowa)."}',
  true
)

ON CONFLICT DO NOTHING;
