'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Star, StarOff, AlertTriangle, Pencil, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
      {Array.from({ length: 5 }).map((_, i) =>
        i < stars ? (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ) : (
          <StarOff key={i} className="h-3.5 w-3.5 text-muted-foreground/40" />
        ),
      )}
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
    <div className="flex flex-col items-center rounded-xl bg-muted/50 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-base font-bold tabular-nums">
        {Math.round(min)}–{Math.round(max)}
      </span>
      <span className="text-xs text-muted-foreground">{unit}</span>
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
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="font-medium text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link href="/app/nutrition/log">Wróć</Link>
        </Button>
      </div>
    )
  }

  if (!mealLog || mealLog.status === 'pending_analysis') {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-medium">Analizuję zdjęcie…</p>
        <p className="text-sm text-muted-foreground">
          Zazwyczaj zajmuje to kilka sekund
        </p>
      </div>
    )
  }

  if (mealLog.status === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="font-medium">Nie udało się przeanalizować zdjęcia</p>
        <p className="text-sm text-muted-foreground">
          Możesz dodać posiłek ręcznie.
        </p>
        <Button asChild>
          <Link href="/app/nutrition/log/manual">Dodaj ręcznie</Link>
        </Button>
      </div>
    )
  }

  const items = mealLog.meal_log_items

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {mealLog.meal_type ? (MEAL_TYPE_LABELS[mealLog.meal_type] ?? mealLog.meal_type) : 'Posiłek'}
          </h1>
          {mealLog.confidence_score != null && (
            <div className="mt-1 flex items-center gap-2">
              <ConfidenceStars score={mealLog.confidence_score} />
              <span className="text-xs text-muted-foreground">
                pewność analizy
              </span>
            </div>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/app/nutrition/log/${mealLogId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
            Edytuj
          </Link>
        </Button>
      </div>

      {/* Macro ranges */}
      {mealLog.status === 'analyzed' && (
        <section className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Szacowane wartości (zakres)
          </p>
          <div className="grid grid-cols-2 gap-2">
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
        </section>
      )}

      {/* User warnings */}
      {mealLog.user_warnings && mealLog.user_warnings.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Uwagi
          </p>
          <ul className="flex flex-col gap-1.5">
            {mealLog.user_warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ingredients */}
      {items.length > 0 && (
        <section className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Rozpoznane składniki
          </p>
          <div className="flex flex-col divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.is_user_corrected && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        edytowano
                      </Badge>
                    )}
                  </div>
                  {item.portion_estimate && (
                    <span className="text-xs text-muted-foreground">
                      {item.portion_estimate}
                    </span>
                  )}
                </div>
                {item.kcal_estimate != null && (
                  <span className="ml-3 text-sm font-medium tabular-nums">
                    ~{item.kcal_estimate} kcal
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {mealLog.note && (
        <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Notatka: {mealLog.note}
        </p>
      )}

      <Link
        href="/app/nutrition/today"
        className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
      >
        <span className="text-sm font-medium">Zobacz dzienne podsumowanie</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  )
}
