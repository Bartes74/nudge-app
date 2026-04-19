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

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

function validateFieldValue(
  fieldKey: string,
  values: {
    value_text: string | null | undefined
    value_numeric: number | null | undefined
    value_bool: boolean | null | undefined
    value_json: unknown
  },
): string | number | boolean | Json | null {
  if (fieldKey === 'display_name') {
    return z.string().trim().min(1).max(80).parse(values.value_text ?? '')
  }

  if (fieldKey === 'birth_date') {
    return z.string().regex(DATE_ONLY_REGEX).parse(values.value_text ?? '')
  }

  if (fieldKey === 'gender') {
    return z.enum(['female', 'male', 'other', 'prefer_not_to_say']).parse(values.value_text ?? '')
  }

  if (fieldKey === 'height_cm') {
    return z.number().min(80).max(260).parse(values.value_numeric)
  }

  if (fieldKey === 'current_weight_kg') {
    return z.number().min(20).max(500).parse(values.value_numeric)
  }

  if (values.value_json !== undefined) return (values.value_json ?? null) as Json | null
  if (values.value_text !== undefined) return values.value_text ?? null
  if (values.value_numeric !== undefined) return values.value_numeric ?? null
  if (values.value_bool !== undefined) return values.value_bool ?? null

  return null
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
  let validatedValue: string | number | boolean | Json | null

  try {
    validatedValue = validateFieldValue(field_key, {
      value_text,
      value_numeric,
      value_bool,
      value_json,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid value for field' }, { status: 400 })
  }

  // --- Append fact (never update, always insert new) ---
  const { error: factError } = await supabase.from('user_profile_facts').insert({
    user_id: user.id,
    field_key,
    value_text: typeof validatedValue === 'string' ? validatedValue : null,
    value_numeric: typeof validatedValue === 'number' ? validatedValue : null,
    value_bool: typeof validatedValue === 'boolean' ? validatedValue : null,
    value_json:
      typeof validatedValue === 'object' && validatedValue !== null
        ? (validatedValue as Json)
        : null,
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
    // Dynamic key — cast needed because Supabase's typed Update doesn't accept computed keys
    const patch = {
      [profileField]: validatedValue,
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

  if (field_key === 'current_weight_kg' && typeof validatedValue === 'number') {
    const { error: measurementError } = await supabase.from('body_measurements').insert({
      user_id: user.id,
      weight_kg: validatedValue,
      measured_at: new Date().toISOString(),
      source: 'user_correction',
    })

    if (measurementError) {
      return NextResponse.json({ error: 'Failed to sync weight history' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
