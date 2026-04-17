import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Salad, Scale, ChevronRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { GenerateNutritionButton } from './GenerateNutritionButton'
import { AskCoachButton } from '@/components/coach/AskCoachButton'

const PLACEHOLDER_NUTRITION_ID = '00000000-0000-0000-0000-000000000000'

export const metadata: Metadata = { title: 'Jedzenie' }

interface NutritionVersion {
  id: string
  version_number: number
  mode: 'simple' | 'ranges' | 'exact'
  calories_target: number | null
  protein_g_target: number | null
  fat_g_target: number | null
  carbs_g_target: number | null
  fiber_g_target: number | null
  water_ml_target: number | null
  meal_distribution: Array<{ meal: number; name: string; kcal_share: number; time: string }> | null
  strategy_notes: string | null
  practical_guidelines: {
    base_products: string[]
    protein_sources: string[]
    limit: string[]
  } | null
  supplement_recommendations: {
    sensible: string[]
    optional: string[]
    unnecessary: string[]
  } | null
  emergency_plan: {
    no_time: string
    party: string
    hunger: string
    low_energy: string
    stagnation: string
  } | null
}

function MacroCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-muted/50 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  )
}

function SupplementList({
  items,
  icon: Icon,
  label,
  className,
}: {
  items: string[]
  icon: React.ComponentType<{ className?: string }>
  label: string
  className?: string
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1">
      <p className={`text-xs font-medium uppercase tracking-wide ${className}`}>{label}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm">
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

const EMERGENCY_LABELS: Record<string, string> = {
  no_time: 'Brak czasu na gotowanie',
  party: 'Impreza / wyjście',
  hunger: 'Silny głód',
  low_energy: 'Spadek energii',
  stagnation: 'Stagnacja / brak efektów',
}

export default async function NutritionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: planRow }, { data: profile }, { data: lastMeasurement }] = await Promise.all([
    supabase
      .from('nutrition_plans')
      .select(`
        id, started_at,
        current_version:nutrition_plan_versions!nutrition_plans_current_version_fk (
          id, version_number, mode,
          calories_target, protein_g_target, fat_g_target, carbs_g_target,
          fiber_g_target, water_ml_target,
          meal_distribution, strategy_notes, practical_guidelines,
          supplement_recommendations, emergency_plan
        )
      `)
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_profile')
      .select('onboarding_layer_1_done, onboarding_layer_2_done')
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('body_measurements')
      .select('weight_kg, measured_at')
      .eq('user_id', user!.id)
      .not('weight_kg', 'is', null)
      .order('measured_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const version = planRow?.current_version as NutritionVersion | null

  if (!version) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <h1 className="text-2xl font-semibold">Jedzenie</h1>

        {!profile?.onboarding_layer_1_done ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
            <Salad className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">Odpowiedz na 3 pytania, żeby otrzymać plan</p>
            <p className="text-xs text-muted-foreground">
              Potrzebujemy podstawowych danych, żeby dopasować zalecenia do Ciebie.
            </p>
            <Button asChild size="sm">
              <Link href="/onboarding">Uzupełnij profil</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <Salad className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Gotowy na plan żywieniowy?</p>
                <p className="text-sm text-muted-foreground">
                  Wygenerujemy zalecenia dopasowane do Twojego celu i stylu życia.
                </p>
              </div>
            </div>
            <GenerateNutritionButton />
          </div>
        )}
      </div>
    )
  }

  const supplements = version.supplement_recommendations
  const guidelines = version.practical_guidelines
  const emergency = version.emergency_plan
  const meals = version.meal_distribution ?? []

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jedzenie</h1>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/app/nutrition/log-weight">
            <Scale className="h-4 w-4" />
            Waga
          </Link>
        </Button>
      </div>

      {/* Targets header — only for ranges and exact mode */}
      {version.mode !== 'simple' && version.calories_target != null && (
        <section className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Dzienne cele</p>
            <Badge variant="secondary">{version.mode === 'exact' ? 'Dokładny' : 'Orientacyjny'}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MacroCard label="Kalorie" value={version.calories_target} unit="kcal" />
            <MacroCard label="Białko" value={version.protein_g_target!} unit="g" />
            <MacroCard label="Węgle" value={version.carbs_g_target!} unit="g" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <MacroCard label="Tłuszcze" value={version.fat_g_target!} unit="g" />
            <MacroCard label="Błonnik" value={version.fiber_g_target!} unit="g" />
            <MacroCard label="Woda" value={Math.round(version.water_ml_target! / 1000 * 10) / 10} unit="l" />
          </div>
        </section>
      )}

      {/* Simple mode — water reminder */}
      {version.mode === 'simple' && version.water_ml_target != null && (
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
          <span className="text-lg">💧</span>
          <span>
            Pij około <strong>{Math.round(version.water_ml_target / 1000 * 10) / 10} l</strong> wody dziennie
          </span>
        </div>
      )}

      {/* Meal distribution */}
      {meals.length > 0 && (
        <section className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Rozkład posiłków</p>
          <div className="space-y-2">
            {meals.map((meal) => (
              <div key={meal.meal} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {meal.meal}
                  </span>
                  <span className="font-medium">{meal.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{meal.time}</span>
                  {version.mode !== 'simple' && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(meal.kcal_share * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Strategy notes */}
      {version.strategy_notes && (
        <section className="rounded-xl border bg-card p-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">Strategia</p>
          <p className="text-sm leading-relaxed">{version.strategy_notes}</p>
        </section>
      )}

      {/* Practical guidelines */}
      {guidelines && (
        <section className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Wytyczne praktyczne</p>
          <div className="space-y-4">
            {guidelines.base_products.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Baza diety
                </p>
                <ul className="space-y-1">
                  {guidelines.base_products.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guidelines.protein_sources.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Źródła białka
                </p>
                <ul className="space-y-1">
                  {guidelines.protein_sources.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guidelines.limit.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ogranicz
                </p>
                <ul className="space-y-1">
                  {guidelines.limit.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Supplements */}
      {supplements && (
        <section className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Suplementy</p>
          <div className="space-y-4">
            <SupplementList
              items={supplements.sensible}
              icon={CheckCircle2}
              label="Warto rozważyć"
              className="text-green-600 dark:text-green-400"
            />
            <SupplementList
              items={supplements.optional}
              icon={Circle}
              label="Opcjonalne"
              className="text-muted-foreground"
            />
            <SupplementList
              items={supplements.unnecessary}
              icon={AlertCircle}
              label="Zbędne na tym etapie"
              className="text-muted-foreground"
            />
          </div>
        </section>
      )}

      {/* Emergency plan — accordion */}
      {emergency && (
        <section className="rounded-xl border bg-card p-4">
          <p className="mb-1 text-sm font-medium text-muted-foreground">Plan awaryjny</p>
          <p className="mb-3 text-xs text-muted-foreground">Co robić w trudnych sytuacjach</p>
          <Accordion type="single" collapsible className="w-full">
            {(Object.entries(emergency) as [keyof typeof emergency, string][]).map(([key, value]) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="text-sm font-normal">
                  {EMERGENCY_LABELS[key] ?? key}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {value}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* Quick weight log CTA */}
      <Link
        href="/app/nutrition/log-weight"
        className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Zaloguj wagę</p>
            {lastMeasurement ? (
              <p className="text-xs text-muted-foreground">
                Ostatni pomiar:{' '}
                {Number(lastMeasurement.weight_kg).toFixed(1)} kg —{' '}
                {new Date(lastMeasurement.measured_at as string).toLocaleDateString('pl-PL')}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Brak pomiarów</p>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Ask coach about diet */}
      <AskCoachButton
        entryPoint="meal_shortcut"
        contextEntityType="meal"
        contextEntityId={PLACEHOLDER_NUTRITION_ID}
        prefillMessage="Mam pytanie o swój plan żywieniowy."
        label="Spytaj o produkt lub makro"
      />

      {/* Regenerate */}
      <div className="pb-4">
        <GenerateNutritionButton />
      </div>
    </div>
  )
}
