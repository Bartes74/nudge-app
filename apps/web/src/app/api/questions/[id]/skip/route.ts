import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: questionId } = await params

  const { data: question } = await supabase
    .from('question_library')
    .select('id')
    .eq('id', questionId)
    .maybeSingle()

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  const now = new Date().toISOString()

  const { data: ask, error } = await supabase
    .from('user_question_asks')
    .upsert(
      {
        user_id: user.id,
        question_id: questionId,
        asked_at: now,
        skipped_at: now,
      },
      { onConflict: 'user_id,question_id', ignoreDuplicates: false },
    )
    .select('id')
    .single()

  if (error || !ask) {
    return NextResponse.json({ error: error?.message ?? 'Upsert failed' }, { status: 500 })
  }

  return NextResponse.json({ ask }, { status: 200 })
}
