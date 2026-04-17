import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: plans } = await supabase
    .from('training_plans')
    .select('id')
    .eq('user_id', user.id)

  if (!plans || plans.length === 0) return NextResponse.json({ versions: [] })

  const planIds = plans.map((p) => p.id)

  const { data: versions, error } = await supabase
    .from('training_plan_versions')
    .select('id, plan_id, version_number, change_reason, created_at, week_structure, progression_rules')
    .in('plan_id', planIds)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load versions' }, { status: 500 })

  return NextResponse.json({ versions: versions ?? [] })
}
