'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface MealLogItem {
  id: string
  label: string
  portion_estimate: string | null
  grams_estimate: number | null
  kcal_estimate: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  is_user_corrected: boolean
}

interface EditableItem extends MealLogItem {
  dirty: boolean
  saving: boolean
}

export default function MealLogEditPage() {
  const { mealLogId } = useParams<{ mealLogId: string }>()
  const router = useRouter()
  const [items, setItems] = useState<EditableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/meal/${mealLogId}`)
        if (!res.ok) { setError('Nie znaleziono wpisu'); return }
        const { mealLog } = await res.json() as { mealLog: { meal_log_items: MealLogItem[] } }
        setItems(mealLog.meal_log_items.map((i) => ({ ...i, dirty: false, saving: false })))
      } catch {
        setError('Błąd wczytywania')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [mealLogId])

  function updateField(id: string, field: keyof MealLogItem, value: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const numericFields = ['grams_estimate', 'kcal_estimate', 'protein_g', 'carbs_g', 'fat_g']
        const parsed = numericFields.includes(field) ? (value === '' ? null : Number(value)) : value
        return { ...item, [field]: parsed, dirty: true }
      }),
    )
  }

  async function saveItem(item: EditableItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, saving: true } : i)))

    try {
      const res = await fetch(`/api/meal/${mealLogId}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: item.label,
          portion_estimate: item.portion_estimate,
          grams_estimate: item.grams_estimate,
          kcal_estimate: item.kcal_estimate,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
        }),
      })

      if (!res.ok) {
        toast.error('Nie udało się zapisać')
        return
      }

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, dirty: false, saving: false, is_user_corrected: true } : i)),
      )
      toast.success('Zapisano')
    } catch {
      toast.error('Błąd zapisu')
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, saving: false } : i)))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Edytuj składniki</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Popraw wartości rozpoznane przez AI
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border bg-card p-4">
            <div className="mb-3">
              <Label htmlFor={`label-${item.id}`} className="text-xs text-muted-foreground">
                Składnik
              </Label>
              <Input
                id={`label-${item.id}`}
                value={item.label}
                onChange={(e) => updateField(item.id, 'label', e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="mb-3">
              <Label htmlFor={`portion-${item.id}`} className="text-xs text-muted-foreground">
                Porcja
              </Label>
              <Input
                id={`portion-${item.id}`}
                value={item.portion_estimate ?? ''}
                onChange={(e) => updateField(item.id, 'portion_estimate', e.target.value)}
                placeholder="np. ~150g, 1 talerz"
                className="mt-1"
              />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              {(
                [
                  ['kcal_estimate', 'Kalorie (kcal)'],
                  ['protein_g', 'Białko (g)'],
                  ['carbs_g', 'Węgle (g)'],
                  ['fat_g', 'Tłuszcze (g)'],
                ] as const
              ).map(([field, fieldLabel]) => (
                <div key={field}>
                  <Label htmlFor={`${field}-${item.id}`} className="text-xs text-muted-foreground">
                    {fieldLabel}
                  </Label>
                  <Input
                    id={`${field}-${item.id}`}
                    type="number"
                    min="0"
                    value={item[field] ?? ''}
                    onChange={(e) => updateField(item.id, field, e.target.value)}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>

            <Button
              size="sm"
              disabled={!item.dirty || item.saving}
              onClick={() => saveItem(item)}
              className="w-full gap-2"
            >
              {item.saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Zapisz zmiany
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => router.push(`/app/nutrition/log/${mealLogId}`)}
      >
        Gotowe
      </Button>
    </div>
  )
}
