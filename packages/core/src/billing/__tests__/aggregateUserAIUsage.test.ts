import { describe, expect, it } from 'vitest'
import { aggregateUserAIUsage } from '../aggregateUserAIUsage'

describe('aggregateUserAIUsage', () => {
  it('aggregates llm calls per user and month', () => {
    const rows = aggregateUserAIUsage(
      [
        {
          id: 'call-1',
          user_id: 'user-1',
          created_at: '2026-04-02T10:00:00.000Z',
          cost_usd: 0.11,
          tokens_in: 100,
          tokens_out: 50,
        },
        {
          id: 'call-2',
          user_id: 'user-1',
          created_at: '2026-04-20T12:00:00.000Z',
          cost_usd: 0.22,
          tokens_in: 120,
          tokens_out: 60,
        },
        {
          id: 'call-3',
          user_id: 'user-2',
          created_at: '2026-05-03T09:15:00.000Z',
          cost_usd: 0.33,
          tokens_in: 140,
          tokens_out: 70,
        },
      ],
      ['call-2'],
    )

    expect(rows).toEqual([
      {
        user_id: 'user-1',
        month_key: '2026-04',
        llm_calls_count: 2,
        photo_analysis_count: 1,
        tokens_in_total: 220,
        tokens_out_total: 110,
        cost_usd_total: 0.33,
      },
      {
        user_id: 'user-2',
        month_key: '2026-05',
        llm_calls_count: 1,
        photo_analysis_count: 0,
        tokens_in_total: 140,
        tokens_out_total: 70,
        cost_usd_total: 0.33,
      },
    ])
  })

  it('skips llm calls without user attribution', () => {
    const rows = aggregateUserAIUsage(
      [
        {
          id: 'call-1',
          user_id: null,
          created_at: '2026-04-02T10:00:00.000Z',
          cost_usd: 0.11,
          tokens_in: 100,
          tokens_out: 50,
        },
      ],
      [],
    )

    expect(rows).toEqual([])
  })
})
