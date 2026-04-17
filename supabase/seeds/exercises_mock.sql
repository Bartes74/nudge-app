-- =============================================================
-- Mock exercise catalog — ~20 exercises for dev/test
-- Run after migrations. Real 150-exercise catalog replaces this.
-- =============================================================

INSERT INTO public.exercises
  (slug, name_pl, name_en, category, primary_muscles, secondary_muscles,
   equipment_required, difficulty, is_compound, technique_notes, common_mistakes,
   alternatives_slugs, tags)
VALUES

-- PUSH
('barbell_bench_press',     'Wyciskanie sztangi leżąc',   'Barbell Bench Press',
 'push', ARRAY['klatka piersiowa'], ARRAY['triceps','przedni naramienny'],
 ARRAY['barbell','bench'], 'intermediate', true,
 'Łokcie pod 45° do tułowia, sztanga schodzi do dolnej części klatki, mostek uniesiony.',
 'Odbijanie sztangi od klatki, zbyt szerokie rozstawienie łokci.',
 ARRAY['dumbbell_bench_press','pushups','cable_chest_fly'], ARRAY['klatka','wyciskanie']),

('dumbbell_bench_press',    'Wyciskanie hantli leżąc',    'Dumbbell Bench Press',
 'push', ARRAY['klatka piersiowa'], ARRAY['triceps','przedni naramienny'],
 ARRAY['dumbbells','bench'], 'beginner', true,
 'Hantle na zewnątrz klatki, opuszczaj kontrolowanie, dociskaj pełnym ruchem.',
 'Obrót nadgarstków, brak kontroli w fazie ekscentrycznej.',
 ARRAY['barbell_bench_press','pushups'], ARRAY['klatka','wyciskanie']),

('pushups',                 'Pompki',                     'Push-Ups',
 'push', ARRAY['klatka piersiowa'], ARRAY['triceps','naramienny'],
 ARRAY[]::text[], 'beginner', true,
 'Ciało w jednej linii, łokcie 45° do tułowia, pełny zakres ruchu.',
 'Opadające biodra, zbyt szeroki chwyt, niepełny wyprost.',
 ARRAY['dumbbell_bench_press','incline_pushups'], ARRAY['klatka','bez_sprzetu']),

('overhead_press',          'Wyciskanie żołnierskie',     'Overhead Press',
 'push', ARRAY['naramienny'], ARRAY['triceps','górna klatka'],
 ARRAY['barbell'], 'intermediate', true,
 'Brzuch napięty, bar jedzie w linii prostej, nie wyginaj pleców.',
 'Odchylanie tułowia, zbyt szeroki chwyt.',
 ARRAY['dumbbell_shoulder_press','lateral_raise'], ARRAY['naramienniki']),

('dumbbell_shoulder_press', 'Wyciskanie hantli nad głowę','Dumbbell Shoulder Press',
 'push', ARRAY['naramienny'], ARRAY['triceps'],
 ARRAY['dumbbells'], 'beginner', true,
 'Siedząc lub stojąc, hantle wychodzą z linii uszu, opuszczaj do 90°.',
 'Zbyt duże łuki w lędźwiach.',
 ARRAY['overhead_press','lateral_raise'], ARRAY['naramienniki']),

('tricep_pushdown',         'Prostowanie na wyciągu',     'Tricep Pushdown',
 'push', ARRAY['triceps'], ARRAY[]::text[],
 ARRAY['cables'], 'beginner', false,
 'Łokcie blisko tułowia, nie ruszaj nimi podczas ruchu, pełny wyprost.',
 'Wychylanie tułowia do przodu, ruszanie łokciami.',
 ARRAY['pushups','dips'], ARRAY['triceps','wyciag']),

-- PULL
('barbell_row',             'Wiosłowanie sztangą',        'Barbell Row',
 'pull', ARRAY['plecy szerokie','mięśnie równoległoboczne'], ARRAY['biceps','tylny naramienny'],
 ARRAY['barbell'], 'intermediate', true,
 'Tułów prawie równoległy do podłogi, sztanga idzie do dolnych żeber, łokcie wzdłuż tułowia.',
 'Szarpanie, okrągłe plecy, zbyt pionowy tułów.',
 ARRAY['dumbbell_row','cable_row'], ARRAY['plecy','wiosłowanie']),

('dumbbell_row',            'Wiosłowanie hantlem',        'Dumbbell Row',
 'pull', ARRAY['plecy szerokie'], ARRAY['biceps','tylny naramienny'],
 ARRAY['dumbbells','bench'], 'beginner', true,
 'Kolano i dłoń oparte na ławce, hantla idzie wzdłuż boku do bioder.',
 'Obracanie tułowia, zbyt krótki zakres ruchu.',
 ARRAY['barbell_row','cable_row'], ARRAY['plecy','wiosłowanie']),

('lat_pulldown',            'Ściąganie drążka na maszynie','Lat Pulldown',
 'pull', ARRAY['plecy szerokie'], ARRAY['biceps','tylny naramienny'],
 ARRAY['cables'], 'beginner', false,
 'Chwyt trochę szerszy niż barki, ściągaj do górnej klatki, nie za szyję.',
 'Ściąganie za szyję, kołysanie tułowiem.',
 ARRAY['pullups','dumbbell_row'], ARRAY['plecy','wyciag']),

('pullups',                 'Podciąganie na drążku',      'Pull-Ups',
 'pull', ARRAY['plecy szerokie'], ARRAY['biceps'],
 ARRAY['pullup_bar'], 'intermediate', true,
 'Pełny zakres — start z prostymi rękami, broda ponad drążek.',
 'Niepełny zakres, kołysanie nogami.',
 ARRAY['lat_pulldown','band_assisted_pullup'], ARRAY['plecy','drążek']),

('bicep_curl',              'Uginanie na biceps z hantlem','Dumbbell Bicep Curl',
 'pull', ARRAY['biceps'], ARRAY['przedramiona'],
 ARRAY['dumbbells'], 'beginner', false,
 'Łokcie przy tułowiu, uginaj do pełnego skurczu, opuszczaj powoli.',
 'Bujanie tułowiem, brak kontroli przy opuszczaniu.',
 ARRAY['barbell_curl','cable_curl'], ARRAY['biceps']),

-- LEGS
('barbell_squat',           'Przysiad ze sztangą',        'Barbell Back Squat',
 'legs', ARRAY['czworogłowe','pośladki'], ARRAY['dwugłowe ud','łydki'],
 ARRAY['barbell'], 'intermediate', true,
 'Stopy na szerokość barków, kolana idą za linią palców, tułów wyprostowany.',
 'Zawalające się kolana do środka, pięty odrywające się od podłogi, zaokrąglone plecy.',
 ARRAY['goblet_squat','leg_press'], ARRAY['nogi','przysiad']),

('goblet_squat',            'Przysiad z hantlem (goblet)','Goblet Squat',
 'legs', ARRAY['czworogłowe','pośladki'], ARRAY['core'],
 ARRAY['dumbbells'], 'beginner', true,
 'Trzymaj hantla przy klatce, siadaj między kolanami, trzymaj tułów pionowo.',
 'Odrywanie pięt, brak głębokości.',
 ARRAY['barbell_squat','leg_press'], ARRAY['nogi','przysiad']),

('romanian_deadlift',       'Martwy ciąg rumuński',       'Romanian Deadlift',
 'legs', ARRAY['dwugłowe ud','pośladki'], ARRAY['plecy dolne'],
 ARRAY['barbell'], 'intermediate', true,
 'Plecy proste, opuszczaj sztangę po nogach, czuj rozciąganie dwugłowych.',
 'Okrągłe plecy, ugięcie kolan zamiast pracy bioder.',
 ARRAY['dumbbell_rdl','good_morning'], ARRAY['nogi','hamstringi']),

('leg_press',               'Wyciskanie nóg na maszynie', 'Leg Press',
 'legs', ARRAY['czworogłowe','pośladki'], ARRAY['dwugłowe ud'],
 ARRAY['machines'], 'beginner', false,
 'Stopy na środku platformy, kolana idą wzdłuż linii palców, nie blokuj kolan.',
 'Zbyt mały zakres ruchu, odbijanie kolan od klatki.',
 ARRAY['goblet_squat','barbell_squat'], ARRAY['nogi','maszyna']),

('hip_thrust',              'Wypychanie bioder ze sztangą','Barbell Hip Thrust',
 'legs', ARRAY['pośladki'], ARRAY['dwugłowe ud'],
 ARRAY['barbell','bench'], 'intermediate', false,
 'Łopatki oparte o ławkę, pchaj biodrami ku górze, ściśnij pośladki na górze.',
 'Hiperprostowanie lędźwi, zbyt szeroke stopy.',
 ARRAY['glute_bridge','cable_kickback'], ARRAY['pośladki','biodra']),

-- CORE
('plank',                   'Plank (deska)',               'Plank',
 'core', ARRAY['core','transversus abdominis'], ARRAY['naramienny'],
 ARRAY[]::text[], 'beginner', false,
 'Ciało w prostej linii od głowy do pięt, napnij brzuch i pośladki.',
 'Opadające biodra, uniesiony tyłek, wstrzymywanie oddechu.',
 ARRAY['hollow_hold','ab_wheel'], ARRAY['core','bez_sprzetu']),

('cable_crunch',            'Spięcia brzucha na wyciągu', 'Cable Crunch',
 'core', ARRAY['brzuch'], ARRAY[]::text[],
 ARRAY['cables'], 'beginner', false,
 'Klęk, ręce przy skroniach, zginaj tylko w odcinku lędźwiowym.',
 'Ciągnięcie ramionami zamiast zginania kręgosłupa.',
 ARRAY['plank','hanging_leg_raise'], ARRAY['brzuch','wyciag']),

-- FULL BODY
('deadlift',                'Martwy ciąg',                'Conventional Deadlift',
 'full_body', ARRAY['plecy szerokie','pośladki','dwugłowe ud'], ARRAY['core','czworogłowe'],
 ARRAY['barbell'], 'intermediate', true,
 'Sztanga tuż przy nogach, plecy proste, napnij core przed ruchem, pchaj podłogę.',
 'Okrągłe plecy, szarpanie, zdejmowanie bioder za wysoko.',
 ARRAY['romanian_deadlift','trap_bar_deadlift'], ARRAY['plecy','nogi','compound']),

('cable_row',               'Wiosłowanie na wyciągu',     'Seated Cable Row',
 'pull', ARRAY['plecy szerokie','mięśnie równoległoboczne'], ARRAY['biceps'],
 ARRAY['cables'], 'beginner', false,
 'Siedząc wyprostowany, ciągnij do brzucha, łokcie wzdłuż tułowia.',
 'Kołysanie tułowiem, zbyt wąski zakres ruchu.',
 ARRAY['barbell_row','dumbbell_row'], ARRAY['plecy','wyciag']),

('lateral_raise',           'Odwodzenie ramion z hantlami','Lateral Raise',
 'push', ARRAY['naramienny boczny'], ARRAY[]::text[],
 ARRAY['dumbbells'], 'beginner', false,
 'Lekko zgięte łokcie, unoś do wysokości barków, kontrolowane opuszczanie.',
 'Zbyt duże ciężary, szarpanie, unoszenie ponad barki.',
 ARRAY['dumbbell_shoulder_press','cable_lateral_raise'], ARRAY['naramienniki'])

ON CONFLICT (slug) DO NOTHING;
