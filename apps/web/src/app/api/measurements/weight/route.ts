import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  weight_kg: z.number().min(20).max(500),
  measured_at: z.string().datetime().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  const { weight_kg, measured_at } = parsed.data
  const measuredAt = measured_at ?? new Date().toISOString()

  const { data: measurement, error } = await supabase
    .from('body_measurements')
    .insert({
      user_id: user.id,
      weight_kg,
      measured_at: measuredAt,
      source: 'user_input',
    })
    .select('id, weight_kg, measured_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save measurement' }, { status: 500 })
  }

  // Update current_weight_kg in user_profile
  await supabase
    .from('user_profile')
    .update({ current_weight_kg: weight_kg, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json({ measurement }, { status: 201 })
}
