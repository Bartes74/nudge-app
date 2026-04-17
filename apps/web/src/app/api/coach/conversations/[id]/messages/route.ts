import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { callCoach } from '@nudge/core/coach/callCoach'
import { env } from '@/lib/env'
import type { CoachContext } from '@nudge/core/coach/types'

const bodySchema = z.object({
  content: z.string().min(1).max(2000),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: conversationId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 })
  }

  const { content: userMessage } = parsed.data

  // Verify ownership
  const { data: conversation } = await supabase
    .from('coach_conversations')
    .select(
      'id, user_id, closed, entry_point, context_entity_type, context_entity_id',
    )
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 })
  }
  if (conversation.closed) {
    return new Response(JSON.stringify({ error: 'Conversation is closed' }), { status: 409 })
  }

  // Load context (profile + relevant data)
  const [profileRes, signalsRes, safetyRes] = await Promise.all([
    supabase
      .from('user_profile')
      .select('primary_goal, experience_level, current_weight_kg, tone_preset')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('behavior_signals')
      .select('coach_messages_sent_7d')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('user_safety_flags')
      .select('flag')
      .eq('user_id', user.id)
      .eq('status', 'active'),
  ])

  const profile = profileRes.data
  const signals = signalsRes.data
  const safetyFlags = (safetyRes.data ?? []).map((f) => f.flag)

  let coachContext: CoachContext = {
    segment: profile?.experience_level ?? undefined,
    primary_goal: profile?.primary_goal ?? null,
    workouts_7d: signals?.coach_messages_sent_7d ?? 0,
    tone_preset: profile?.tone_preset ?? null,
  }

  // Load exercise context if relevant
  if (
    conversation.context_entity_type === 'exercise' &&
    conversation.context_entity_id
  ) {
    const { data: exercise } = await supabase
      .from('exercises')
      .select('name_pl, technique_notes, slug')
      .eq('id', conversation.context_entity_id)
      .maybeSingle()

    if (exercise) {
      coachContext = {
        ...coachContext,
        exercise_name: exercise.name_pl,
        exercise_slug: exercise.slug,
        exercise_description: exercise.technique_notes,
      }
    }
  }

  // Load nutrition context if relevant
  if (conversation.context_entity_type === 'meal' || conversation.entry_point === 'meal_shortcut') {
    const { data: nutrition } = await supabase
      .from('nutrition_plan_versions')
      .select('calories_target, protein_g_target, carbs_g_target, fat_g_target, strategy_notes')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (nutrition) {
      coachContext = {
        ...coachContext,
        kcal: nutrition.calories_target,
        protein_g: nutrition.protein_g_target,
        carbs_g: nutrition.carbs_g_target,
        fat_g: nutrition.fat_g_target,
        strategy_notes: nutrition.strategy_notes,
      }
    }
  }

  // Load conversation history (last 10 messages)
  const { data: history } = await supabase
    .from('coach_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10)

  const conversationHistory = (history ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Save user message
  const { data: userMsgRow } = await supabase
    .from('coach_messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    })
    .select('id')
    .single()

  // Load prompt for current conversation (determined after classify)
  // We'll load the right one after intent classification via fast-path
  // For now load all coach prompts and select after intent is known
  const { data: allPrompts } = await supabase
    .from('prompts')
    .select('id, slug, system_template, user_template')
    .in('slug', [
      'coach_technical_exercise',
      'coach_diet_question',
      'coach_pain_flagged',
      'coach_motivation',
    ])
    .eq('deprecated', false)
    .order('version', { ascending: false })

  const promptMap = Object.fromEntries(
    (allPrompts ?? []).map((p) => [p.slug, p]),
  )

  const FALLBACK_PROMPT = {
    id: null as string | null,
    slug: 'coach_motivation',
    system_template: 'Jesteś AI coachem fitness. Odpowiadaj po polsku.',
    user_template: '{{user_message}}',
  }

  // We need a default prompt before we know the intent — use motivation as fallback
  const fallbackPrompt: { id: string | null; slug: string; system_template: string | null; user_template: string | null } =
    promptMap['coach_motivation'] ?? FALLBACK_PROMPT

  // SSE stream
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: data })}\n\n`))
      }

      try {
        const coachResult = await callCoach({
          apiKey: env.OPENAI_API_KEY,
          model: 'gpt-4o-mini',
          userMessage,
          context: coachContext,
          prompt: promptMap[fallbackPrompt.slug] ?? fallbackPrompt,
          conversationHistory,
          userSafetyFlags: safetyFlags,
        })

        // Send intent meta event first
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ event: 'intent', intent: coachResult.intent })}\n\n`,
          ),
        )

        // Stream chunks
        let finalText = ''
        for await (const chunk of coachResult.stream) {
          send(chunk)
        }

        finalText = await coachResult.fullText

        // If guardrail modified the text, send the corrected full text
        if (coachResult.guardrailModified) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ event: 'guardrail_modified', full_text: finalText })}\n\n`,
            ),
          )
        }

        // Persist assistant message using service role (bypasses RLS insert restriction)
        const serviceSupabase = createServiceClient(
          env.NEXT_PUBLIC_SUPABASE_URL,
          env.SUPABASE_SERVICE_ROLE_KEY,
        )

        // Record LLM call
        const { data: llmCallRow } = await serviceSupabase
          .from('llm_calls')
          .insert({
            user_id: user.id,
            provider: 'openai',
            model: 'gpt-4o-mini',
            prompt_id: promptMap[coachResult.promptSlug]?.id ?? null,
            prompt_version: 1,
            tokens_in: coachResult.tokensIn,
            tokens_out: coachResult.tokensOut,
            cost_usd:
              (coachResult.tokensIn * 0.15 + coachResult.tokensOut * 0.6) /
              1_000_000,
          })
          .select('id')
          .single()

        await serviceSupabase.from('coach_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: finalText,
          intent: coachResult.intent,
          tokens_in: coachResult.tokensIn,
          tokens_out: coachResult.tokensOut,
          llm_call_id: llmCallRow?.id ?? null,
          guardrail_flagged: coachResult.guardrailFlags.length > 0,
          guardrail_reasons:
            coachResult.guardrailFlags.length > 0 ? coachResult.guardrailFlags : null,
        })

        // Update conversation last_message_at
        await serviceSupabase
          .from('coach_conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId)

        // Update behavior_signals coach_messages_sent_7d (best-effort, fire-and-forget)
        void serviceSupabase
          .from('behavior_signals')
          .update({
            coach_messages_sent_7d: (signals?.coach_messages_sent_7d ?? 0) + 1,
          })
          .eq('user_id', user.id)

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'done' })}\n\n`))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event: 'error', message: msg })}\n\n`),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
