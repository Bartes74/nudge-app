'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface LocalSet {
  localId: string
  serverId?: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  rir: number
  to_failure: boolean
  synced: boolean
}

export interface LocalExercise {
  exerciseId: string
  planExerciseId?: string
  workoutLogExerciseId?: string
  orderNum: number
  sets: LocalSet[]
  wasSubstituted?: boolean
  originalExerciseId?: string
}

export interface WorkoutState {
  workoutLogId: string
  planWorkoutId?: string
  currentExerciseIndex: number
  exercises: LocalExercise[]
  startedAt: string
  finished: boolean
}

function storageKey(workoutLogId: string) {
  return `nudge_workout_${workoutLogId}`
}

export function useWorkoutStore(workoutLogId: string, initialExercises: LocalExercise[]) {
  const [state, setStateRaw] = useState<WorkoutState>(() => {
    if (typeof window === 'undefined') {
      return {
        workoutLogId,
        currentExerciseIndex: 0,
        exercises: initialExercises,
        startedAt: new Date().toISOString(),
        finished: false,
      }
    }
    try {
      const stored = localStorage.getItem(storageKey(workoutLogId))
      if (stored) {
        const parsed = JSON.parse(stored) as WorkoutState
        // Merge: keep server-confirmed exercises, fill in any from initial not yet present
        const mergedExercises = parsed.exercises.map((ex) => {
          const initial = initialExercises.find((i) => i.exerciseId === ex.exerciseId)
          return { ...initial, ...ex }
        })
        return { ...parsed, exercises: mergedExercises }
      }
    } catch {
      // ignore corrupt storage
    }
    return {
      workoutLogId,
      currentExerciseIndex: 0,
      exercises: initialExercises,
      startedAt: new Date().toISOString(),
      finished: false,
    }
  })

  const setState = useCallback((updater: (prev: WorkoutState) => WorkoutState) => {
    setStateRaw((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(storageKey(workoutLogId), JSON.stringify(next))
      } catch {
        // storage full — silently ignore
      }
      return next
    })
  }, [workoutLogId])

  const addSet = useCallback(
    (exerciseIndex: number, defaults?: Partial<LocalSet>) => {
      setState((prev) => {
        const exercises = prev.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex
          const lastSet = ex.sets[ex.sets.length - 1]
          const newSet: LocalSet = {
            localId: `local_${Date.now()}_${Math.random()}`,
            set_number: ex.sets.length + 1,
            weight_kg: defaults?.weight_kg ?? lastSet?.weight_kg ?? null,
            reps: defaults?.reps ?? lastSet?.reps ?? null,
            rir: defaults?.rir ?? lastSet?.rir ?? 2,
            to_failure: false,
            synced: false,
            ...defaults,
          }
          return { ...ex, sets: [...ex.sets, newSet] }
        })
        return { ...prev, exercises }
      })
    },
    [setState],
  )

  const updateSet = useCallback(
    (exerciseIndex: number, setLocalId: string, patch: Partial<LocalSet>) => {
      setState((prev) => {
        const exercises = prev.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex
          const sets = ex.sets.map((s) =>
            s.localId === setLocalId ? { ...s, ...patch, synced: false } : s,
          )
          return { ...ex, sets }
        })
        return { ...prev, exercises }
      })
    },
    [setState],
  )

  const removeSet = useCallback(
    (exerciseIndex: number, setLocalId: string) => {
      setState((prev) => {
        const exercises = prev.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex
          const sets = ex.sets
            .filter((s) => s.localId !== setLocalId)
            .map((s, idx) => ({ ...s, set_number: idx + 1 }))
          return { ...ex, sets }
        })
        return { ...prev, exercises }
      })
    },
    [setState],
  )

  const markSetSynced = useCallback(
    (exerciseIndex: number, localId: string, serverId: string, workoutLogExerciseId: string) => {
      setState((prev) => {
        const exercises = prev.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex
          return {
            ...ex,
            workoutLogExerciseId: ex.workoutLogExerciseId ?? workoutLogExerciseId,
            sets: ex.sets.map((s) =>
              s.localId === localId ? { ...s, serverId, synced: true } : s,
            ),
          }
        })
        return { ...prev, exercises }
      })
    },
    [setState],
  )

  const substituteExercise = useCallback(
    (exerciseIndex: number, newExerciseId: string, newWorkoutLogExerciseId: string) => {
      setState((prev) => {
        const exercises = prev.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex
          return {
            ...ex,
            wasSubstituted: true,
            originalExerciseId: ex.originalExerciseId ?? ex.exerciseId,
            exerciseId: newExerciseId,
            workoutLogExerciseId: newWorkoutLogExerciseId,
            sets: [],
          }
        })
        return { ...prev, exercises }
      })
    },
    [setState],
  )

  const nextExercise = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentExerciseIndex: Math.min(prev.currentExerciseIndex + 1, prev.exercises.length - 1),
    }))
  }, [setState])

  const prevExercise = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentExerciseIndex: Math.max(prev.currentExerciseIndex - 1, 0),
    }))
  }, [setState])

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(storageKey(workoutLogId))
    } catch {
      // ignore
    }
  }, [workoutLogId])

  return {
    state,
    addSet,
    updateSet,
    removeSet,
    markSetSynced,
    substituteExercise,
    nextExercise,
    prevExercise,
    clearStorage,
  }
}
