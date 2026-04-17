'use client'

import { useState } from 'react'
import { calculateBMR } from '@nudge/core/rules/bmr'
import { calculateTDEE } from '@nudge/core/rules/tdee'
import { calculateMacroTargets } from '@nudge/core/rules/macros'
import { recommendedVolume } from '@nudge/core/rules/volume'
import { shouldProgress } from '@nudge/core/rules/progression'
import { evaluateGuardrails, hasBlockingGuardrail } from '@nudge/core/rules/guardrails'
import type { ActivityLevel, PrimaryGoal, ExperienceLevel, Gender } from '@nudge/core/domain/profile'
import type { ExerciseSession } from '@nudge/core/rules/progression'
import type { GuardrailProfile, GuardrailContext } from '@nudge/core/rules/guardrails'

// ─── shared input state ──────────────────────────────────────────────────────

interface InputState {
  weight_kg: string
  height_cm: string
  age: string
  gender: Gender | ''
  activity_level: ActivityLevel | ''
  goal: PrimaryGoal | ''
  experience_level: ExperienceLevel | ''
  planned_calories: string
  is_pregnant: boolean
}

const DEFAULT_STATE: InputState = {
  weight_kg: '75',
  height_cm: '178',
  age: '30',
  gender: 'male',
  activity_level: 'moderate',
  goal: 'muscle_building',
  experience_level: 'beginner',
  planned_calories: '2200',
  is_pregnant: false,
}

// ─── demo progression sessions ───────────────────────────────────────────────

const DEMO_SESSIONS: ExerciseSession[] = [
  { weight_kg: 80, total_reps: 30, target_total_reps: 30, hit_top_of_range: true },
  { weight_kg: 80, total_reps: 30, target_total_reps: 30, hit_top_of_range: true },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function n(s: string): number | null {
  const v = parseFloat(s)
  return isNaN(v) || v <= 0 ? null : v
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  )
}

function Result({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-mono text-gray-900 text-right">{JSON.stringify(value)}</span>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-600 font-medium">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'border border-gray-300 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400'
const selectCls =
  'border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white'

// ─── main component ───────────────────────────────────────────────────────────

export function CalculatorsSandbox() {
  const [inp, setInp] = useState<InputState>(DEFAULT_STATE)

  function set<K extends keyof InputState>(k: K, v: InputState[K]) {
    setInp((prev) => ({ ...prev, [k]: v }))
  }

  const bmrInput = {
    weight_kg: n(inp.weight_kg),
    height_cm: n(inp.height_cm),
    age: n(inp.age),
    gender: inp.gender || null,
  }

  const bmr = calculateBMR(bmrInput)

  const tdee = calculateTDEE({
    ...bmrInput,
    activity_level: (inp.activity_level || null) as ActivityLevel | null,
  })

  const macros =
    tdee && bmrInput.weight_kg
      ? calculateMacroTargets({
          tdee_kcal: tdee.tdee_kcal,
          weight_kg: bmrInput.weight_kg,
          goal: (inp.goal || 'general_health') as PrimaryGoal,
        })
      : null

  const volume = recommendedVolume({
    experience_level: (inp.experience_level || null) as ExperienceLevel | null,
    primary_goal: (inp.goal || null) as PrimaryGoal | null,
  })

  const progression = shouldProgress(DEMO_SESSIONS)

  const guardrailProfile: GuardrailProfile = {
    age: n(inp.age),
    gender: (inp.gender || null) as Gender | null,
    weight_kg: n(inp.weight_kg),
    height_cm: n(inp.height_cm),
    is_pregnant: inp.is_pregnant,
  }
  const guardrailContext: GuardrailContext = {
    planned_calories: n(inp.planned_calories),
    recent_weights: null,
  }
  const guardrails = evaluateGuardrails(guardrailProfile, guardrailContext)
  const isBlocked = hasBlockingGuardrail(guardrails)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <span className="bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">
            DEV ONLY
          </span>
          <h1 className="text-xl font-bold text-gray-900">Calculators Sandbox</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── Inputs ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <Section title="Inputs">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Weight (kg)">
                  <input
                    className={inputCls}
                    value={inp.weight_kg}
                    onChange={(e) => set('weight_kg', e.target.value)}
                  />
                </Field>
                <Field label="Height (cm)">
                  <input
                    className={inputCls}
                    value={inp.height_cm}
                    onChange={(e) => set('height_cm', e.target.value)}
                  />
                </Field>
                <Field label="Age (years)">
                  <input
                    className={inputCls}
                    value={inp.age}
                    onChange={(e) => set('age', e.target.value)}
                  />
                </Field>
                <Field label="Planned calories">
                  <input
                    className={inputCls}
                    value={inp.planned_calories}
                    onChange={(e) => set('planned_calories', e.target.value)}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    className={selectCls}
                    value={inp.gender}
                    onChange={(e) => set('gender', e.target.value as Gender)}
                  >
                    <option value="">—</option>
                    <option value="male">male</option>
                    <option value="female">female</option>
                    <option value="other">other</option>
                    <option value="prefer_not_to_say">prefer_not_to_say</option>
                  </select>
                </Field>
                <Field label="Activity level">
                  <select
                    className={selectCls}
                    value={inp.activity_level}
                    onChange={(e) => set('activity_level', e.target.value as ActivityLevel)}
                  >
                    <option value="">—</option>
                    <option value="sedentary">sedentary</option>
                    <option value="light">light</option>
                    <option value="moderate">moderate</option>
                    <option value="active">active</option>
                    <option value="very_active">very_active</option>
                  </select>
                </Field>
                <Field label="Goal">
                  <select
                    className={selectCls}
                    value={inp.goal}
                    onChange={(e) => set('goal', e.target.value as PrimaryGoal)}
                  >
                    <option value="">—</option>
                    <option value="weight_loss">weight_loss</option>
                    <option value="muscle_building">muscle_building</option>
                    <option value="strength_performance">strength_performance</option>
                    <option value="general_health">general_health</option>
                  </select>
                </Field>
                <Field label="Experience level">
                  <select
                    className={selectCls}
                    value={inp.experience_level}
                    onChange={(e) => set('experience_level', e.target.value as ExperienceLevel)}
                  >
                    <option value="">—</option>
                    <option value="zero">zero</option>
                    <option value="beginner">beginner</option>
                    <option value="amateur">amateur</option>
                    <option value="advanced">advanced</option>
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={inp.is_pregnant}
                  onChange={(e) => set('is_pregnant', e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-600">is_pregnant</span>
              </label>
            </Section>
          </div>

          {/* ── Results ────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <Section title="BMR">
              {bmr ? (
                <>
                  <Result label="bmr_kcal" value={bmr.bmr_kcal} />
                  <Result label="formula" value={bmr.formula} />
                  <Result label="gender_used" value={bmr.gender_used} />
                </>
              ) : (
                <p className="text-sm text-red-500">null — missing inputs</p>
              )}
            </Section>

            <Section title="TDEE">
              {tdee ? (
                <>
                  <Result label="tdee_kcal" value={tdee.tdee_kcal} />
                  <Result label="activity_level" value={tdee.activity_level} />
                  <Result label="activity_factor" value={tdee.activity_factor} />
                </>
              ) : (
                <p className="text-sm text-red-500">null — missing inputs</p>
              )}
            </Section>

            <Section title="Macros">
              {macros ? (
                <>
                  <Result label="calories_target" value={macros.calories_target} />
                  <Result label="protein_g" value={macros.protein_g} />
                  <Result label="fat_g" value={macros.fat_g} />
                  <Result label="carbs_g" value={macros.carbs_g} />
                  <Result label="deficit_or_surplus_pct" value={macros.deficit_or_surplus_pct} />
                </>
              ) : (
                <p className="text-sm text-red-500">null — TDEE required</p>
              )}
            </Section>

            <Section title="Volume (push/pull/legs/core)">
              <Result label="push sets/week" value={volume.push.sets_per_week} />
              <Result label="pull sets/week" value={volume.pull.sets_per_week} />
              <Result label="legs sets/week" value={volume.legs.sets_per_week} />
              <Result label="core sets/week" value={volume.core.sets_per_week} />
              <Result label="frequency/week" value={volume.push.frequency_per_week} />
            </Section>

            <Section title="Progression (demo 2 sessions, both hit top)">
              <Result label="action" value={progression.action} />
              <Result label="reason" value={progression.reason} />
              <Result label="weight_delta_kg" value={progression.weight_delta_kg} />
            </Section>

            <Section title="Guardrails">
              {guardrails.length === 0 ? (
                <p className="text-sm text-green-600 font-medium">No flags — safe to proceed.</p>
              ) : (
                <div className="space-y-2">
                  <p className={`text-sm font-semibold ${isBlocked ? 'text-red-600' : 'text-yellow-600'}`}>
                    {isBlocked ? 'BLOCKED' : 'WARNINGS'}
                  </p>
                  {guardrails.map((g) => (
                    <div
                      key={g.flag}
                      className={`rounded p-2 text-xs space-y-1 ${
                        g.severity === 'critical'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-yellow-50 border border-yellow-200'
                      }`}
                    >
                      <div className="font-semibold">{g.flag} ({g.severity})</div>
                      <div className="text-gray-700">{g.message}</div>
                      <div className="font-mono text-gray-500">{g.restrictions.join(', ')}</div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}
