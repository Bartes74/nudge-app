'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { WorkoutState, LocalExercise, LocalSet } from './useWorkoutStore'

interface UseAutoSyncOptions {
  workoutLogId: string
  state: WorkoutState
  onSetSynced: (
    exerciseIndex: number,
    localId: string,
    serverId: string,
    workoutLogExerciseId: string,
  ) => void
  debounceMs?: number
}

export function useAutoSync({
  workoutLogId,
  state,
  onSetSynced,
  debounceMs = 10_000,
}: UseAutoSyncOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncingRef = useRef(false)

  const syncUnsaved = useCallback(async () => {
    if (syncingRef.current) return
    syncingRef.current = true

    for (let i = 0; i < state.exercises.length; i++) {
      const ex: LocalExercise | undefined = state.exercises[i]
      if (!ex) continue
      const unsyncedSets = ex.sets.filter((s: LocalSet) => !s.synced)
      if (unsyncedSets.length === 0) continue

      for (const s of unsyncedSets) {
        try {
          const res = await fetch(`/api/workout/${workoutLogId}/set`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              exercise_id: ex.exerciseId,
              plan_exercise_id: ex.planExerciseId,
              order_num: ex.orderNum,
              set_number: s.set_number,
              weight_kg: s.weight_kg,
              reps: s.reps,
              rir: s.rir,
              to_failure: s.to_failure,
              workout_log_exercise_id: ex.workoutLogExerciseId,
            }),
          })
          if (res.ok) {
            const json = (await res.json()) as {
              set_id: string
              workout_log_exercise_id: string
            }
            onSetSynced(i, s.localId, json.set_id, json.workout_log_exercise_id)
          }
        } catch {
          // network error — will retry on next sync cycle
        }
      }
    }

    syncingRef.current = false
  }, [workoutLogId, state.exercises, onSetSynced])

  // Debounced auto-save
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void syncUnsaved()
    }, debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state.exercises, syncUnsaved, debounceMs])

  // Sync on network reconnect
  useEffect(() => {
    const handleOnline = () => { void syncUnsaved() }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [syncUnsaved])

  return { syncNow: syncUnsaved }
}
