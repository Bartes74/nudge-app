# Rules Engine — `packages/core/src/rules`

Pure functions. No side effects, no DB access. Input → output.

---

## Calculators

### BMR — Basal Metabolic Rate

**File:** `bmr.ts`  
**Formula:** Mifflin-St Jeor (1990)

```
Male:   BMR = 10 × weight_kg + 6.25 × height_cm − 5 × age + 5
Female: BMR = 10 × weight_kg + 6.25 × height_cm − 5 × age − 161
Other:  BMR = average(male, female)
```

Returns `null` if any required input (weight, height, age) is missing or ≤ 0.

```ts
import { calculateBMR, ageFromBirthDate } from '@nudge/core/rules/bmr'

const result = calculateBMR({ weight_kg: 70, height_cm: 175, age: 30, gender: 'male' })
// → { bmr_kcal: 1649, formula: 'mifflin_st_jeor', gender_used: 'male' }
```

---

### TDEE — Total Daily Energy Expenditure

**File:** `tdee.ts`  
**Formula:** `TDEE = BMR × activity_factor`

| Activity level  | Factor |
|----------------|--------|
| sedentary      | 1.200  |
| light          | 1.375  |
| moderate       | 1.550  |
| active         | 1.725  |
| very_active    | 1.900  |

Returns `null` if BMR inputs are missing. Falls back to `sedentary` when `activity_level` is null.

```ts
import { calculateTDEE } from '@nudge/core/rules/tdee'

const result = calculateTDEE({ weight_kg: 70, height_cm: 175, age: 30, gender: 'male', activity_level: 'moderate' })
// → { tdee_kcal: 2556, bmr: { bmr_kcal: 1649, ... }, activity_level: 'moderate', activity_factor: 1.55 }
```

---

### Macros — Daily macro targets

**File:** `macros.ts`

| Goal                 | Calories        | Protein   | Fat  |
|---------------------|----------------|-----------|------|
| weight_loss         | TDEE × 0.80    | 2.0 g/kg  | 25%  |
| muscle_building     | TDEE × 1.10    | 2.2 g/kg  | 25%  |
| strength_performance| TDEE           | 2.0 g/kg  | 30%  |
| general_health      | TDEE           | 1.6 g/kg  | 30%  |

Carbs fill remaining calories after protein and fat. Carbs_g is floored at 0.

Calorie density: protein = 4 kcal/g, fat = 9 kcal/g, carbs = 4 kcal/g.

```ts
import { calculateMacroTargets } from '@nudge/core/rules/macros'

const result = calculateMacroTargets({ tdee_kcal: 2556, weight_kg: 70, goal: 'muscle_building' })
// → { calories_target: 2812, protein_g: 154, fat_g: 78, carbs_g: 358, ... }
```

---

### Volume — Weekly training volume targets

**File:** `volume.ts`  
**Model:** Simplified MEV/MAV/MRV (Israetel)

| Experience  | Sets/week range |
|-------------|----------------|
| zero        | 8–10           |
| beginner    | 10–12          |
| amateur     | 14–16          |
| advanced    | 16–20          |

Goal modifier: `muscle_building` → max, `strength_performance` → mid, `weight_loss`/`general_health` → min.

Applies to push (chest/shoulders/triceps), pull (back/biceps), and legs. Core gets ~75% of main sets (floor: 6).  
Frequency: 2× per week for most, 3× for high-volume advanced.

```ts
import { recommendedVolume } from '@nudge/core/rules/volume'

const result = recommendedVolume({ experience_level: 'beginner', primary_goal: 'muscle_building' })
// → { push: { sets_per_week: 12, frequency_per_week: 2 }, pull: ..., legs: ..., core: ... }
```

---

### Progression — Double-progression decisions

**File:** `progression.ts`  
**Model:** Double-progression (volume before intensity)

| Condition                                    | Action  |
|----------------------------------------------|---------|
| All N sessions hit top of rep range          | `weight` — increase load |
| Some (not all) sessions hit top             | `reps` — push reps first |
| Last weight dropped >15% from peak          | `deload` — reduce ~10%  |
| No rep improvement across N sessions        | `deload` — reset       |
| Otherwise                                    | `hold`  |

Minimum sessions required before a progression call: 2 (configurable via `minSessions`).

```ts
import { shouldProgress } from '@nudge/core/rules/progression'

const result = shouldProgress([session1, session2])
// → { action: 'weight', reason: '...', weight_delta_kg: null }
```

---

## Guardrails

**Directory:** `guardrails/`  
**Entry point:** `guardrails/index.ts`

Guardrails run before any plan generation. An empty result array = safe to proceed. Any `critical` severity flag = block plan generation.

### Flags

| Flag                  | Trigger                                    | Severity   |
|-----------------------|--------------------------------------------|------------|
| `underage`            | age < 18                                   | critical   |
| `pregnancy`           | is_pregnant = true                         | critical   |
| `bmi_extreme`         | BMI < 16 (severe underweight)              | critical   |
| `bmi_extreme`         | BMI 16–17.5 (underweight)                  | warning    |
| `bmi_extreme`         | BMI > 40 (severe obesity)                  | warning    |
| `low_calorie_intake`  | planned calories < minimum (gender-based)  | warning/critical |
| `rapid_weight_loss`   | > 1%/week body weight loss                 | warning    |
| `rapid_weight_loss`   | > 1.5%/week body weight loss               | critical   |

Minimum safe calorie thresholds: female 1200 kcal, male 1500 kcal, other 1350 kcal.

```ts
import { evaluateGuardrails, hasBlockingGuardrail } from '@nudge/core/rules/guardrails'

const results = evaluateGuardrails(profile, context)
// results = []  → safe

if (hasBlockingGuardrail(results)) {
  // block plan generation, show safety screen
}
```

---

## Testing

```bash
pnpm --filter @nudge/core test            # run tests
pnpm --filter @nudge/core test:coverage   # run with coverage report
```

Coverage target: ≥ 90% lines/statements/functions/branches on all rule files.
