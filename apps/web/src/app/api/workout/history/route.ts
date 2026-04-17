import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') // ISO timestamp for pagination
  const limit = Math.min(parseInt(searchParams.get('limit') ?? String(PAGE_SIZE)), 50)

  let query = supabase
    .from('workout_logs')
    .select(`
      id, started_at, ended_at, duration_min, overall_rating, pre_mood,
      plan_workout:plan_workouts!workout_logs_plan_workout_id_fkey ( name, day_label ),
      exercises:workout_log_exercises (
        id, order_num, was_substituted,
        exercise:exercises!workout_log_exercises_exercise_id_fkey ( name_pl, slug ),
        sets:workout_log_sets ( id, weight_kg, reps, rir )
      )
    `)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('started_at', cursor)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const hasMore = (data?.length ?? 0) > limit
  const items = hasMore ? data!.slice(0, limit) : (data ?? [])
  const nextCursor = hasMore ? items[items.length - 1]?.started_at : null

  return NextResponse.json({ items, next_cursor: nextCursor })
}
