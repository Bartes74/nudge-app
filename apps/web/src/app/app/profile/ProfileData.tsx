'use client'

import * as React from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardEyebrow } from '@/components/ui/card'

interface ProfileDataProps {
  profile: {
    display_name: string | null
    birth_date: string | null
    gender: string | null
    height_cm: number | null
    current_weight_kg: number | null
    experience_level: string | null
    primary_goal: string | null
    nutrition_mode: string | null
    dietary_constraints: string[] | null
    life_context: string[] | null
  }
}

type FieldKey = keyof ProfileDataProps['profile']

const LABELS: Record<FieldKey, string> = {
  display_name: 'Imię',
  birth_date: 'Data urodzenia',
  gender: 'Płeć',
  height_cm: 'Wzrost',
  current_weight_kg: 'Masa ciała',
  experience_level: 'Doświadczenie',
  primary_goal: 'Cel główny',
  nutrition_mode: 'Tryb żywieniowy',
  dietary_constraints: 'Ograniczenia',
  life_context: 'Kontekst',
}

const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Redukcja',
  muscle_building: 'Masa mięśniowa',
  strength_performance: 'Siła i wydolność',
  general_health: 'Zdrowy styl życia',
}

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner_zero: 'Spokojny start',
  beginner: 'Początkujący',
  intermediate: 'Średniozaawansowany',
  advanced: 'Zaawansowany',
}

const GENDER_LABELS: Record<string, string> = {
  female: 'Kobieta',
  male: 'Mężczyzna',
  other: 'Inna',
  prefer_not_to_say: 'Wolę nie podawać',
}

const NUTRITION_LABELS: Record<string, string> = {
  simple: 'Prosty',
  ranges: 'Zakresy',
  exact: 'Dokładny',
}

function formatValue(key: FieldKey, value: ProfileDataProps['profile'][FieldKey]): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) {
    return value.length === 0 ? '—' : value.join(', ')
  }
  if (key === 'primary_goal') return GOAL_LABELS[value as string] ?? String(value)
  if (key === 'experience_level') return EXPERIENCE_LABELS[value as string] ?? String(value)
  if (key === 'gender') return GENDER_LABELS[value as string] ?? String(value)
  if (key === 'nutrition_mode') return NUTRITION_LABELS[value as string] ?? String(value)
  if (key === 'height_cm') return `${value} cm`
  if (key === 'current_weight_kg') return `${value} kg`
  return String(value)
}

const EDITABLE_TEXT_FIELDS = new Set<FieldKey>([
  'display_name',
  'birth_date',
  'height_cm',
  'current_weight_kg',
])
const NUMERIC_FIELDS = new Set<FieldKey>(['height_cm', 'current_weight_kg'])

interface FieldRowProps {
  fieldKey: FieldKey
  value: ProfileDataProps['profile'][FieldKey]
  onSave: (key: FieldKey, newValue: string) => Promise<void>
}

function FieldRow({ fieldKey, value, onSave }: FieldRowProps) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(String(value ?? ''))
  const [saving, setSaving] = React.useState(false)
  const isEditable = EDITABLE_TEXT_FIELDS.has(fieldKey)
  const isNumeric = NUMERIC_FIELDS.has(fieldKey)

  async function handleSave() {
    if (!draft.trim()) return
    setSaving(true)
    try {
      await onSave(fieldKey, draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-3 first:pt-0 last:border-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-label uppercase text-muted-foreground">{LABELS[fieldKey]}</p>
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setEditing(false)
            }}
            autoFocus
            className={`mt-1 h-9 ${isNumeric ? 'font-mono tabular-nums' : ''}`}
          />
        ) : (
          <p
            className={`mt-0.5 truncate text-body-m font-medium tracking-tight ${
              isNumeric ? 'font-mono tabular-nums' : ''
            }`}
          >
            {formatValue(fieldKey, value)}
          </p>
        )}
      </div>

      {isEditable && (
        <div className="mt-3 flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleSave}
                isLoading={saving}
                aria-label="Zapisz"
              >
                {!saving && <Check className="h-3.5 w-3.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setEditing(false)}
                aria-label="Anuluj"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => {
                setDraft(String(value ?? ''))
                setEditing(true)
              }}
              aria-label={`Edytuj ${LABELS[fieldKey]}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function ProfileData({ profile }: ProfileDataProps) {
  const [localProfile, setLocalProfile] = React.useState(profile)
  const [flashMessage, setFlashMessage] = React.useState<string | null>(null)

  async function handleSave(key: FieldKey, newValue: string) {
    const isNumeric = NUMERIC_FIELDS.has(key)
    const body: Record<string, unknown> = { field_key: key }
    if (isNumeric) {
      body.value_numeric = parseFloat(newValue)
    } else {
      body.value_text = newValue
    }

    const res = await fetch('/api/profile/field', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error('Failed to save')
    }

    setLocalProfile((prev) => ({
      ...prev,
      [key]: isNumeric ? parseFloat(newValue) : newValue,
    }))

    setFlashMessage('Zapisano')
    setTimeout(() => setFlashMessage(null), 2000)
  }

  const GROUPS: { title: string; fields: FieldKey[] }[] = [
    {
      title: 'Dane podstawowe',
      fields: ['display_name', 'birth_date', 'gender', 'height_cm', 'current_weight_kg'],
    },
    {
      title: 'Trening',
      fields: ['experience_level', 'primary_goal'],
    },
    {
      title: 'Żywienie',
      fields: ['nutrition_mode', 'dietary_constraints'],
    },
    {
      title: 'Kontekst',
      fields: ['life_context'],
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {flashMessage && (
        <div
          role="status"
          className="rounded-xl bg-success/10 px-4 py-2 text-center text-body-s font-medium text-success ring-1 ring-inset ring-success/20"
        >
          {flashMessage}
        </div>
      )}

      {GROUPS.map((group) => (
        <Card key={group.title} variant="default" padding="md">
          <CardEyebrow>{group.title}</CardEyebrow>
          <div className="mt-3">
            {group.fields.map((key) => (
              <FieldRow
                key={key}
                fieldKey={key}
                value={localProfile[key]}
                onSave={handleSave}
              />
            ))}
          </div>
        </Card>
      ))}

      <p className="text-center text-body-s text-muted-foreground">
        Wszystkie zmiany są zapisywane w historii — możesz zawsze sprawdzić, co i kiedy zmieniłeś/aś.
      </p>
    </div>
  )
}
