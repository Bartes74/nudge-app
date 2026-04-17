-- =============================================================
-- Seed: field_explanations — pl-PL (15 entries)
-- =============================================================

INSERT INTO field_explanations (
  id, field_key, locale,
  why_we_ask, how_to_measure, example,
  estimated_time_seconds, show_in_contexts,
  updated_at
) VALUES

(gen_random_uuid(), 'primary_goal', 'pl-PL',
  'Cel główny wyznacza całą architekturę planu. Trening redukcyjny wygląda inaczej niż masa mięśniowa.',
  'Zastanów się, co chcesz osiągnąć w ciągu najbliższych 3 miesięcy. Wybierz jedno — najważniejsze.',
  'np. „Chcę schudnąć 5 kg" → wybierz Redukcja',
  15, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'birth_date', 'pl-PL',
  'Wiek ma wpływ na obliczenie Twojego metabolizmu bazowego (BMR) i zalecenia dotyczące regeneracji.',
  'Podaj rok urodzenia. Nie potrzebujemy dokładnego dnia.',
  'np. 1990 lub 15/06/1990',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'gender', 'pl-PL',
  'Płeć biologiczna wpływa na kalkulację kalorii i proporcji makroskładników (kobiety i mężczyźni mają różny metabolizm bazowy).',
  'Wybierz opcję najbliższą Twojej fizjologii. To pole jest opcjonalne.',
  NULL,
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'height_cm', 'pl-PL',
  'Wzrost razem z masą ciała służy do wyliczenia BMI oraz precyzyjnego zapotrzebowania kalorycznego.',
  'Stań bez butów, wyprostuj się. Zmierz metrówką lub podaj przybliżoną wartość.',
  'np. 172',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'current_weight_kg', 'pl-PL',
  'Aktualna masa ciała to punkt startowy dla wyliczenia TDEE i ustawienia celów.',
  'Zważ się rano, na czczo, w bieliźnie. Możesz podać orientacyjną wartość — poprawisz ją później.',
  'np. 78',
  10, ARRAY['onboarding', 'profile_fill', 'checkin'],
  now()
),

(gen_random_uuid(), 'days_per_week', 'pl-PL',
  'Liczba dni treningowych decyduje o strukturze tygodnia. Plan na 3 dni różni się od planu na 5 dni.',
  'Oceń realnie — ile dni możesz trenować regularnie, nawet gdy jesteś zajęta/y. Nie idealizuj.',
  'np. 3 razy — klasyczna metoda FBW lub push/pull/legs',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'equipment_location', 'pl-PL',
  'Lokalizacja treningu determinuje dostępny sprzęt. Plan siłowniany i domowy wyglądają zupełnie inaczej.',
  'Gdzie trenujesz najczęściej? Jeśli mieszasz — wybierz to, co dominuje.',
  'np. Siłownia, jeśli chodzisz 3x/tydz, a w domu trenujesz raz w tygodniu',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'equipment_list', 'pl-PL',
  'Wiemy, co masz dostępne — dobieramy ćwiczenia, które możesz realnie wykonać.',
  'Zaznacz wszystko, z czego korzystasz regularnie lub masz do dyspozycji.',
  'np. Hantle 5–15 kg, drążek, mata',
  15, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'experience_level', 'pl-PL',
  'Poziom doświadczenia decyduje o złożoności ćwiczeń, tempie progresji i częstotliwości treningów.',
  'Odpowiedz szczerze — nie ma złej odpowiedzi. Plan dla beginner i zaawansowanego to zupełnie inne światy.',
  'np. Jeśli trenujesz od roku ale nie masz systematyki — wybierz Beginner',
  15, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'health_constraints', 'pl-PL',
  'Ograniczenia zdrowotne i kontuzje to niezbędne informacje bezpieczeństwa — bez nich możemy zalecić ćwiczenia, których nie powinieneś robić.',
  'Zaznacz wszystko, co dotyczy Ciebie teraz lub co nawracało w ostatnim roku.',
  'np. Ból kolana → wyłączamy głębokie przysiady i lunges',
  15, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'is_pregnant', 'pl-PL',
  'Ciąża wymaga specjalnego podejścia do aktywności fizycznej i diety. To pytanie służy Twojemu bezpieczeństwu.',
  NULL,
  NULL,
  5, ARRAY['onboarding'],
  now()
),

(gen_random_uuid(), 'nutrition_mode', 'pl-PL',
  'Różne osoby potrzebują różnego poziomu szczegółowości w żywieniu. Nudge dopasowuje się do Twojego stylu.',
  'Polecamy zacząć od Prostego — za złożony start zniechęca. Możesz przełączyć się w każdej chwili.',
  'np. Prosty: "zjedz 4 posiłki, 1 dłoń białka na każdy"',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'display_name', 'pl-PL',
  'Coach zwraca się do Ciebie po imieniu — rozmowy brzmią bardziej naturalnie.',
  'Podaj imię lub pseudonim. Możesz użyć czegokolwiek — to tylko dla Ciebie.',
  'np. Ania, Kuba, Tomek',
  5, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'dietary_constraints', 'pl-PL',
  'Diety eliminacyjne wymagają innych propozycji posiłków i innego rozkładu makroskładników.',
  'Zaznacz tylko to, czego naprawdę przestrzegasz. Preferencje ("nie lubię brokuł") możesz dodać później.',
  'np. Wegetarianizm: plan białkowy bez mięsa',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
),

(gen_random_uuid(), 'life_context', 'pl-PL',
  'Kontekst życiowy wpływa na realistyczność planu. Rodzic małych dzieci ma inne okna czasowe niż singiel.',
  'Zaznacz to, co aktualnie kształtuje Twój tryb życia i czas wolny.',
  'np. Rodzic małych dzieci → krótsze, intensywniejsze treningi, elastyczny harmonogram',
  10, ARRAY['onboarding', 'profile_fill'],
  now()
)

ON CONFLICT (field_key, locale) DO NOTHING;
