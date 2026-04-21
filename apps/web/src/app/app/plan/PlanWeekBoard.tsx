'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Reorder, useDragControls } from 'framer-motion'
import {
  ArrowUpRight,
  ChevronRight,
  Clock,
  GripVertical,
  Info,
  RotateCcw,
  Save,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { PageHero, SectionHeader } from '@/components/layout/PageHero'
import { GeneratePlanButton } from './GeneratePlanButton'
import { DeleteTrainingPlanButton } from './DeleteTrainingPlanButton'
import {
  DAY_ORDER,
  DAY_SHORT,
  type DayLabel,
  guidedWeekExplanation,
  type PlanWorkoutVisualStatus,
  progressionCopy,
  trainingStreakWarning,
  workoutDisplayCount,
  workoutDisplayDuration,
} from '@/lib/training/weekPlan'
import { cn } from '@/lib/utils'

type PlanWorkout = {
  id: string
  day_label: string
  order_in_week: number
  name: string
  duration_min_estimated: number
  steps?: Array<{ id: string; step_type: string; duration_min: number | null }> | null
  exercises?: Array<{ id: string }> | null
}

type PlanVersion = {
  id: string
  guided_mode?: boolean | null
  adaptation_phase?: string | null
  view_mode?: 'guided_beginner_view' | 'standard_training_view' | null
  progression_rules: { method: string; add_weight_kg: number; when: string } | null
  workouts: PlanWorkout[]
}

type WeekItem = {
  key: string
  workout: PlanWorkout | null
}

function buildWeekItems(workouts: PlanWorkout[]): WeekItem[] {
  const workoutsByDay = Object.fromEntries(
    workouts
      .filter((workout) => DAY_ORDER.includes(workout.day_label as DayLabel))
      .map((workout) => [workout.day_label, workout]),
  ) as Partial<Record<DayLabel, PlanWorkout>>

  return DAY_ORDER.map((day) => ({
    key: workoutsByDay[day]?.id ?? `rest-${day}`,
    workout: workoutsByDay[day] ?? null,
  }))
}

function weekSignature(items: WeekItem[]): string {
  return items.map((item) => item.workout?.id ?? 'rest').join('|')
}

function DayRow({
  dayLabel,
  item,
  status,
}: {
  dayLabel: DayLabel
  item: WeekItem
  status: PlanWorkoutVisualStatus | null
}) {
  const dragControls = useDragControls()
  const workout = item.workout

  if (!workout) {
    return (
      <Reorder.Item
        as="div"
        value={item}
        dragListener={false}
        className="list-none"
      >
        <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/60 px-4 py-3">
          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {DAY_SHORT[dayLabel]}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-body-s text-muted-foreground/70">Odpoczynek</p>
            <p className="text-body-s text-muted-foreground/50">
              Możesz przeciągnąć tu trening z innego dnia.
            </p>
          </div>
        </div>
      </Reorder.Item>
    )
  }

  const count = workoutDisplayCount(workout)
  const duration = workoutDisplayDuration(workout)
  const isCompleted = status === 'completed'
  const isMissed = status === 'missed'

  return (
    <Reorder.Item
      as="div"
      value={item}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ scale: 1.01 }}
      className="list-none"
    >
      <Card
        variant="default"
        padding="sm"
        className={cn(
          'flex items-center justify-between gap-3 border-border/80 shadow-lift-sm',
          isCompleted &&
            'border-[var(--border-accent)] bg-[var(--bg-accent-sage-soft)]',
          isMissed &&
            'border-[var(--copper-300)] bg-[var(--bg-accent-copper-soft)]',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onPointerDown={(event) => dragControls.start(event)}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground active:scale-[0.98]',
              isCompleted &&
                'border-[var(--border-accent)] bg-[var(--bg-accent-sage-soft)] text-[var(--fg-accent-sage)]',
              isMissed &&
                'border-[var(--copper-300)] bg-[var(--bg-accent-copper-soft)] text-[var(--fg-accent-copper)]',
            )}
            aria-label={`Przeciągnij trening na inny dzień: ${workout.name}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div
            className={cn(
              'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-2 text-center',
              isCompleted && 'bg-[var(--bg-accent-sage-soft)]',
              isMissed && 'bg-[var(--bg-accent-copper-soft)]',
            )}
          >
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {DAY_SHORT[dayLabel]}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-body-m font-semibold tracking-tight">
              {workout.name}
            </p>
            <p className="mt-0.5 text-body-s text-muted-foreground">
              <span className="font-mono tabular-nums">{count.count}</span> {count.label}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant={isCompleted ? 'success' : isMissed ? 'destructive' : 'outline-warm'}
            className="gap-1 font-mono tabular-nums"
          >
            <Clock className="h-3 w-3" />
            {duration} min
          </Badge>
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Link href={`/app/plan/workout/${workout.id}`} aria-label={`Otwórz ${workout.name}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </Reorder.Item>
  )
}

export function PlanWeekBoard({
  version,
  workoutStatusById,
}: {
  version: PlanVersion
  workoutStatusById: Record<string, PlanWorkoutVisualStatus>
}) {
  const router = useRouter()
  const [items, setItems] = useState<WeekItem[]>(() => buildWeekItems(version.workouts))
  const [initialItems, setInitialItems] = useState<WeekItem[]>(() => buildWeekItems(version.workouts))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const nextItems = buildWeekItems(version.workouts)
    setItems(nextItems)
    setInitialItems(nextItems)
  }, [version])

  const isDirty = useMemo(
    () => weekSignature(items) !== weekSignature(initialItems),
    [initialItems, items],
  )

  const streakWarning = useMemo(
    () =>
      trainingStreakWarning(
        items.map((item) => ({
          workoutId: item.workout?.id ?? null,
        })),
      ),
    [items],
  )

  const progression = progressionCopy(version.progression_rules)
  const guidedExplanation =
    version.view_mode === 'guided_beginner_view' || version.guided_mode
      ? guidedWeekExplanation(version.adaptation_phase ?? null)
      : null

  async function handleSave(): Promise<void> {
    if (!isDirty) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/plan/training/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignments: DAY_ORDER.map((dayLabel, index) => ({
            dayLabel,
            workoutId: items[index]?.workout?.id ?? null,
          })),
        }),
      })

      const result = (await res.json()) as { error?: string; warning?: string }
      if (!res.ok) {
        throw new Error(result.error ?? 'Nie udało się zapisać układu tygodnia.')
      }

      toast.success('Zapisaliśmy nowy układ tygodnia.')
      if (result.warning) toast.message(result.warning)
      setInitialItems(items)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać zmian.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleReset(): void {
    setItems(initialItems)
  }

  return (
    <>
      <PageHero
        eyebrow="Plan"
        titleEmphasis="Tydzień"
        titleMain="treningowy."
        lede="Przejrzyj tygodniowy rozkład treningów i dopasuj dni do swojego rytmu."
        action={(
          <Link
            href="/app/plan/history"
            className="ds-label inline-flex items-center gap-1 text-[var(--fg-secondary)] transition-colors hover:text-[var(--fg-primary)]"
          >
            Historia
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      />

      {guidedExplanation && (
        <Card variant="recessed" padding="md">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-2">
              <CardEyebrow>Jak czytać ten plan</CardEyebrow>
              <p className="text-body-m leading-relaxed text-foreground">
                {guidedExplanation}
              </p>
              <p className="text-body-s text-muted-foreground">
                Przytrzymaj uchwyt po lewej i przeciągnij trening na inny dzień, jeśli tak Ci wygodniej.
              </p>
            </div>
          </div>
        </Card>
      )}

      <section className="ds-section flex flex-col gap-6">
        <SectionHeader
          number="01 — Tydzień"
          title="Harmonogram treningów"
          description="Przeciągnij trening na inny dzień, jeśli tak Ci wygodniej."
        />
        <Reorder.Group
          as="div"
          axis="y"
          values={items}
          onReorder={setItems}
          className="flex flex-col gap-2.5"
        >
          {DAY_ORDER.map((dayLabel, index) => (
            <DayRow
              key={items[index]?.key ?? dayLabel}
              dayLabel={dayLabel}
              item={items[index]!}
              status={items[index]?.workout ? workoutStatusById[items[index]!.workout!.id] ?? null : null}
            />
          ))}
        </Reorder.Group>

        <div className="flex flex-wrap gap-2 pt-1">
          <GeneratePlanButton label="Wygeneruj nowy plan" />
          <DeleteTrainingPlanButton />
        </div>
      </section>

      {(isDirty || streakWarning) && (
        <Card
          variant={streakWarning ? 'destructive' : 'recessed'}
          padding="md"
          className={cn(!streakWarning && 'border border-border/70')}
        >
          <div className="flex items-start gap-3">
            {streakWarning ? (
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-col gap-1">
                <CardEyebrow>{streakWarning ? 'Regeneracja' : 'Zmiany w tygodniu'}</CardEyebrow>
                <p className="text-body-m leading-relaxed text-foreground">
                  {streakWarning ?? 'Możesz zapisać nowy układ tygodnia, jeśli ten rozkład będzie dla Ciebie wygodniejszy.'}
                </p>
              </div>
              {isDirty && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSave()}
                    isLoading={isSaving}
                  >
                    {!isSaving && <Save className="h-4 w-4" />}
                    Zapisz układ tygodnia
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Cofnij
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {progression && (
        <Card variant="recessed" padding="md">
          <CardEyebrow>Progresja</CardEyebrow>
          <p className="mt-2 text-body-m leading-relaxed text-foreground">
            {progression.body}
          </p>
          <p className="mt-1 text-body-s text-muted-foreground">
            {progression.title}
            {progression.meta && (
              <>
                <span className="mx-1.5 opacity-40">·</span>
                {progression.meta}
              </>
            )}
          </p>
        </Card>
      )}
    </>
  )
}
