import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Resolve exercise by slug
  const { data: exercise } = await supabase
    .from('exercises')
    .select('id, name_pl')
    .eq('slug', slug)
    .eq('deprecated', false)
    .single()

  if (!exercise) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
  }

  // Fetch all log_exercises for this user + exercise, with their sets
  const { data: logExercises, error } = await supabase
    .from('workout_log_exercises')
    .select(`
      id,
      workout_log:workout_logs!workout_log_exercises_workout_log_id_fkey (
        id, started_at, ended_at, duration_min
      ),
      sets:workout_log_sets ( weight_kg, reps, rir, set_number )
    `)
    .eq('exercise_id', exercise.id)
    .order('id', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type LogExercise = {
    id: string
    workout_log: { id: string; started_at: string; ended_at: string | null; duration_min: number | null } | null
    sets: Array<{ weight_kg: number | null; reps: number | null; rir: number | null; set_number: number }>
  }

  // Verify ownership + compute per-session max weight
  const ownedLogs = (logExercises as LogExercise[]).filter(
    (le) => le.workout_log != null,
  )

  const sessions = ownedLogs
    .map((le) => {
      const maxWeight = le.sets.reduce(
        (max, s) => (s.weight_kg != null && s.weight_kg > max ? s.weight_kg : max),
        0,
      )
      const totalSets = le.sets.length
      const maxReps = le.sets.reduce((max, s) => (s.reps != null && s.reps > max ? s.reps : max), 0)
      return {
        workout_log_id: le.workout_log!.id,
        started_at: le.workout_log!.started_at,
        max_weight_kg: maxWeight > 0 ? maxWeight : null,
        total_sets: totalSets,
        max_reps: maxReps > 0 ? maxReps : null,
        sets: le.sets.sort((a, b) => a.set_number - b.set_number),
      }
    })
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())

  return NextResponse.json({ exercise, sessions })
}
