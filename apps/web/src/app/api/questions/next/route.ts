import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pickNextQuestions } from '@nudge/core/questions/pickNext'

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [segmentResult, profileResult] = await Promise.all([
    supabase
      .from('user_segment_snapshots')
      .select('segment_key')
      .eq('user_id', user.id)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_profile')
      .select('tone_preset')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const questions = await pickNextQuestions(supabase, {
    userId: user.id,
    userSegment: segmentResult.data?.segment_key ?? null,
    tonePreset: (profileResult.data?.tone_preset as 'warm_encouraging' | 'factual_technical' | null) ?? null,
    count: 2,
  })

  return NextResponse.json({ questions })
}
