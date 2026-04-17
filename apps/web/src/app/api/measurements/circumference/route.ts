import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  measured_at: z.string().datetime().optional(),
  waist_cm: z.number().min(30).max(200).optional(),
  hips_cm: z.number().min(50).max(250).optional(),
  chest_cm: z.number().min(50).max(250).optional(),
  thigh_cm: z.number().min(20).max(150).optional(),
  arm_cm: z.number().min(15).max(100).optional(),
  neck_cm: z.number().min(20).max(80).optional(),
  notes: z.string().max(500).optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  const { measured_at, ...fields } = parsed.data

  const hasAnyMeasurement = Object.values(fields).some((v) => v != null)
  if (!hasAnyMeasurement) {
    return NextResponse.json({ error: 'At least one measurement field is required' }, { status: 400 })
  }

  const { data: measurement, error } = await supabase
    .from('body_measurements')
    .insert({
      user_id: user.id,
      measured_at: measured_at ?? new Date().toISOString(),
      source: 'user_input',
      ...fields,
    })
    .select('id, measured_at, waist_cm, hips_cm, chest_cm, thigh_cm, arm_cm, neck_cm')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save measurement' }, { status: 500 })
  }

  return NextResponse.json({ measurement }, { status: 201 })
}
