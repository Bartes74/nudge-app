'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, Loader2 } from 'lucide-react'

export function LogWeightForm() {
  const router = useRouter()
  const [weightKg, setWeightKg] = useState('')
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
      const weightRes = await fetch('/api/measurements/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: weight }),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="weight" className="text-base font-medium">
            Waga ciała
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="weight"
              type="number"
              inputMode="decimal"
              placeholder="np. 74.5"
              min={20}
              max={500}
              step={0.1}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="text-lg"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">kg</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowCircumferences((p) => !p)}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${showCircumferences ? 'rotate-180' : ''}`}
        />
        {showCircumferences ? 'Ukryj obwody' : 'Dodaj obwody (opcjonalnie)'}
      </button>

      {showCircumferences && (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-4 text-sm font-medium">Obwody ciała</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'waist_cm', label: 'Talia' },
              { key: 'hips_cm', label: 'Biodra' },
              { key: 'chest_cm', label: 'Klatka piersiowa' },
              { key: 'thigh_cm', label: 'Udo' },
              { key: 'arm_cm', label: 'Ramię' },
            ].map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={key} className="text-xs text-muted-foreground">
                  {label}
                </Label>
                <div className="flex items-center gap-1">
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
                  />
                  <span className="text-xs text-muted-foreground">cm</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={submitting || !weightKg} className="w-full">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Zapisz pomiar'}
      </Button>
    </form>
  )
}
