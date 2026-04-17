import { callStructured } from '../llm/client'
import type { LlmCallMeta } from '../llm/client'
import type { CoachIntent, IntentClassificationResult, CoachContext } from './types'

const OUTPUT_SCHEMA = {
  type: 'object',
  required: ['intent', 'confidence', 'reasoning'],
  additionalProperties: false,
  properties: {
    intent: {
      type: 'string',
      enum: [
        'technical_exercise',
        'diet',
        'motivation',
        'pain',
        'goal_extreme',
        'greeting',
        'other',
      ],
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    reasoning: { type: 'string' },
  },
}

const SYSTEM_PROMPT = `Klasyfikujesz intencję wiadomości użytkownika do AI coacha fitness.

Kategorie:
- technical_exercise: pytania o technikę, formę, wykonanie ćwiczenia, progresję ciężarów, zamianę ćwiczenia
- diet: pytania o jedzenie, produkty, makro, kaloryczność, suplementy, dietę
- motivation: potrzeba motywacji, wyrażenie frustracji/zniechęcenia, pytania o postępy
- pain: jakiekolwiek wzmianki o bólu, pieczeniu, strzykaniu, drętwotie, kontuzji, dyskomforcie fizycznym
- goal_extreme: prośba o ekstremalną utratę wagi (np. >1 kg/tydzień przez długi czas), głodówki, ekstremalne deficyty
- greeting: powitanie, "cześć", "hej", "dzień dobry", pytanie o to czym jest coach
- other: cokolwiek innego

WAŻNE: "pain" ma najwyższy priorytet — jeśli wiadomość zawiera jakikolwiek sygnał bólu, zawsze klasyfikuj jako pain, nawet jeśli jest też pytanie techniczne.`

export async function classifyIntent(
  message: string,
  context: CoachContext,
  apiKey: string,
): Promise<{ result: IntentClassificationResult; meta: LlmCallMeta }> {
  const userPrompt = `Kontekst użytkownika: ${JSON.stringify(context)}\n\nWiadomość: ${message}`

  const { output, meta } = await callStructured<IntentClassificationResult>({
    apiKey,
    model: 'gpt-4o-mini',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    jsonSchema: OUTPUT_SCHEMA,
    schemaName: 'intent_classification',
  })

  return { result: output, meta }
}

// Heuristic fast-path — avoids LLM call for obvious pain signals
const PAIN_KEYWORDS_PL = [
  'boli',
  'bólu',
  'ból',
  'bole',
  'strzyka',
  'strzykanie',
  'drętwieje',
  'drętwi',
  'drętwienie',
  'chrupie',
  'piecze',
  'kontuzja',
  'kontuzji',
  'uraz',
  'urazu',
  'naderwanie',
  'skręcenie',
  'skręciłem',
  'skręciłam',
  'dyskomfort',
  'ciągnie',
  'pali',
  'rwanie',
  'rwa',
]

export function hasPainSignal(message: string): boolean {
  const lower = message.toLowerCase()
  return PAIN_KEYWORDS_PL.some((kw) => lower.includes(kw))
}

// Fast-path for extreme goal detection (no LLM needed)
const EXTREME_GOAL_PATTERN =
  /(\d+)\s*kg\s*(w|przez|na)\s*(\d+)\s*(tydzień|tygodnie|tygodni|dzień|dni|tyg\.?|d\.?)/i

export function hasExtremeGoalSignal(message: string): boolean {
  const match = EXTREME_GOAL_PATTERN.exec(message)
  if (!match) return false
  const kgStr = match[1]
  const amountStr = match[3]
  const unit = match[4]
  if (!kgStr || !amountStr || !unit) return false
  const kg = parseFloat(kgStr)
  const amount = parseFloat(amountStr)
  const isWeeks = unit.toLowerCase().startsWith('ty')
  const kgPerWeek = isWeeks ? kg / amount : kg / (amount / 7)
  return kgPerWeek > 1.0
}

export function fastClassifyIntent(message: string): CoachIntent | null {
  if (hasPainSignal(message)) return 'pain'
  if (hasExtremeGoalSignal(message)) return 'goal_extreme'
  return null
}
