import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Salad, Scale, ChevronRight, CheckCircle2, Circle, AlertCircle, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
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

function MacroTile({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-surface-2 px-3 py-3">
      <span className="text-label uppercase text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-display-m tabular-nums tracking-tight text-foreground">
          {value}
        </span>
        <span className="text-body-s text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

function SupplementList({
  items,
  icon: Icon,
  label,
  tone,
}: {
  items: string[]
  icon: React.ComponentType<{ className?: string }>
  label: string
  tone: 'success' | 'muted' | 'warn'
}) {
  if (items.length === 0) return null
  const iconTone =
    tone === 'success'
      ? 'text-success'
      : tone === 'warn'
        ? 'text-warning'
        : 'text-muted-foreground/60'
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label uppercase text-muted-foreground">{label}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-body-m text-foreground">
            <Icon className={`mt-1 h-3.5 w-3.5 shrink-0 ${iconTone}`} />
            <span>{item}</span>
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
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
        <header className="flex flex-col gap-2">
          <p className="text-label uppercase text-muted-foreground">Jedzenie</p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
            <span className="font-display italic text-muted-foreground">Twoje</span>
            <br />
            <span className="font-sans font-semibold">żywienie.</span>
          </h1>
        </header>

        {!profile?.onboarding_layer_1_done ? (
          <Card variant="hero" padding="xl">
            <div className="flex flex-col items-start gap-5">
              <Salad className="h-8 w-8 text-brand" aria-hidden="true" />
              <div className="flex flex-col gap-2">
                <p className="text-label uppercase text-muted-foreground">Brak profilu</p>
                <p className="text-display-m font-display text-balance">
                  <span className="font-sans font-semibold">Odpowiedz na 3 pytania.</span>
                </p>
                <p className="text-body-m text-muted-foreground">
                  Potrzebujemy kilku danych, żeby dopasować rekomendacje do Ciebie.
                </p>
              </div>
              <Button asChild size="hero" className="gap-2">
                <Link href="/onboarding">
                  Uzupełnij profil
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <Card variant="hero" padding="xl">
            <div className="flex flex-col items-start gap-5">
              <Salad className="h-8 w-8 text-brand" aria-hidden="true" />
              <div className="flex flex-col gap-2">
                <p className="text-label uppercase text-muted-foreground">Gotowy na plan?</p>
                <p className="text-display-m font-display text-balance">
                  <span className="font-sans font-semibold">Wygenerujemy zalecenia dopasowane do Twojego celu.</span>
                </p>
              </div>
              <GenerateNutritionButton />
            </div>
          </Card>
        )}
      </div>
    )
  }

  const supplements = version.supplement_recommendations
  const guidelines = version.practical_guidelines
  const emergency = version.emergency_plan
  const meals = version.meal_distribution ?? []

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-label uppercase text-muted-foreground">Jedzenie</p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
            <span className="font-display italic text-muted-foreground">Twój</span>
            <br />
            <span className="font-sans font-semibold">plan żywieniowy.</span>
          </h1>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/app/nutrition/log-weight">
            <Scale className="h-4 w-4" />
            Waga
          </Link>
        </Button>
      </header>

      {version.mode !== 'simple' && version.calories_target != null && (
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between">
            <CardEyebrow>Dzienne cele</CardEyebrow>
            <Badge variant={version.mode === 'exact' ? 'brand' : 'outline-warm'}>
              {version.mode === 'exact' ? 'Dokładny' : 'Orientacyjny'}
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MacroTile label="Kalorie" value={version.calories_target} unit="kcal" />
            <MacroTile label="Białko" value={version.protein_g_target!} unit="g" />
            <MacroTile label="Węgle" value={version.carbs_g_target!} unit="g" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <MacroTile label="Tłuszcze" value={version.fat_g_target!} unit="g" />
            <MacroTile label="Błonnik" value={version.fiber_g_target!} unit="g" />
            <MacroTile
              label="Woda"
              value={Math.round((version.water_ml_target! / 1000) * 10) / 10}
              unit="l"
            />
          </div>
        </Card>
      )}

      {version.mode === 'simple' && version.water_ml_target != null && (
        <Card variant="recessed" padding="md">
          <div className="flex items-center gap-3">
            <span className="font-mono text-display-m tabular-nums text-brand">
              {Math.round((version.water_ml_target / 1000) * 10) / 10}
            </span>
            <div className="flex flex-col">
              <p className="text-label uppercase text-muted-foreground">Woda dziennie</p>
              <p className="text-body-s text-muted-foreground">Pij regularnie przez dzień</p>
            </div>
          </div>
        </Card>
      )}

      {meals.length > 0 && (
        <Card variant="default" padding="md">
          <CardEyebrow>Rozkład posiłków</CardEyebrow>
          <div className="mt-4 flex flex-col divide-y divide-border/60">
            {meals.map((meal) => (
              <div key={meal.meal} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-[11px] tabular-nums text-background">
                    {meal.meal}
                  </span>
                  <span className="text-body-m font-medium tracking-tight">{meal.name}</span>
                </div>
                <div className="flex items-center gap-3 text-body-s">
                  <span className="font-mono tabular-nums text-muted-foreground">{meal.time}</span>
                  {version.mode !== 'simple' && (
                    <Badge variant="outline-warm" className="font-mono tabular-nums">
                      {Math.round(meal.kcal_share * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {version.strategy_notes && (
        <Card variant="recessed" padding="md">
          <CardEyebrow>Strategia</CardEyebrow>
          <p className="mt-3 text-body-m leading-relaxed text-foreground">
            {version.strategy_notes}
          </p>
        </Card>
      )}

      {guidelines && (
        <Card variant="default" padding="md">
          <CardEyebrow>Wytyczne praktyczne</CardEyebrow>
          <div className="mt-4 flex flex-col gap-5">
            {guidelines.base_products.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-label uppercase text-muted-foreground">Baza diety</p>
                <ul className="flex flex-col gap-1.5">
                  {guidelines.base_products.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-body-m text-foreground">
                      <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guidelines.protein_sources.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
                <p className="text-label uppercase text-muted-foreground">Źródła białka</p>
                <ul className="flex flex-col gap-1.5">
                  {guidelines.protein_sources.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-body-m text-foreground">
                      <Circle className="mt-1 h-3.5 w-3.5 shrink-0 text-brand" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guidelines.limit.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
                <p className="text-label uppercase text-muted-foreground">Ogranicz</p>
                <ul className="flex flex-col gap-1.5">
                  {guidelines.limit.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-body-m text-foreground">
                      <AlertCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-warning" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {supplements && (
        <Card variant="default" padding="md">
          <CardEyebrow>Suplementy</CardEyebrow>
          <div className="mt-4 flex flex-col gap-5">
            <SupplementList
              items={supplements.sensible}
              icon={CheckCircle2}
              label="Warto rozważyć"
              tone="success"
            />
            {supplements.optional.length > 0 && supplements.sensible.length > 0 && (
              <div className="border-t border-border/60" />
            )}
            <SupplementList
              items={supplements.optional}
              icon={Circle}
              label="Opcjonalne"
              tone="muted"
            />
            {supplements.unnecessary.length > 0 &&
              (supplements.sensible.length > 0 || supplements.optional.length > 0) && (
                <div className="border-t border-border/60" />
              )}
            <SupplementList
              items={supplements.unnecessary}
              icon={AlertCircle}
              label="Zbędne na tym etapie"
              tone="warn"
            />
          </div>
        </Card>
      )}

      {emergency && (
        <Card variant="default" padding="md">
          <CardEyebrow>Plan awaryjny</CardEyebrow>
          <p className="mt-1 text-body-s text-muted-foreground">Co robić w trudnych sytuacjach</p>
          <Accordion type="single" collapsible className="mt-3 w-full">
            {(Object.entries(emergency) as [keyof typeof emergency, string][]).map(([key, value]) => (
              <AccordionItem key={key} value={key} className="border-b border-border/60 last:border-b-0">
                <AccordionTrigger className="text-body-m font-medium tracking-tight">
                  {EMERGENCY_LABELS[key] ?? key}
                </AccordionTrigger>
                <AccordionContent className="text-body-m leading-relaxed text-muted-foreground">
                  {value}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      )}

      <Link href="/app/nutrition/log-weight" className="group">
        <Card
          variant="default"
          padding="sm"
          className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
              <Scale className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-body-m font-semibold tracking-tight">Zaloguj wagę</p>
              {lastMeasurement ? (
                <p className="font-mono text-body-s tabular-nums text-muted-foreground">
                  Ostatnio: {Number(lastMeasurement.weight_kg).toFixed(1)} kg ·{' '}
                  {new Date(lastMeasurement.measured_at as string).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              ) : (
                <p className="text-body-s text-muted-foreground">Brak pomiarów</p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
        </Card>
      </Link>

      <AskCoachButton
        entryPoint="meal_shortcut"
        contextEntityType="meal"
        contextEntityId={PLACEHOLDER_NUTRITION_ID}
        prefillMessage="Mam pytanie o swój plan żywieniowy."
        label="Spytaj o produkt lub makro"
      />

      <div className="pt-2">
        <GenerateNutritionButton />
      </div>
    </div>
  )
}
