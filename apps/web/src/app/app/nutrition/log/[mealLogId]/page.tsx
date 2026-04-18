'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Star, AlertTriangle, Pencil, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'

interface MealLogItem {
  id: string
  label: string
  portion_estimate: string | null
  grams_estimate: number | null
  kcal_estimate: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  is_user_corrected: boolean
}

interface MealLog {
  id: string
  status: 'pending_analysis' | 'analyzed' | 'failed' | 'manual'
  meal_type: string | null
  note: string | null
  kcal_estimate_min: number | null
  kcal_estimate_max: number | null
  protein_g_min: number | null
  protein_g_max: number | null
  carbs_g_min: number | null
  carbs_g_max: number | null
  fat_g_min: number | null
  fat_g_max: number | null
  confidence_score: number | null
  user_warnings: string[] | null
  meal_log_items: MealLogItem[]
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Śniadanie',
  lunch: 'Obiad',
  dinner: 'Kolacja',
  snack: 'Przekąska',
  drink: 'Napój',
  dessert: 'Deser',
}

function ConfidenceStars({ score }: { score: number }) {
  const stars = Math.round(score * 5)
  return (
    <div className="flex items-center gap-0.5" aria-label={`Pewność: ${stars}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < stars ? 'fill-brand text-brand' : 'fill-transparent text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

function MacroRange({
  label,
  min,
  max,
  unit,
}: {
  label: string
  min: number | null
  max: number | null
  unit: string
}) {
  if (min == null || max == null) return null
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-surface-2 px-3 py-3">
      <span className="text-label uppercase text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-display-m tabular-nums tracking-tight text-foreground">
          {Math.round(min)}
          <span className="text-muted-foreground">–</span>
          {Math.round(max)}
        </span>
        <span className="text-body-s text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

export default function MealLogResultPage() {
  const { mealLogId } = useParams<{ mealLogId: string }>()
  const [mealLog, setMealLog] = useState<MealLog | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function fetchLog() {
      try {
        const res = await fetch(`/api/meal/${mealLogId}`)
        if (!res.ok) {
          setError('Nie znaleziono wpisu')
          return
        }
        const { mealLog: data } = await res.json() as { mealLog: MealLog }
        if (!cancelled) {
          setMealLog(data)
          if (data.status !== 'pending_analysis' && intervalId) {
            clearInterval(intervalId)
          }
        }
      } catch {
        if (!cancelled) setError('Błąd wczytywania')
      }
    }

    void fetchLog()

    intervalId = setInterval(() => {
      if (mealLog?.status !== 'pending_analysis') {
        if (intervalId) clearInterval(intervalId)
        return
      }
      void fetchLog()
    }, 3000)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealLogId])

  if (error) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-5 pt-16 pb-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-display-m font-display text-balance">
          <span className="font-sans font-semibold">{error}</span>
        </p>
        <Button asChild variant="outline">
          <Link href="/app/nutrition/log">Wróć</Link>
        </Button>
      </div>
    )
  }

  if (!mealLog || mealLog.status === 'pending_analysis') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-5 pt-16 pb-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
        <div className="flex flex-col gap-2">
          <p className="text-display-m font-display text-balance">
            <span className="font-display italic text-muted-foreground">Analizuję —</span>
            <br />
            <span className="font-sans font-semibold">chwilę.</span>
          </p>
          <p className="text-body-m text-muted-foreground">
            Zazwyczaj zajmuje to kilka sekund.
          </p>
        </div>
      </div>
    )
  }

  if (mealLog.status === 'failed') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-5 pt-16 pb-24 text-center">
        <AlertTriangle className="h-10 w-10 text-warning" />
        <div className="flex flex-col gap-2">
          <p className="text-display-m font-display text-balance">
            <span className="font-sans font-semibold">Nie udało się przeanalizować.</span>
          </p>
          <p className="text-body-m text-muted-foreground">Możesz dodać posiłek ręcznie.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/app/nutrition/log/manual">Dodaj ręcznie</Link>
        </Button>
      </div>
    )
  }

  const items = mealLog.meal_log_items

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app/nutrition/today"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
        Dzisiaj
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-label uppercase text-muted-foreground">Posiłek</p>
          <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
            <span className="font-sans font-semibold">
              {mealLog.meal_type ? (MEAL_TYPE_LABELS[mealLog.meal_type] ?? mealLog.meal_type) : 'Posiłek'}
            </span>
          </h1>
          {mealLog.confidence_score != null && (
            <div className="mt-1 flex items-center gap-2">
              <ConfidenceStars score={mealLog.confidence_score} />
              <span className="text-body-s text-muted-foreground">pewność analizy</span>
            </div>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/app/nutrition/log/${mealLogId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
            Edytuj
          </Link>
        </Button>
      </header>

      {mealLog.status === 'analyzed' && (
        <Card variant="default" padding="md">
          <CardEyebrow>Szacowane wartości (zakres)</CardEyebrow>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MacroRange
              label="Kalorie"
              min={mealLog.kcal_estimate_min}
              max={mealLog.kcal_estimate_max}
              unit="kcal"
            />
            <MacroRange
              label="Białko"
              min={mealLog.protein_g_min}
              max={mealLog.protein_g_max}
              unit="g"
            />
            <MacroRange
              label="Węgle"
              min={mealLog.carbs_g_min}
              max={mealLog.carbs_g_max}
              unit="g"
            />
            <MacroRange
              label="Tłuszcze"
              min={mealLog.fat_g_min}
              max={mealLog.fat_g_max}
              unit="g"
            />
          </div>
        </Card>
      )}

      {mealLog.user_warnings && mealLog.user_warnings.length > 0 && (
        <Card variant="destructive" padding="md">
          <CardEyebrow className="text-destructive">Uwagi</CardEyebrow>
          <ul className="mt-3 flex flex-col gap-2">
            {mealLog.user_warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2.5 text-body-m text-foreground">
                <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0 text-destructive" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {items.length > 0 && (
        <Card variant="default" padding="md">
          <CardEyebrow>Rozpoznane składniki</CardEyebrow>
          <div className="mt-3 flex flex-col divide-y divide-border/60">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-body-m font-medium tracking-tight">{item.label}</span>
                    {item.is_user_corrected && (
                      <Badge variant="label" className="px-0 text-[10px]">
                        edytowano
                      </Badge>
                    )}
                  </div>
                  {item.portion_estimate && (
                    <span className="mt-0.5 font-mono text-body-s tabular-nums text-muted-foreground">
                      {item.portion_estimate}
                    </span>
                  )}
                </div>
                {item.kcal_estimate != null && (
                  <span className="shrink-0 font-mono text-body-m tabular-nums text-foreground">
                    ~{item.kcal_estimate}
                    <span className="ml-1 text-body-s text-muted-foreground">kcal</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {mealLog.note && (
        <Card variant="recessed" padding="md">
          <CardEyebrow>Notatka</CardEyebrow>
          <p className="mt-2 text-body-m leading-relaxed text-foreground">{mealLog.note}</p>
        </Card>
      )}

      <Link href="/app/nutrition/today" className="group">
        <Card
          variant="default"
          padding="sm"
          className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
        >
          <span className="text-body-m font-semibold tracking-tight">
            Zobacz dzienne podsumowanie
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
        </Card>
      </Link>
    </div>
  )
}
