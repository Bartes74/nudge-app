-- =============================================================
-- Seed: field_explanations — pl-PL (guided-safe onboarding)
-- =============================================================

INSERT INTO field_explanations (
  id, field_key, locale,
  why_we_ask, how_to_measure, example,
  estimated_time_seconds, show_in_contexts,
  updated_at
) VALUES

(gen_random_uuid(), 'primary_goal', 'pl-PL',
  'To pomaga nam dobrać bezpieczny kierunek startu.',
  'Wybierz to, co jest dziś dla Ciebie najważniejsze.',
  NULL,
  15, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'age_years', 'pl-PL',
  'Wiek pomaga dobrać spokojne tempo startu i poziom ostrożności.',
  'Podaj pełne lata. Nie potrzebujemy dokładnej daty urodzenia.',
  'np. 34',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'height_cm', 'pl-PL',
  'Wzrost pomaga dopasować plan i ocenić punkt startowy.',
  'Wystarczy przybliżona wartość w centymetrach.',
  'np. 172',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'current_weight_kg', 'pl-PL',
  'Masa pomaga dopasować plan i łagodny start.',
  'Wystarczy orientacyjna wartość.',
  'np. 78',
  10, ARRAY['onboarding', 'profile_fill', 'checkin'],
  now()
),

(gen_random_uuid(), 'days_per_week', 'pl-PL',
  'Chcemy zaplanować tyle, ile naprawdę dasz radę zrobić.',
  'Wybierz realną liczbę treningów, nie wersję idealną.',
  'np. 3 treningi tygodniowo',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'equipment_location', 'pl-PL',
  'To pozwala od razu dobrać ćwiczenia i prosty przebieg pierwszych wizyt.',
  'Wskaż miejsce, w którym najłatwiej będzie Ci ćwiczyć.',
  'np. Na siłowni',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'recent_activity_window', 'pl-PL',
  'Na tej podstawie oceniamy, czy potrzebujesz bardzo łagodnego wejścia.',
  'Chodzi o regularny ruch, nie pojedyncze próby.',
  'np. Ponad 12 miesięcy temu',
  15, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'health_constraints', 'pl-PL',
  'To najważniejsza część bezpieczeństwa. Dzięki temu nie dobierzemy zbyt agresywnego startu.',
  'Zaznacz to, co może wpływać na wysiłek lub wymaga ostrożności.',
  'np. Ból, uraz albo leki wpływające na wysiłek',
  15, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'job_activity', 'pl-PL',
  'Tryb dnia pomaga dobrać obciążenie i tempo regeneracji.',
  'Wybierz opis najbliższy temu, jak zwykle wygląda Twój dzień.',
  'np. Głównie siedzę',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'training_background', 'pl-PL',
  'Dzięki temu pokażemy taką ilość instrukcji, jaka naprawdę będzie pomocna.',
  'Wybierz opis, który najlepiej pasuje do Ciebie teraz.',
  'np. Wracam po długiej przerwie',
  15, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'experience_level', 'pl-PL',
  'To techniczny wynik klasyfikacji ścieżki startowej, nie pytanie wejściowe.',
  'System wylicza go na podstawie ostatniej aktywności, celu i ograniczeń.',
  NULL,
  5, ARRAY['profile_fill'],
  now()
),

(gen_random_uuid(), 'entry_path', 'pl-PL',
  'To decyduje, czy pokażemy prosty trening prowadzony, czy standardowy plan.',
  'System dobiera tę ścieżkę automatycznie i może ją później zmienić.',
  NULL,
  5, ARRAY['profile_fill'],
  now()
),

(gen_random_uuid(), 'adaptation_phase', 'pl-PL',
  'Faza pokazuje, czy jesteś jeszcze na etapie oswajania miejsca, adaptacji czy fundamentów.',
  'System aktualizuje ją po treningach na podstawie bezpieczeństwa, zrozumienia i pewności siebie.',
  NULL,
  5, ARRAY['profile_fill'],
  now()
)

ON CONFLICT (field_key, locale) DO NOTHING;
