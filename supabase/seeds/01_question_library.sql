-- =============================================================
-- Seed: question_library — Layer 1 Minimum (12 questions)
-- =============================================================

INSERT INTO question_library (
  id, field_key, layer, priority_base,
  why_we_ask, how_to_measure,
  answer_type, answer_options,
  blocks_if_unanswered, expected_time_seconds,
  phrasing_options, is_active
) VALUES

-- 1. Cel główny (REQUIRED)
(
  gen_random_uuid(), 'primary_goal', 'layer_1_minimum', 100,
  'Cel główny wyznacza kierunek całego planu — inaczej trenuje się na masę, inaczej na zdrowie.',
  'Wybierz to, co jest dla Ciebie najważniejsze teraz. Możesz zmienić w każdej chwili.',
  'single_select',
  '{"options": [
    {"value": "weight_loss",          "label": "Chcę schudnąć / zredukować tkankę tłuszczową"},
    {"value": "muscle_building",      "label": "Chcę zbudować mięśnie / poprawić sylwetkę"},
    {"value": "strength_performance", "label": "Chcę zwiększyć siłę i wydolność"},
    {"value": "general_health",       "label": "Chcę po prostu być aktywna/y i czuć się lepiej"}
  ]}',
  true, 15,
  '{"warm_encouraging": "Co jest dla Ciebie teraz najważniejsze?", "factual_technical": "Wybierz cel główny planu."}',
  true
),

-- 2. Wiek
(
  gen_random_uuid(), 'birth_date', 'layer_1_minimum', 90,
  'Wiek wpływa na dobór intensywności i czasu regeneracji. Inaczej trenuje 22-latka, inaczej 50-latek.',
  'Podaj rok urodzenia lub dokładną datę. Nie musimy znać dnia — wystarczy rok.',
  'measurement',
  NULL,
  false, 10,
  '{"warm_encouraging": "Ile masz lat?", "factual_technical": "Podaj rok urodzenia."}',
  true
),

-- 3. Płeć
(
  gen_random_uuid(), 'gender', 'layer_1_minimum', 85,
  'Płeć biologiczna wpływa na kalkulację zapotrzebowania kalorycznego i objętości treningowej.',
  'Wybierz opcję, która najbliżej odpowiada Twojej fizjologii. To pole jest opcjonalne.',
  'single_select',
  '{"options": [
    {"value": "female",           "label": "Kobieta"},
    {"value": "male",             "label": "Mężczyzna"},
    {"value": "other",            "label": "Inna"},
    {"value": "prefer_not_to_say","label": "Wolę nie podawać"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Jak się identyfikujesz?", "factual_technical": "Płeć biologiczna (potrzebna do kalibracji)."}',
  true
),

-- 4. Wzrost
(
  gen_random_uuid(), 'height_cm', 'layer_1_minimum', 80,
  'Wzrost jest potrzebny do obliczenia BMI, TDEE i proporcji makroskładników.',
  'Stań bez butów przy ścianie. Wystarczy przybliżona wartość w centymetrach.',
  'numeric',
  '{"unit": "cm", "min": 120, "max": 250, "placeholder": "np. 172"}',
  false, 10,
  '{"warm_encouraging": "Ile masz wzrostu?", "factual_technical": "Wzrost [cm]."}',
  true
),

-- 5. Masa ciała
(
  gen_random_uuid(), 'current_weight_kg', 'layer_1_minimum', 80,
  'Masa ciała razem ze wzrostem daje nam punkt startowy do planu żywieniowego i treningowego.',
  'Zważ się rano na czczo. Jeśli nie masz wagi — podaj orientacyjną wartość.',
  'numeric',
  '{"unit": "kg", "min": 30, "max": 300, "placeholder": "np. 68"}',
  false, 10,
  '{"warm_encouraging": "Ile ważysz?", "factual_technical": "Aktualna masa ciała [kg]."}',
  true
),

-- 6. Liczba dni treningowych / tydzień (REQUIRED)
(
  gen_random_uuid(), 'days_per_week', 'layer_1_minimum', 95,
  'Liczba dni treningowych to fundament struktury planu. Każdy plan jest inny dla 2, 4 i 5 dni.',
  'Ile razy w tygodniu realnie możesz trenować? Nie wpisuj aspiracji — wpisuj realia.',
  'single_select',
  '{"options": [
    {"value": 2, "label": "2 razy — na start"},
    {"value": 3, "label": "3 razy — klasyk"},
    {"value": 4, "label": "4 razy"},
    {"value": 5, "label": "5 razy lub więcej"}
  ]}',
  true, 10,
  '{"warm_encouraging": "Ile razy w tygodniu możesz trenować?", "factual_technical": "Dni treningowe / tydzień."}',
  true
),

-- 7. Lokalizacja treningu (REQUIRED)
(
  gen_random_uuid(), 'equipment_location', 'layer_1_minimum', 95,
  'Różny sprzęt = różny plan. Plan domowy i siłowniany wyglądają całkowicie inaczej.',
  'Gdzie zazwyczaj trenujesz? Jeśli mieszasz — wybierz to, gdzie trenujesz częściej.',
  'single_select',
  '{"options": [
    {"value": "home",  "label": "W domu (lub na dworze)"},
    {"value": "gym",   "label": "Na siłowni"},
    {"value": "mixed", "label": "Mixuję — i w domu, i na siłowni"}
  ]}',
  true, 10,
  '{"warm_encouraging": "Gdzie trenujesz?", "factual_technical": "Lokalizacja treningów."}',
  true
),

-- 8. Dostępny sprzęt
(
  gen_random_uuid(), 'equipment_list', 'layer_1_minimum', 88,
  'Wiemy, z czym możesz trenować — dobieramy ćwiczenia, które faktycznie możesz wykonać.',
  'Zaznacz wszystko, co masz dostęp. Jeśli jesteś na siłowni — zaznacz wszystko, z czego korzystasz.',
  'multi_select',
  '{"options": [
    {"value": "has_barbell",     "label": "Sztanga ze stojakiem"},
    {"value": "has_dumbbells",   "label": "Hantle"},
    {"value": "has_kettlebells", "label": "Kettlebell"},
    {"value": "has_machines",    "label": "Maszyny (np. leg press, kablówka)"},
    {"value": "has_cables",      "label": "Wyciągi / kablówka"},
    {"value": "has_pullup_bar",  "label": "Drążek do podciągania"},
    {"value": "has_bench",       "label": "Ławeczka"},
    {"value": "has_cardio",      "label": "Sprzęt cardio (bieżnia, rower stacjonarny)"}
  ]}',
  false, 15,
  '{"warm_encouraging": "Co masz pod ręką do treningu?", "factual_technical": "Dostępny sprzęt."}',
  true
),

-- 9. Poziom doświadczenia (behawioralnie)
(
  gen_random_uuid(), 'experience_level', 'layer_1_minimum', 85,
  'Poziom doświadczenia decyduje o złożoności ćwiczeń i tempie progresji — nie chcemy Cię ani nudzić, ani przeciążać.',
  'Wybierz szczerze — nie ma złej odpowiedzi.',
  'single_select',
  '{"options": [
    {"value": "zero",     "label": "Dopiero zaczynam — nigdy nie trenowałem/am regularnie"},
    {"value": "beginner", "label": "Trenuję od kilku miesięcy, znam podstawy"},
    {"value": "amateur",  "label": "Trenuję regularnie od 1-3 lat"},
    {"value": "advanced", "label": "Trenuję poważnie od 3+ lat, znam technikę"}
  ]}',
  false, 15,
  '{"warm_encouraging": "Jak oceniasz swoje doświadczenie treningowe?", "factual_technical": "Poziom zaawansowania."}',
  true
),

-- 10. Ograniczenia zdrowotne
(
  gen_random_uuid(), 'health_constraints', 'layer_1_minimum', 75,
  'Kontuzje i ograniczenia to kluczowe informacje — bez tego możemy zaproponować ćwiczenia, których nie możesz (lub nie powinieneś) robić.',
  'Zaznacz wszystko, co dotyczy Ciebie teraz lub w ostatnim roku.',
  'multi_select',
  '{"options": [
    {"value": "back_pain",       "label": "Ból pleców (odcinek lędźwiowy lub szyjny)"},
    {"value": "knee_pain",       "label": "Ból kolan"},
    {"value": "shoulder_pain",   "label": "Ból barków"},
    {"value": "hip_pain",        "label": "Ból bioder"},
    {"value": "wrist_pain",      "label": "Ból nadgarstków"},
    {"value": "cardiovascular",  "label": "Problemy kardiologiczne"},
    {"value": "none",            "label": "Żadnych ograniczeń — jestem zdrowy/a"}
  ]}',
  false, 15,
  '{"warm_encouraging": "Czy masz jakieś ograniczenia zdrowotne?", "factual_technical": "Ograniczenia / kontuzje."}',
  true
),

-- 11. Ciąża (guardrail)
(
  gen_random_uuid(), 'is_pregnant', 'layer_1_minimum', 70,
  'Ciąża całkowicie zmienia to, co jest bezpieczne w treningu i żywieniu. To pytanie chroni Ciebie.',
  NULL,
  'boolean',
  '{"labels": {"true": "Tak, jestem w ciąży", "false": "Nie"}}',
  false, 5,
  '{"warm_encouraging": "Czy jesteś w ciąży?", "factual_technical": "Ciąża (guardrail)."}',
  true
),

-- 12. Tryb diety
(
  gen_random_uuid(), 'nutrition_mode', 'layer_1_minimum', 65,
  'Nudge może pracować na różnych poziomach precyzji żywieniowej — od ogólnych wskazówek do dokładnych gramatur.',
  'Polecamy zacząć od „Prosty" — można przejść na dokładniejszy tryb w każdej chwili.',
  'single_select',
  '{"options": [
    {"value": "simple", "label": "Prosty — ogólne wskazówki, bez liczenia kalorii"},
    {"value": "ranges", "label": "Zakresy — widełki kalorii i makro bez gramatur"},
    {"value": "exact",  "label": "Dokładny — pełne makro w gramach"}
  ]}',
  false, 10,
  '{"warm_encouraging": "Jak dokładnie chcesz śledzić jedzenie?", "factual_technical": "Tryb żywieniowy."}',
  true
)

ON CONFLICT DO NOTHING;
