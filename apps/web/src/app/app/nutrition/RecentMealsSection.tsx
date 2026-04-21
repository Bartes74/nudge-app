'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, PenLine, Trash2, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export interface RecentMealRow {
  id: string
  meal_type: string | null
  status: 'pending_analysis' | 'analyzed' | 'failed' | 'manual'
  note: string | null
  kcal_estimate_min: number | null
  kcal_estimate_max: number | null
  created_at: string
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Śniadanie',
  lunch: 'Obiad',
  dinner: 'Kolacja',
  snack: 'Przekąska',
  drink: 'Napój',
  dessert: 'Deser',
}

function formatKcalRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Brak estymacji'
  if (min != null && max != null) {
    if (Math.round(min) === Math.round(max)) return `${Math.round(min)} kcal`
    return `${Math.round(min)}-${Math.round(max)} kcal`
  }

  const value = min ?? max
  return value == null ? 'Brak estymacji' : `${Math.round(value)} kcal`
}

function statusLabel(status: RecentMealRow['status']): string {
  if (status === 'pending_analysis') return 'Analiza'
  if (status === 'failed') return 'Błąd'
  if (status === 'manual') return 'Ręcznie'
  return 'Gotowe'
}

export function RecentMealsSection({
  initialMeals,
}: {
  initialMeals: RecentMealRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null)
  const [meals, setMeals] = useState(initialMeals)

  const isEmpty = meals.length === 0
  const deletingAnyMeal = deletingMealId != null || isPending

  const sortedMeals = useMemo(
    () => [...meals].sort((left, right) => right.created_at.localeCompare(left.created_at)),
    [meals],
  )

  async function handleDelete(mealId: string) {
    const confirmed = window.confirm('Usunąć ten posiłek z listy?')
    if (!confirmed) return

    setDeletingMealId(mealId)

    try {
      const response = await fetch(`/api/meal/${mealId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? 'Nie udało się usunąć posiłku.')
      }

      setMeals((currentMeals) => currentMeals.filter((meal) => meal.id !== mealId))
      toast.success('Posiłek został usunięty.')
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Nie udało się usunąć posiłku.'
      toast.error(message)
    } finally {
      setDeletingMealId(null)
    }
  }

  return (
    <section className="ds-section flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="ds-label">Dzisiejsze wpisy</p>
          <h2 className="font-display text-[28px] tracking-[-0.02em] text-[var(--fg-primary)]">
            Ostatnie posiłki
          </h2>
        </div>
        <Link
          href="/app/nutrition/log"
          className="ds-label transition-colors hover:text-[var(--fg-primary)]"
        >
          Dodaj
        </Link>
      </div>

      {isEmpty ? (
        <Card variant="recessed" padding="md" className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-muted text-brand">
              <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-body-m font-semibold tracking-tight text-foreground">
                Dzisiaj jeszcze nic nie zapisano
              </p>
              <p className="text-body-s text-muted-foreground">
                Możesz dodać zdjęcie posiłku albo wpisać składniki ręcznie.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link href="/app/nutrition/log/photo" className="group">
              <Card
                variant="default"
                padding="sm"
                className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
              >
                <span className="text-body-m font-semibold tracking-tight">Dodaj zdjęcie</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
              </Card>
            </Link>
            <Link href="/app/nutrition/log/manual" className="group">
              <Card
                variant="default"
                padding="sm"
                className="flex items-center justify-between gap-4 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
              >
                <span className="text-body-m font-semibold tracking-tight">Wpisz ręcznie</span>
                <PenLine className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
              </Card>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sortedMeals.map((meal) => {
            const isDeletingThisMeal = deletingMealId === meal.id

            return (
              <Card
                key={meal.id}
                variant="default"
                padding="sm"
                className="flex items-center gap-3 transition-[border-color,background-color] hover:border-foreground/30 hover:bg-surface-2/60"
              >
                <Link
                  href={`/app/nutrition/log/${meal.id}`}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-body-m font-semibold tracking-tight text-foreground">
                      {meal.meal_type ? (MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type) : 'Posiłek'}
                    </span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {statusLabel(meal.status)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-body-s tabular-nums text-muted-foreground">
                    {new Date(meal.created_at).toLocaleTimeString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    <span className="mx-1.5 opacity-40">·</span>
                    {formatKcalRange(meal.kcal_estimate_min, meal.kcal_estimate_max)}
                  </p>
                  {meal.note && (
                    <p className="mt-1 truncate text-body-s text-muted-foreground">{meal.note}</p>
                  )}
                </Link>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  disabled={deletingAnyMeal}
                  isLoading={isDeletingThisMeal}
                  onClick={() => void handleDelete(meal.id)}
                  aria-label="Usuń posiłek"
                >
                  {!isDeletingThisMeal && <Trash2 className="h-4 w-4" />}
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
