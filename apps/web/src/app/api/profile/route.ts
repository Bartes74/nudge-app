import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [profileResult, equipmentResult, healthResult, segmentResult, goalResult] =
    await Promise.all([
      supabase.from('user_profile').select('*').eq('user_id', user.id).single(),
      supabase.from('user_equipment').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_health').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('user_segment_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .maybeSingle(),
    ])

  if (profileResult.error) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({
    profile: profileResult.data,
    equipment: equipmentResult.data,
    health: healthResult.data,
    current_segment: segmentResult.data,
    current_goal: goalResult.data,
  })
}
