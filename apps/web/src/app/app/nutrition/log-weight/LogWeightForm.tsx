'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardEyebrow } from '@/components/ui/card'
import { ChevronDown, AlertTriangle, Save } from 'lucide-react'

function todayDateInputValue(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function LogWeightForm() {
  const router = useRouter()
  const [weightKg, setWeightKg] = useState('')
  const [measuredOn, setMeasuredOn] = useState(todayDateInputValue())
  const [showCircumferences, setShowCircumferences] = useState(false)
  const [circumferences, setCircumferences] = useState({
    waist_cm: '',
    hips_cm: '',
    chest_cm: '',
    thigh_cm: '',
    arm_cm: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const weight = parseFloat(weightKg)
    if (isNaN(weight) || weight < 20 || weight > 500) {
      setError('Podaj prawidłową wagę (20–500 kg)')
      return
    }

    setSubmitting(true)
    try {
      const measuredAt = measuredOn ? new Date(`${measuredOn}T12:00:00`).toISOString() : undefined
      const weightRes = await fetch('/api/measurements/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: weight, measured_at: measuredAt }),
      })

      if (!weightRes.ok) {
        const body = await weightRes.json()
        setError(body.error ?? 'Błąd zapisu')
        setSubmitting(false)
        return
      }

      const hasCircumferences = Object.values(circumferences).some((v) => v.trim() !== '')
      if (showCircumferences && hasCircumferences) {
        const payload: Record<string, number> = {}
        for (const [key, val] of Object.entries(circumferences)) {
          const num = parseFloat(val)
          if (!isNaN(num)) payload[key] = num
        }

        await fetch('/api/measurements/circumference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      router.push('/app/progress/weight')
      router.refresh()
    } catch {
      setError('Błąd połączenia. Spróbuj ponownie.')
      setSubmitting(false)
    }
  }

  function handleCircumferenceChange(field: keyof typeof circumferences, value: string) {
    setCircumferences((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card variant="default" padding="md">
        <Label
          htmlFor="weight"
          className="text-label uppercase text-muted-foreground"
        >
          Waga ciała
        </Label>
        <div className="mt-3 flex items-baseline gap-3">
          <Input
            id="weight"
            type="number"
            inputMode="decimal"
            placeholder="74.5"
            min={20}
            max={500}
            step={0.1}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="h-14 border-0 bg-transparent px-0 font-mono text-display-m tabular-nums tracking-tight text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <span className="text-body-m text-muted-foreground">kg</span>
        </div>

        <div className="mt-4">
          <Label
            htmlFor="measured_on"
            className="text-label uppercase text-muted-foreground"
          >
            Data pomiaru
          </Label>
          <Input
            id="measured_on"
            type="date"
            value={measuredOn}
            max={todayDateInputValue()}
            onChange={(e) => setMeasuredOn(e.target.value)}
            className="mt-2 h-11"
          />
        </div>
      </Card>

      <button
        type="button"
        onClick={() => setShowCircumferences((p) => !p)}
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ease-premium ${
            showCircumferences ? 'rotate-180' : ''
          }`}
        />
        {showCircumferences ? 'Ukryj obwody' : 'Dodaj obwody'}
      </button>

      {showCircumferences && (
        <Card variant="recessed" padding="md">
          <CardEyebrow>Obwody ciała</CardEyebrow>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { key: 'waist_cm', label: 'Talia' },
              { key: 'hips_cm', label: 'Biodra' },
              { key: 'chest_cm', label: 'Klatka' },
              { key: 'thigh_cm', label: 'Udo' },
              { key: 'arm_cm', label: 'Ramię' },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={key} className="text-label uppercase text-muted-foreground">
                  {label}
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id={key}
                    type="number"
                    inputMode="decimal"
                    placeholder="—"
                    step={0.1}
                    value={circumferences[key as keyof typeof circumferences]}
                    onChange={(e) =>
                      handleCircumferenceChange(key as keyof typeof circumferences, e.target.value)
                    }
                    className="font-mono tabular-nums"
                  />
                  <span className="text-body-s text-muted-foreground">cm</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && (
        <Card variant="destructive" padding="sm" role="alert">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-body-m text-foreground">{error}</p>
          </div>
        </Card>
      )}

      <Button
        type="submit"
        disabled={submitting || !weightKg}
        isLoading={submitting}
        size="hero"
        className="w-full gap-2"
      >
        <Save className="h-4 w-4" />
        Zapisz pomiar
      </Button>
    </form>
  )
}
