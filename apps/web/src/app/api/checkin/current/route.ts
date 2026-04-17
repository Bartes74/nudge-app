import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeAggregates } from '@nudge/core/analyzers/checkin'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // ISO week: Monday = 1
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]!
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekOf = toDateString(getWeekStart(new Date()))

  const [existingResult, aggregates] = await Promise.all([
    supabase
      .from('checkin_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_of', weekOf)
      .maybeSingle(),
    computeAggregates(supabase, user.id, weekOf),
  ])

  return NextResponse.json({
    weekOf,
    aggregates,
    session: existingResult.data ?? null,
  })
}
