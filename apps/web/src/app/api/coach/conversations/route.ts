import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  entry_point: z
    .enum([
      'global_bubble',
      'exercise_shortcut',
      'meal_shortcut',
      'checkin_shortcut',
      'proactive_coach',
      'onboarding',
    ])
    .default('global_bubble'),
  context_entity_type: z.enum(['exercise', 'meal', 'plan', 'checkin']).optional(),
  context_entity_id: z.string().uuid().optional(),
})

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { entry_point, context_entity_type, context_entity_id } = parsed.data

  // Return existing open conversation for same context to avoid duplicates
  let existingQuery = supabase
    .from('coach_conversations')
    .select('id, entry_point, started_at, last_message_at')
    .eq('user_id', user.id)
    .eq('closed', false)
    .eq('entry_point', entry_point)

  if (context_entity_id) {
    existingQuery = existingQuery.eq('context_entity_id', context_entity_id)
  } else {
    existingQuery = existingQuery.is('context_entity_id', null)
  }

  const { data: existing } = await existingQuery
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ conversation: existing }, { status: 200 })
  }

  const { data: conversation, error } = await supabase
    .from('coach_conversations')
    .insert({
      user_id: user.id,
      entry_point,
      context_entity_type: context_entity_type ?? null,
      context_entity_id: context_entity_id ?? null,
    })
    .select('id, entry_point, started_at, last_message_at')
    .single()

  if (error || !conversation) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({ conversation }, { status: 201 })
}

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  const { data: conversations, error } = await supabase
    .from('coach_conversations')
    .select(
      `id, entry_point, context_entity_type, started_at, last_message_at, closed,
       coach_messages(count)`,
    )
    .eq('user_id', user.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversations: conversations ?? [] })
}
