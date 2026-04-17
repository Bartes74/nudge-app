import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Json, TablesUpdate } from '@nudge/core/types/db'

const bodySchema = z.object({
  field_key: z.string().min(1),
  value_text: z.string().nullable().optional(),
  value_numeric: z.number().nullable().optional(),
  value_bool: z.boolean().nullable().optional(),
  value_json: z.unknown().optional(),
  unit: z.string().nullable().optional(),
})

// Allowed top-level profile fields that can be updated via this endpoint
const PROFILE_FIELD_MAP: Record<string, string> = {
  display_name: 'display_name',
  birth_date: 'birth_date',
  gender: 'gender',
  height_cm: 'height_cm',
  current_weight_kg: 'current_weight_kg',
  experience_level: 'experience_level',
  primary_goal: 'primary_goal',
  nutrition_mode: 'nutrition_mode',
  dietary_constraints: 'dietary_constraints',
  life_context: 'life_context',
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { field_key, value_text, value_numeric, value_bool, value_json, unit } = parsed.data

  // --- Append fact (never update, always insert new) ---
  const { error: factError } = await supabase.from('user_profile_facts').insert({
    user_id: user.id,
    field_key,
    value_text: value_text ?? null,
    value_numeric: value_numeric ?? null,
    value_bool: value_bool ?? null,
    value_json: (value_json ?? null) as Json | null,
    unit: unit ?? null,
    source: 'user_correction',
    confidence: 1.0,
    observed_at: new Date().toISOString(),
  })

  if (factError) {
    return NextResponse.json({ error: 'Failed to save fact' }, { status: 500 })
  }

  // --- Update denormalized cache in user_profile if it's a mapped field ---
  const profileField = PROFILE_FIELD_MAP[field_key]
  if (profileField) {
    const profileValue =
      value_json !== undefined
        ? value_json
        : value_text !== undefined
          ? value_text
          : value_numeric !== undefined
            ? value_numeric
            : value_bool !== undefined
              ? value_bool
              : null

    // Dynamic key — cast needed because Supabase's typed Update doesn't accept computed keys
    const patch = {
      [profileField]: profileValue,
      updated_at: new Date().toISOString(),
    } as TablesUpdate<'user_profile'>
    const { error: profileError } = await supabase
      .from('user_profile')
      .update(patch)
      .eq('user_id', user.id)

    if (profileError) {
      return NextResponse.json({ error: 'Failed to update profile cache' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
