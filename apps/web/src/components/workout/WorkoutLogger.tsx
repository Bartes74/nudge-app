'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, RefreshCw, Info, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { SetRow } from './SetRow'
import { SubstituteModal, type Exercise as SubstituteExercise } from './SubstituteModal'
import { ExerciseDetailModal } from './ExerciseDetailModal'
import { useWorkoutStore, type LocalExercise } from '@/hooks/useWorkoutStore'
import { useAutoSync } from '@/hooks/useAutoSync'

interface ExerciseCatalog {
  id: string
  slug: string
  name_pl: string
  primary_muscles: string[]
  secondary_muscles: string[]
  equipment_required: string[]
  alternatives_slugs: string[]
  technique_notes: string | null
}

interface PlanExercise {
  id: string
  order_num: number
  sets: number
  reps_min: number
  reps_max: number
  rir_target: number | null
  rest_seconds: number | null
  technique_notes: string | null
  exercise: ExerciseCatalog | null
}

interface PreviousPerformance {
  exerciseId: string
  maxWeight: number | null
  lastReps: number | null
}

interface WorkoutLoggerProps {
  workoutLogId: string
  planWorkoutId: string
  workoutName: string
  planExercises: PlanExercise[]
  exerciseCatalog: Record<string, ExerciseCatalog>
  previousPerformance: PreviousPerformance[]
}

export function WorkoutLogger({
  workoutLogId,
  planWorkoutId,
  workoutName,
  planExercises,
  exerciseCatalog,
  previousPerformance,
}: WorkoutLoggerProps) {
  const router = useRouter()
  const [showSubstitute, setShowSubstitute] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const prevMap = Object.fromEntries(
    previousPerformance.map((p) => [p.exerciseId, p]),
  )

  const initialExercises: LocalExercise[] = planExercises.map((pe) => ({
    exerciseId: pe.exercise?.id ?? '',
    planExerciseId: pe.id,
    orderNum: pe.order_num,
    sets: [],
  }))

  const {
    state,
    addSet,
    updateSet,
    removeSet,
    markSetSynced,
    substituteExercise,
    nextExercise,
    prevExercise,
    clearStorage,
  } = useWorkoutStore(workoutLogId, initialExercises)

  const { syncNow } = useAutoSync({
    workoutLogId,
    state,
    onSetSynced: markSetSynced,
    debounceMs: 10_000,
  })

  const currentIndex = state.currentExerciseIndex
  const currentEx = state.exercises[currentIndex]
  const planEx = planExercises.find((pe) => pe.id === currentEx?.planExerciseId)
  const catalogEntry = currentEx ? exerciseCatalog[currentEx.exerciseId] : null
  const prev = currentEx ? prevMap[currentEx.exerciseId] : null
  const isLast = currentIndex === state.exercises.length - 1

  const handleAddSet = () => {
    addSet(currentIndex, {
      weight_kg: prev?.maxWeight ?? null,
      reps: planEx?.reps_max ?? prev?.lastReps ?? null,
      rir: planEx?.rir_target ?? 2,
    })
  }

  const handleSubstitute = useCallback(
    async (exercise: SubstituteExercise) => {
      if (!currentEx) return
      try {
        const res = await fetch(`/api/workout/${workoutLogId}/substitute-exercise`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workout_log_exercise_id: currentEx.workoutLogExerciseId ?? null,
            new_exercise_id: exercise.id,
            original_exercise_id: currentEx.exerciseId,
            order_num: currentEx.orderNum,
          }),
        })
        if (!res.ok) throw new Error('Zamiana nieudana')
        const json = (await res.json()) as { new_workout_log_exercise_id: string }
        substituteExercise(currentIndex, exercise.id, json.new_workout_log_exercise_id)
        setShowSubstitute(false)
        toast.success(`Zamieniono na: ${exercise.name_pl}`)
      } catch {
        toast.error('Nie udało się zamienić ćwiczenia')
      }
    },
    [workoutLogId, currentEx, currentIndex, substituteExercise],
  )

  const handleFinish = async () => {
    setFinishing(true)
    await syncNow()
    clearStorage()
    router.push(`/app/today/workout/${workoutLogId}/finish`)
  }

  const alternatives = (catalogEntry?.alternatives_slugs ?? [])
    .map((slug) => Object.values(exerciseCatalog).find((e) => e.slug === slug))
    .filter((e): e is ExerciseCatalog => e != null)

  const exerciseName = catalogEntry?.name_pl ?? planEx?.exercise?.name_pl ?? '—'
  const progress = `${currentIndex + 1} / ${state.exercises.length}`

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button
          type="button"
          onClick={prevExercise}
          disabled={currentIndex === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted disabled:opacity-30"
          aria-label="Poprzednie ćwiczenie"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">{workoutName}</p>
          <p className="text-xs font-semibold text-muted-foreground">{progress}</p>
        </div>

        <button
          type="button"
          onClick={nextExercise}
          disabled={isLast}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted disabled:opacity-30"
          aria-label="Następne ćwiczenie"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Exercise name + info */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="flex-1 text-left"
        >
          <h1 className="text-xl font-bold leading-tight">{exerciseName}</h1>
          {planEx && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {planEx.sets} serie · {planEx.reps_min}–{planEx.reps_max} powt. · RIR {planEx.rir_target ?? 2}
            </p>
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted"
          aria-label="Szczegóły ćwiczenia"
        >
          <Info className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Sets list — scrollable middle */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        <div className="flex flex-col gap-3">
          {currentEx?.sets.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Naciśnij &ldquo;Dodaj serię&rdquo; aby zacząć.
            </p>
          )}
          {currentEx?.sets.map((s, i) => (
            <SetRow
              key={s.localId}
              set={s}
              index={i}
              prevWeight={i === 0 ? prev?.maxWeight : currentEx.sets[i - 1]?.weight_kg}
              prevReps={i === 0 ? prev?.lastReps : currentEx.sets[i - 1]?.reps}
              onChange={(patch) => updateSet(currentIndex, s.localId, patch)}
              onRemove={() => removeSet(currentIndex, s.localId)}
            />
          ))}
        </div>
      </div>

      {/* Bottom actions — always visible */}
      <div className="border-t bg-background px-4 pb-6 pt-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddSet}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Dodaj serię
          </button>

          <button
            type="button"
            onClick={() => setShowSubstitute(true)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background active:bg-muted"
            aria-label="Zamień ćwiczenie"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          disabled={finishing}
          onClick={isLast ? handleFinish : nextExercise}
          className="mt-3 w-full rounded-xl border py-3 text-sm font-semibold text-foreground active:bg-muted disabled:opacity-50"
        >
          {isLast ? (finishing ? 'Zapisuję...' : 'Zakończ trening →') : 'Następne ćwiczenie →'}
        </button>
      </div>

      <SubstituteModal
        open={showSubstitute}
        onClose={() => setShowSubstitute(false)}
        alternatives={alternatives}
        onSelect={handleSubstitute}
      />

      <ExerciseDetailModal
        open={showDetail}
        onClose={() => setShowDetail(false)}
        planExercise={planEx ?? null}
      />
    </div>
  )
}
