import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const patchSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  portion_estimate: z.string().max(100).nullable().optional(),
  grams_estimate: z.number().positive().nullable().optional(),
  kcal_estimate: z.number().int().min(0).nullable().optional(),
  protein_g: z.number().min(0).nullable().optional(),
  carbs_g: z.number().min(0).nullable().optional(),
  fat_g: z.number().min(0).nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
): Promise<NextResponse> {
  const { id, itemId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership via meal_log
  const { data: mealLog } = await supabase
    .from('meal_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!mealLog) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from('meal_log_items')
    .update({ ...parsed.data, is_user_corrected: true })
    .eq('id', itemId)
    .eq('meal_log_id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !item) {
    return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ item })
}
