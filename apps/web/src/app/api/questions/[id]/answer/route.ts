import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@nudge/core/types/db'

const bodySchema = z.object({
  answer_text: z.string().max(2000).optional(),
  answer_numeric: z.number().optional(),
  answer_json: z.unknown().optional(),
  context: z.string().max(200).optional(),
  source: z.enum(['contextual', 'proactive', 'checkin', 'onboarding']).optional(),
  checkin_session_id: z.string().uuid().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: questionId } = await params

  const body = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { answer_text, answer_numeric, answer_json, context, source, checkin_session_id } =
    parsed.data

  if (answer_text === undefined && answer_numeric === undefined && answer_json === undefined) {
    return NextResponse.json({ error: 'At least one answer field is required' }, { status: 400 })
  }

  // Verify question exists
  const { data: question } = await supabase
    .from('question_library')
    .select('id, field_key')
    .eq('id', questionId)
    .maybeSingle()

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const answerJson = answer_json !== undefined ? (answer_json as Json) : null

  // Check for existing ask to decide insert vs update
  const { data: existingAsk } = await supabase
    .from('user_question_asks')
    .select('id')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .maybeSingle()

  let askId: string | null = null

  if (existingAsk) {
    const { data, error } = await supabase
      .from('user_question_asks')
      .update({
        answered_at: now,
        answer_text: answer_text ?? null,
        answer_numeric: answer_numeric ?? null,
        answer_json: answerJson,
        context: context ?? null,
        source: source ?? null,
        checkin_session_id: checkin_session_id ?? null,
      })
      .eq('id', existingAsk.id)
      .select('id')
      .single()
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
    }
    askId = data.id
  } else {
    const { data, error } = await supabase
      .from('user_question_asks')
      .insert({
        user_id: user.id,
        question_id: questionId,
        asked_at: now,
        answered_at: now,
        answer_text: answer_text ?? null,
        answer_numeric: answer_numeric ?? null,
        answer_json: answerJson,
        context: context ?? null,
        source: source ?? null,
        checkin_session_id: checkin_session_id ?? null,
      })
      .select('id')
      .single()
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
    }
    askId = data.id
  }

  // Persist to user_profile_facts for downstream use
  if (answer_text !== undefined) {
    await supabase.from('user_profile_facts').insert({
      user_id: user.id,
      field_key: question.field_key,
      source: 'user_input',
      observed_at: now,
      value_text: answer_text,
    })
  } else if (answer_numeric !== undefined) {
    await supabase.from('user_profile_facts').insert({
      user_id: user.id,
      field_key: question.field_key,
      source: 'user_input',
      observed_at: now,
      value_numeric: answer_numeric,
    })
  } else if (answer_json !== undefined) {
    await supabase.from('user_profile_facts').insert({
      user_id: user.id,
      field_key: question.field_key,
      source: 'user_input',
      observed_at: now,
      value_json: answerJson,
    })
  }

  return NextResponse.json({ ask: { id: askId } }, { status: 201 })
}
