import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MealAnalysisResult } from '../types.ts'
import type { StructuredCallResult } from '../../llm/client.ts'

vi.mock('../../llm/client.ts', () => ({
  callStructuredVision: vi.fn(),
}))

const MOCK_RESULT: MealAnalysisResult = {
  meal_type_guess: 'lunch',
  ingredients_detected: [
    {
      label: 'kurczak grillowany',
      portion_estimate: '~150g',
      grams_estimate: 150,
      kcal_estimate: 245,
      protein_g: 46,
      carbs_g: 0,
      fat_g: 5,
    },
  ],
  kcal_estimate_min: 500,
  kcal_estimate_max: 750,
  protein_g_min: 35,
  protein_g_max: 55,
  carbs_g_min: 50,
  carbs_g_max: 90,
  fat_g_min: 10,
  fat_g_max: 25,
  confidence_score: 0.65,
  user_warnings: ['Niepewna wielkość porcji — jeśli jadłeś inną ilość, skoryguj'],
}

describe('analyzeMealPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls callStructuredVision with correct model and schema name', async () => {
    const { callStructuredVision } = await import('../../llm/client.ts')
    vi.mocked(callStructuredVision).mockResolvedValue({
      output: MOCK_RESULT,
      meta: {
        provider: 'openai',
        model: 'gpt-4o',
        tokens_in: 1000,
        tokens_out: 200,
        cost_usd: 0.015,
        latency_ms: 1200,
      },
    } satisfies StructuredCallResult<MealAnalysisResult>)

    const { analyzeMealPhoto } = await import('../analyzeMealPhoto.ts')

    const result = await analyzeMealPhoto({
      apiKey: 'test-key',
      imageUrl: 'https://example.com/meal.jpg',
    })

    expect(callStructuredVision).toHaveBeenCalledOnce()
    const call = vi.mocked(callStructuredVision).mock.calls[0]![0]
    expect(call.model).toBe('gpt-4o')
    expect(call.schemaName).toBe('meal_vision_analysis')
    expect(call.imageUrl).toBe('https://example.com/meal.jpg')
    expect(result.output).toEqual(MOCK_RESULT)
    expect(result.meta.cost_usd).toBeGreaterThan(0)
  })

  it('appends note to user prompt when provided', async () => {
    const { callStructuredVision } = await import('../../llm/client.ts')
    vi.mocked(callStructuredVision).mockResolvedValue({
      output: MOCK_RESULT,
      meta: {
        provider: 'openai',
        model: 'gpt-4o',
        tokens_in: 1100,
        tokens_out: 200,
        cost_usd: 0.016,
        latency_ms: 1300,
      },
    } satisfies StructuredCallResult<MealAnalysisResult>)

    const { analyzeMealPhoto } = await import('../analyzeMealPhoto.ts')

    await analyzeMealPhoto({
      apiKey: 'test-key',
      imageUrl: 'https://example.com/meal.jpg',
      note: 'duży talerz',
    })

    const call = vi.mocked(callStructuredVision).mock.calls[0]![0]
    expect(call.userPrompt).toContain('duży talerz')
  })

  it('returns ranges (min < max) for all macros', async () => {
    const { callStructuredVision } = await import('../../llm/client.ts')
    vi.mocked(callStructuredVision).mockResolvedValue({
      output: MOCK_RESULT,
      meta: {
        provider: 'openai',
        model: 'gpt-4o',
        tokens_in: 900,
        tokens_out: 180,
        cost_usd: 0.012,
        latency_ms: 1100,
      },
    } satisfies StructuredCallResult<MealAnalysisResult>)

    const { analyzeMealPhoto } = await import('../analyzeMealPhoto.ts')
    const { output } = await analyzeMealPhoto({ apiKey: 'key', imageUrl: 'https://x.com/img.jpg' })

    expect(output.kcal_estimate_min).toBeLessThan(output.kcal_estimate_max)
    expect(output.protein_g_min).toBeLessThan(output.protein_g_max)
    expect(output.carbs_g_min).toBeLessThan(output.carbs_g_max)
    expect(output.fat_g_min).toBeLessThan(output.fat_g_max)
    expect(output.confidence_score).toBeGreaterThanOrEqual(0)
    expect(output.confidence_score).toBeLessThanOrEqual(1)
  })
})
