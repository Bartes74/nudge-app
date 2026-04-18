import { describe, expect, it, vi } from 'vitest'
import { logLlmCall, type LlmCallMeta } from '../client'

function mockSupabase(returnedId: string | null = 'llm-1') {
  const single = vi.fn().mockResolvedValue({
    data: returnedId ? { id: returnedId } : null,
  })
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  const from = vi.fn().mockReturnValue({ insert })
  return { client: { from } as never, from, insert }
}

const META: LlmCallMeta = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  tokens_in: 123,
  tokens_out: 45,
  cost_usd: 0.00042,
  latency_ms: 987,
}

describe('logLlmCall', () => {
  it('inserts into llm_calls with flattened meta + caller fields', async () => {
    const { client, from, insert } = mockSupabase('abc')

    const id = await logLlmCall({
      supabase: client,
      userId: 'user-1',
      meta: META,
      promptId: 'prompt-1',
      promptVersion: 2,
      aiTaskId: 'task-1',
    })

    expect(id).toBe('abc')
    expect(from).toHaveBeenCalledWith('llm_calls')
    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      provider: 'openai',
      model: 'gpt-4o-mini',
      prompt_id: 'prompt-1',
      prompt_version: 2,
      ai_task_id: 'task-1',
      tokens_in: 123,
      tokens_out: 45,
      cost_usd: 0.00042,
      latency_ms: 987,
      used_structured_output: true,
      output_valid: true,
    })
  })

  it('defaults optional attribution fields to null', async () => {
    const { client, insert } = mockSupabase()

    await logLlmCall({ supabase: client, userId: 'user-1', meta: META })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt_id: null,
        prompt_version: null,
        ai_task_id: null,
        used_structured_output: true,
        output_valid: true,
      }),
    )
  })

  it('allows overriding used_structured_output for streaming / free-form callers', async () => {
    const { client, insert } = mockSupabase()

    await logLlmCall({
      supabase: client,
      userId: 'user-1',
      meta: META,
      usedStructuredOutput: false,
    })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ used_structured_output: false }),
    )
  })

  it('returns null when the insert yields no row (RLS rejection / error)', async () => {
    const { client } = mockSupabase(null)

    const id = await logLlmCall({ supabase: client, userId: 'user-1', meta: META })

    expect(id).toBeNull()
  })
})
