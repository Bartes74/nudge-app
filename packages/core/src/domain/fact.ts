// Fact domain types (event-sourced profile facts)

export type FactSource =
  | 'onboarding'
  | 'user_input'
  | 'user_correction'
  | 'ai_inferred'
  | 'behavioral_signal'
  | 'measurement_device'
  | 'photo_analysis'
  | 'checkin'
  | 'coach_chat'

export interface Fact {
  field_key: string
  value_text: string | null
  value_numeric: number | null
  value_bool: boolean | null
  value_json: unknown | null
  unit: string | null
  source: FactSource
  confidence: number
  observed_at: string  // ISO timestamp
}
