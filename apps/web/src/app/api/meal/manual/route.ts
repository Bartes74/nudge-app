import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logLlmCall } from '@nudge/core/llm/client'
import {
  estimateManualMealItems,
  type ManualMealType,
} from '@nudge/core/meal/estimateManualMealItems'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

const itemSchema = z.object({
  label: z.string().min(1).max(200),
  portion_estimate: z.string().min(1).max(100),
  grams_estimate: z.number().positive().optional(),
  kcal_estimate: z.number().int().min(0).optional(),
  protein_g: z.number().min(0).optional(),
  carbs_g: z.number().min(0).optional(),
  fat_g: z.number().min(0).optional(),
})

const bodySchema = z.object({
  meal_type: z
    .enum(['breakfast', 'lunch', 'dinner', 'snack', 'drink', 'dessert'])
    .optional(),
  logged_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  note: z.string().max(500).optional(),
  items: z.array(itemSchema).min(1),
})

type ManualMealItem = z.infer<typeof itemSchema>

function shouldEstimateItem(item: ManualMealItem): boolean {
  return (
    item.kcal_estimate == null
    || item.protein_g == null
    || item.carbs_g == null
    || item.fat_g == null
  )
}

function looksLikePlaceholderOpenAiKey(apiKey: string): boolean {
  return apiKey.startsWith('local-') || apiKey.includes('replace_me')
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10
}

function mergeEstimatedItem(
  item: ManualMealItem,
  estimate: { kcal_estimate: number; protein_g: number; carbs_g: number; fat_g: number },
): ManualMealItem {
  return {
    ...item,
    kcal_estimate: item.kcal_estimate ?? Math.round(estimate.kcal_estimate),
    protein_g: item.protein_g ?? roundMacro(estimate.protein_g),
    carbs_g: item.carbs_g ?? roundMacro(estimate.carbs_g),
    fat_g: item.fat_g ?? roundMacro(estimate.fat_g),
  }
}

function exactTotal(
  items: ManualMealItem[],
  field: 'kcal_estimate' | 'protein_g' | 'carbs_g' | 'fat_g',
): number | null {
  if (items.some((item) => item[field] == null)) return null
  return items.reduce((sum, item) => sum + Number(item[field] ?? 0), 0)
}

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

  const { meal_type, logged_at, note, items } = parsed.data
  const date = logged_at ?? new Date().toISOString().slice(0, 10)
  const warnings: string[] = []

  const { data: mealLog, error: logError } = await supabase
    .from('meal_logs')
    .insert({
      user_id: user.id,
      logged_at: date,
      meal_type: meal_type ?? null,
      source: 'manual',
      status: 'manual',
      note: note ?? null,
    })
    .select('id')
    .single()

  if (logError || !mealLog) {
    return NextResponse.json(
      { error: `Failed to create meal log: ${logError?.message}` },
      { status: 500 },
    )
  }

  let llmCallId: string | null = null
  let resolvedItems = items

  const needsEstimate = items.some(shouldEstimateItem)
  if (needsEstimate && !looksLikePlaceholderOpenAiKey(env.OPENAI_API_KEY)) {
    try {
      const estimation = await estimateManualMealItems({
        apiKey: env.OPENAI_API_KEY,
        mealType: meal_type as ManualMealType | undefined,
        items: items.map((item) => ({
          label: item.label,
          portion_estimate: item.portion_estimate,
        })),
      })

      if (estimation.output.items.length === items.length) {
        resolvedItems = items.map((item, index) =>
          mergeEstimatedItem(item, estimation.output.items[index]!))
      }

      if (estimation.output.user_warnings.length > 0) {
        warnings.push(...estimation.output.user_warnings)
      }

      llmCallId = await logLlmCall({
        supabase: createAdminClient(),
        userId: user.id,
        meta: estimation.meta,
      })
    } catch {
      warnings.push('Nie udało się oszacować wszystkich wartości. Możesz uzupełnić je później ręcznie.')
    }
  }

  const { error: itemsError } = await supabase.from('meal_log_items').insert(
    resolvedItems.map((item) => ({
      meal_log_id: mealLog.id,
      user_id: user.id,
      label: item.label,
      portion_estimate: item.portion_estimate ?? null,
      grams_estimate: item.grams_estimate ?? null,
      kcal_estimate: item.kcal_estimate ?? null,
      protein_g: item.protein_g ?? null,
      carbs_g: item.carbs_g ?? null,
      fat_g: item.fat_g ?? null,
    })),
  )

  if (itemsError) {
    return NextResponse.json(
      { error: `Failed to save items: ${itemsError.message}` },
      { status: 500 },
    )
  }

  await supabase
    .from('meal_logs')
    .update({
      kcal_estimate_min: exactTotal(resolvedItems, 'kcal_estimate'),
      kcal_estimate_max: exactTotal(resolvedItems, 'kcal_estimate'),
      protein_g_min: exactTotal(resolvedItems, 'protein_g'),
      protein_g_max: exactTotal(resolvedItems, 'protein_g'),
      carbs_g_min: exactTotal(resolvedItems, 'carbs_g'),
      carbs_g_max: exactTotal(resolvedItems, 'carbs_g'),
      fat_g_min: exactTotal(resolvedItems, 'fat_g'),
      fat_g_max: exactTotal(resolvedItems, 'fat_g'),
      user_warnings: warnings.length > 0 ? warnings : null,
      llm_call_id: llmCallId,
    })
    .eq('id', mealLog.id)

  return NextResponse.json({ meal_log_id: mealLog.id }, { status: 201 })
}
