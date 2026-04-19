import OpenAI from 'openai'
import { fastClassifyIntent, classifyIntent } from './classifyIntent'
import { routeToPrompt } from './routeToPrompt'
import { applyGuardrails } from './applyGuardrails'
import type { CoachContext, CoachIntent, TonePreset } from './types'

/**
 * Polish directive injected into system prompts when `{{tone_preset}}` placeholder is present.
 * Maps the user's `user_profile.tone_preset` to a human-readable instruction the LLM can act on.
 * Fallback is `warm_encouraging` (product default for users who never chose a tone).
 */
const TONE_DIRECTIVES: Record<TonePreset, string> = {
  warm_encouraging: 'ciepły, wspierający — dodaj szczerą zachętę bez frazesów',
  partnering: 'partnerski — mów jak równy z równym, używaj „my", bez dystansu',
  factual_technical: 'rzeczowy, techniczny — fakty, liczby, kroki; minimum emocji',
  calm_guided: 'spokojny, prowadzący — krok po kroku, nie zakładaj wcześniejszej wiedzy',
}

function toneDirective(tone: TonePreset | null | undefined): string {
  return TONE_DIRECTIVES[tone ?? 'warm_encouraging']
}

export interface CoachPromptRow {
  id: string | null
  slug: string
  system_template: string | null
  user_template: string | null
}

export interface CoachCallOptions {
  apiKey: string
  model: string
  userMessage: string
  context: CoachContext
  prompt: CoachPromptRow
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  userSafetyFlags?: string[]
}

export interface CoachStreamResult {
  intent: CoachIntent
  promptSlug: string
  guardrailFlags: string[]
  guardrailModified: boolean
  llmMeta: { provider: 'openai'; model: string } | null
  /** Async generator yielding text chunks from the LLM */
  stream: AsyncGenerator<string, void, unknown>
  /** Resolved after stream finishes — contains final assembled text */
  fullText: Promise<string>
  /**
   * Resolved after stream finishes with final classify+stream aggregate tokens.
   * Must be awaited after consuming the stream; reading before stream end will
   * hang. These are Promises (not plain numbers) because streaming usage only
   * arrives with the last chunk.
   */
  tokensIn: Promise<number>
  tokensOut: Promise<number>
  /** Total latency across fast-path / classification + streaming response, in ms. */
  latencyMs: Promise<number>
}

function splitIntoChunks(text: string, chunkSize = 120): string[] {
  if (text.length <= chunkSize) return [text]

  const chunks: string[] = []
  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize))
  }
  return chunks
}

function buildDeterministicCoachReply(intent: CoachIntent, context: CoachContext): string | null {
  if (intent === 'pain') {
    const exerciseContext = context.exercise_name
      ? `Jeśli ból pojawia się przy ćwiczeniu ${context.exercise_name}, przerwij tę serię i nie próbuj go roztrenować.`
      : 'Jeśli podczas ćwiczenia pojawia się ból, przerwij tę serię i nie próbuj go roztrenować.'

    return [
      exerciseContext,
      'Nie mogę postawić diagnozy ani zalecić leczenia — skonsultuj objawy z lekarzem lub fizjoterapeutą.',
      'Jeśli chcesz, mogę potem pomóc Ci znaleźć spokojniejszy zamiennik albo regresję ruchu.',
    ].join(' ')
  }

  if (intent === 'goal_extreme') {
    return [
      'To tempo jest zbyt agresywne i nie byłoby bezpieczną rekomendacją.',
      'Lepiej przyjąć spokojniejszy plan, który da się utrzymać bez skrajnego deficytu i bez ryzyka przeciążenia.',
      'Jeśli chcesz, rozpiszemy bezpieczniejszy zakres tempa i prosty plan na najbliższe tygodnie.',
    ].join(' ')
  }

  return null
}

function createDeterministicResult(
  intent: CoachIntent,
  promptSlug: string,
  text: string,
  startedAt: number,
): CoachStreamResult {
  const chunks = splitIntoChunks(text)

  async function* streamChunks(): AsyncGenerator<string, void, unknown> {
    for (const chunk of chunks) {
      yield chunk
    }
  }

  return {
    intent,
    promptSlug,
    guardrailFlags: [],
    guardrailModified: false,
    llmMeta: null,
    stream: streamChunks(),
    fullText: Promise.resolve(text),
    tokensIn: Promise.resolve(0),
    tokensOut: Promise.resolve(0),
    latencyMs: Promise.resolve(Date.now() - startedAt),
  }
}

export function interpolateTemplate(template: string, context: CoachContext & { user_message: string }): string {
  return template
    .replace('{{user_message}}', context.user_message)
    .replace('{{segment}}', context.segment ?? 'unknown')
    .replace('{{primary_goal}}', context.primary_goal ?? 'brak danych')
    .replace('{{exercise_name}}', context.exercise_name ?? '')
    .replace('{{exercise_slug}}', context.exercise_slug ?? '')
    .replace('{{exercise_description}}', context.exercise_description ?? '')
    .replace('{{kcal}}', String(context.kcal ?? '?'))
    .replace('{{protein_g}}', String(context.protein_g ?? '?'))
    .replace('{{carbs_g}}', String(context.carbs_g ?? '?'))
    .replace('{{fat_g}}', String(context.fat_g ?? '?'))
    .replace('{{strategy_notes}}', context.strategy_notes ?? 'brak')
    .replace('{{workouts_7d}}', String(context.workouts_7d ?? 0))
    .replace('{{weight_trend}}', context.weight_trend ?? 'brak danych')
    .replace('{{tone_preset}}', toneDirective(context.tone_preset))
}

export async function callCoach(opts: CoachCallOptions): Promise<CoachStreamResult> {
  const { apiKey, model, userMessage, context, prompt, conversationHistory, userSafetyFlags } = opts

  const start = Date.now()

  // Fast-path intent classification (avoids LLM call for obvious cases)
  const fastIntent = fastClassifyIntent(userMessage)
  let intent: CoachIntent
  let tokensIn = 0
  let tokensOut = 0

  if (fastIntent !== null) {
    intent = fastIntent
  } else {
    const { result, meta } = await classifyIntent(userMessage, context, apiKey)
    intent = result.intent
    tokensIn += meta.tokens_in
    tokensOut += meta.tokens_out
  }

  const promptSlug = routeToPrompt(intent)
  const deterministicReply = buildDeterministicCoachReply(intent, context)
  if (deterministicReply) {
    return createDeterministicResult(intent, promptSlug, deterministicReply, start)
  }

  const systemPrompt = interpolateTemplate(
    prompt.system_template ?? '',
    { ...context, user_message: userMessage },
  )
  const userPrompt = interpolateTemplate(
    prompt.user_template ?? '{{user_message}}',
    { ...context, user_message: userMessage },
  )

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam),
    { role: 'user', content: userPrompt },
  ]

  const client = new OpenAI({ apiKey })

  const streamResponse = await client.chat.completions.create({
    model,
    messages,
    stream: true,
    stream_options: { include_usage: true },
  })

  let resolveFullText!: (text: string) => void
  const fullText = new Promise<string>((resolve) => { resolveFullText = resolve })
  let resolveLatency!: (ms: number) => void
  const latencyMs = new Promise<number>((resolve) => { resolveLatency = resolve })
  let resolveTokensIn!: (n: number) => void
  const tokensInPromise = new Promise<number>((resolve) => { resolveTokensIn = resolve })
  let resolveTokensOut!: (n: number) => void
  const tokensOutPromise = new Promise<number>((resolve) => { resolveTokensOut = resolve })

  const guardrailFlags: string[] = []
  let guardrailModified = false

  async function* generateChunks(): AsyncGenerator<string, void, unknown> {
    const chunks: string[] = []

    for await (const chunk of streamResponse) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) {
        chunks.push(delta)
        yield delta
      }
      if (chunk.usage) {
        tokensIn += chunk.usage.prompt_tokens
        tokensOut += chunk.usage.completion_tokens
      }
    }

    const assembled = chunks.join('')
    const guardrailResult = applyGuardrails(assembled, userSafetyFlags)

    if (!guardrailResult.safe) {
      guardrailFlags.push(...guardrailResult.flags)
      guardrailModified = true
    }

    resolveFullText(guardrailResult.modified_text)
    resolveLatency(Date.now() - start)
    resolveTokensIn(tokensIn)
    resolveTokensOut(tokensOut)
  }

  const stream = generateChunks()

  return {
    intent,
    promptSlug,
    guardrailFlags,
    guardrailModified,
    llmMeta: { provider: 'openai', model },
    stream,
    fullText,
    tokensIn: tokensInPromise,
    tokensOut: tokensOutPromise,
    latencyMs,
  }
}
