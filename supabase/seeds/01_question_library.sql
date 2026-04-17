-- =============================================================
-- Seed: question_library — Layer 1 Minimum (guided-safe onboarding)
-- =============================================================

INSERT INTO question_library (
  id, field_key, layer, priority_base,
  why_we_ask, how_to_measure,
  answer_type, answer_options,
  blocks_if_unanswered, expected_time_seconds,
  phrasing_options, is_active
) VALUES

(
  gen_random_uuid(), 'primary_goal', 'layer_1_minimum', 100,
  'To pomaga nam dobrać bezpieczny kierunek startu.',
  'Wybierz to, co jest dziś dla Ciebie najważniejsze.',
  'single_select',
  '{"options": [
    {"value": "weight_loss",          "label": "Chcę schudnąć lub zmniejszyć ilość tkanki tłuszczowej"},
    {"value": "muscle_building",      "label": "Chcę zbudować mięśnie i poprawić sylwetkę"},
    {"value": "strength_performance", "label": "Chcę poprawić siłę i sprawność"},
    {"value": "general_health",       "label": "Chcę po prostu regularnie się ruszać i czuć się lepiej"}
  ]}',
  true, 15,
  '{"warm_encouraging": "Jaki jest dziś Twój główny cel?", "calm_guided": "Jaki jest dziś Twój główny cel?"}',
  true
),

(
  gen_random_uuid(), 'age_years', 'layer_1_minimum', 95,
  'Wiek pomaga dobrać spokojne tempo startu i poziom ostrożności.',
  'Podaj pełne lata. Nie potrzebujemy dokładnej daty urodzenia.',
  'numeric',
  '{"unit": "years", "min": 16, "max": 99, "placeholder": "np. 34"}',
  true, 10,
  '{"warm_encouraging": "Ile masz lat?", "calm_guided": "Ile masz lat?"}',
  true
),

(
  gen_random_uuid(), 'height_cm', 'layer_1_minimum', 90,
  'Wzrost pomaga dopasować plan i ocenić punkt startowy.',
  'Wystarczy przybliżona wartość w centymetrach.',
  'numeric',
  '{"unit": "cm", "min": 120, "max": 250, "placeholder": "np. 172"}',
  true, 10,
  '{"warm_encouraging": "Jaki masz wzrost?", "calm_guided": "Jaki masz wzrost?"}',
  true
),

(
  gen_random_uuid(), 'current_weight_kg', 'layer_1_minimum', 90,
  'Masa pomaga dopasować plan i łagodny start.',
  'Wystarczy orientacyjna wartość.',
  'numeric',
  '{"unit": "kg", "min": 30, "max": 300, "placeholder": "np. 78"}',
  true, 10,
  '{"warm_encouraging": "Jaka jest Twoja masa ciała?", "calm_guided": "Jaka jest Twoja masa ciała?"}',
  true
),

(
  gen_random_uuid(), 'days_per_week', 'layer_1_minimum', 95,
  'Chcemy zaplanować tyle, ile naprawdę dasz radę zrobić.',
  'Wybierz realną liczbę treningów, nie wersję idealną.',
  'single_select',
  '{"options": [
    {"value": 2, "label": "2 treningi tygodniowo"},
    {"value": 3, "label": "3 treningi tygodniowo"},
    {"value": 4, "label": "4 treningi tygodniowo"},
    {"value": 5, "label": "5 lub więcej"}
  ]}',
  true, 10,
  '{"warm_encouraging": "Ile treningów tygodniowo jest realne?", "calm_guided": "Ile treningów tygodniowo jest realne?"}',
  true
),

(
  gen_random_uuid(), 'equipment_location', 'layer_1_minimum', 95,
  'To pozwala od razu dobrać ćwiczenia i prosty przebieg pierwszych wizyt.',
  'Wskaż miejsce, w którym najłatwiej będzie Ci ćwiczyć.',
  'single_select',
  '{"options": [
    {"value": "gym",   "label": "Na siłowni"},
    {"value": "home",  "label": "W domu albo na zewnątrz"},
    {"value": "mixed", "label": "Różnie, zależnie od dnia"}
  ]}',
  true, 10,
  '{"warm_encouraging": "Gdzie najłatwiej będzie Ci ćwiczyć?", "calm_guided": "Gdzie najłatwiej będzie Ci ćwiczyć?"}',
  true
),

(
  gen_random_uuid(), 'recent_activity_window', 'layer_1_minimum', 92,
  'Na tej podstawie oceniamy, czy potrzebujesz bardzo łagodnego wejścia.',
  'Chodzi o regularny ruch, nie pojedyncze próby.',
  'single_select',
  '{"options": [
    {"value": "never_regular",   "label": "Nie miałem/am jeszcze regularnych treningów"},
    {"value": "over_12_months",  "label": "Ponad 12 miesięcy temu"},
    {"value": "within_12_months","label": "W ostatnich 12 miesiącach, ale nie teraz regularnie"},
    {"value": "within_3_months", "label": "Ćwiczę regularnie teraz albo ćwiczyłem/am w ostatnich 3 miesiącach"}
  ]}',
  true, 15,
  '{"warm_encouraging": "Kiedy ostatnio miałeś/aś regularną aktywność fizyczną?", "calm_guided": "Kiedy ostatnio miałeś/aś regularną aktywność fizyczną?"}',
  true
),

(
  gen_random_uuid(), 'health_constraints', 'layer_1_minimum', 98,
  'To najważniejsza część bezpieczeństwa. Dzięki temu nie dobierzemy zbyt agresywnego startu.',
  'Zaznacz to, co może wpływać na wysiłek lub wymaga ostrożności.',
  'multi_select',
  '{"options": [
    {"value": "pain_or_injury",               "label": "Mam ból, uraz albo nawracający dyskomfort przy ruchu"},
    {"value": "medical_condition",            "label": "Mam chorobę lub stan zdrowotny, który warto uwzględnić"},
    {"value": "medication_affecting_exertion","label": "Biorę leki, które mogą wpływać na wysiłek lub tętno"},
    {"value": "other_contraindication",       "label": "Mam inne przeciwwskazanie albo potrzebuję ostrożnego startu"},
    {"value": "none",                         "label": "Nic z tych rzeczy mnie nie dotyczy"}
  ]}',
  true, 15,
  '{"warm_encouraging": "Czy coś może wpływać na bezpieczny wysiłek?", "calm_guided": "Czy coś może wpływać na bezpieczny wysiłek?"}',
  true
),

(
  gen_random_uuid(), 'job_activity', 'layer_1_minimum', 80,
  'Tryb dnia pomaga dobrać obciążenie i tempo regeneracji.',
  'Wybierz opis najbliższy temu, jak zwykle wygląda Twój dzień.',
  'single_select',
  '{"options": [
    {"value": "mostly_sitting",   "label": "Głównie siedzę"},
    {"value": "mixed",            "label": "Trochę siedzę, trochę chodzę"},
    {"value": "mostly_standing",  "label": "Głównie stoję albo dużo chodzę"},
    {"value": "physically_active","label": "Moja praca jest fizyczna"}
  ]}',
  true, 10,
  '{"warm_encouraging": "Jak wygląda Twój typowy dzień pracy?", "calm_guided": "Jak wygląda Twój typowy dzień pracy?"}',
  true
),

(
  gen_random_uuid(), 'training_background', 'layer_1_minimum', 94,
  'Dzięki temu pokażemy taką ilość instrukcji, jaka naprawdę będzie pomocna.',
  'Wybierz opis, który najlepiej pasuje do Ciebie teraz.',
  'single_select',
  '{"options": [
    {"value": "just_starting",             "label": "Dopiero zaczynam i chcę prostych instrukcji krok po kroku"},
    {"value": "returning_after_break",     "label": "Wracam po długiej przerwie"},
    {"value": "knows_basics_needs_plan",   "label": "Znam podstawy, ale potrzebuję planu"},
    {"value": "training_regularly",        "label": "Ćwiczę regularnie"}
  ]}',
  true, 15,
  '{"warm_encouraging": "Który opis najlepiej do Ciebie pasuje?", "calm_guided": "Który opis najlepiej do Ciebie pasuje?"}',
  true
)

ON CONFLICT DO NOTHING;
