import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const itemSchema = z.object({
  label: z.string().min(1).max(200),
  portion_estimate: z.string().max(100).optional(),
  grams_estimate: z.number().positive().optional(),
  kcal_estimate: z.number().int().min(0),
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

  const { error: itemsError } = await supabase.from('meal_log_items').insert(
    items.map((item) => ({
      meal_log_id: mealLog.id,
      user_id: user.id,
      label: item.label,
      portion_estimate: item.portion_estimate ?? null,
      grams_estimate: item.grams_estimate ?? null,
      kcal_estimate: item.kcal_estimate,
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

  return NextResponse.json({ meal_log_id: mealLog.id }, { status: 201 })
}
