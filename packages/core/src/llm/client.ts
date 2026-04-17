import OpenAI from 'openai'

export interface LlmCallMeta {
  provider: 'openai'
  model: string
  tokens_in: number
  tokens_out: number
  cost_usd: number
  latency_ms: number
}

export interface StructuredCallResult<T> {
  output: T
  meta: LlmCallMeta
}

// OpenAI pricing (input/output per 1M tokens, USD)
const PRICING: Record<string, { in: number; out: number }> = {
  'gpt-4o': { in: 5.0, out: 15.0 },
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
}

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const p = PRICING[model] ?? { in: 5.0, out: 15.0 }
  return (tokensIn * p.in + tokensOut * p.out) / 1_000_000
}

/**
 * Calls OpenAI gpt-4o Vision with a JSON schema structured output.
 * Image is passed as image_url content block (detail: low → flat 85-token cost).
 */
export async function callStructuredVision<T>(opts: {
  apiKey: string
  model: string
  systemPrompt: string
  userPrompt: string
  imageUrl: string
  jsonSchema: Record<string, unknown>
  schemaName: string
}): Promise<StructuredCallResult<T>> {
  const client = new OpenAI({ apiKey: opts.apiKey })
  const start = Date.now()

  const response = await client.chat.completions.create({
    model: opts.model,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: opts.imageUrl, detail: 'low' },
          },
          { type: 'text', text: opts.userPrompt },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: opts.schemaName,
        strict: true,
        schema: opts.jsonSchema,
      },
    },
  })

  const latency_ms = Date.now() - start
  const tokens_in = response.usage?.prompt_tokens ?? 0
  const tokens_out = response.usage?.completion_tokens ?? 0

  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error('LLM returned empty content')

  const output = JSON.parse(raw) as T

  return {
    output,
    meta: {
      provider: 'openai',
      model: opts.model,
      tokens_in,
      tokens_out,
      cost_usd: estimateCost(opts.model, tokens_in, tokens_out),
      latency_ms,
    },
  }
}

/**
 * Calls OpenAI with a JSON schema structured output and returns
 * the parsed result along with observability metadata.
 */
export async function callStructured<T>(opts: {
  apiKey: string
  model: string
  systemPrompt: string
  userPrompt: string
  jsonSchema: Record<string, unknown>
  schemaName: string
}): Promise<StructuredCallResult<T>> {
  const client = new OpenAI({ apiKey: opts.apiKey })

  const start = Date.now()

  const response = await client.chat.completions.create({
    model: opts.model,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: opts.userPrompt },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: opts.schemaName,
        strict: true,
        schema: opts.jsonSchema,
      },
    },
  })

  const latency_ms = Date.now() - start
  const tokens_in = response.usage?.prompt_tokens ?? 0
  const tokens_out = response.usage?.completion_tokens ?? 0

  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error('LLM returned empty content')

  const output = JSON.parse(raw) as T

  return {
    output,
    meta: {
      provider: 'openai',
      model: opts.model,
      tokens_in,
      tokens_out,
      cost_usd: estimateCost(opts.model, tokens_in, tokens_out),
      latency_ms,
    },
  }
}
