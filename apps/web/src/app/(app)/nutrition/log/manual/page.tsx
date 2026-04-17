'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface ItemForm {
  label: string
  portion_estimate: string
  kcal_estimate: string
  protein_g: string
  carbs_g: string
  fat_g: string
}

function emptyItem(): ItemForm {
  return { label: '', portion_estimate: '', kcal_estimate: '', protein_g: '', carbs_g: '', fat_g: '' }
}

export default function ManualMealLogPage() {
  const router = useRouter()
  const [mealType, setMealType] = useState<string>('')
  const [items, setItems] = useState<ItemForm[]>([emptyItem()])
  const [loading, setLoading] = useState(false)

  function updateItem(idx: number, field: keyof ItemForm, value: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    const validItems = items.filter((i) => i.label.trim() && i.kcal_estimate)
    if (validItems.length === 0) {
      toast.error('Dodaj przynajmniej jeden składnik z kaloriami')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/meal/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_type: mealType || undefined,
          items: validItems.map((i) => ({
            label: i.label.trim(),
            portion_estimate: i.portion_estimate.trim() || undefined,
            kcal_estimate: Number(i.kcal_estimate),
            protein_g: i.protein_g ? Number(i.protein_g) : undefined,
            carbs_g: i.carbs_g ? Number(i.carbs_g) : undefined,
            fat_g: i.fat_g ? Number(i.fat_g) : undefined,
          })),
        }),
      })

      if (!res.ok) {
        toast.error('Nie udało się zapisać posiłku')
        return
      }

      const { meal_log_id } = await res.json() as { meal_log_id: string }
      router.push(`/app/nutrition/log/${meal_log_id}`)
    } catch {
      toast.error('Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Ręczny wpis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wpisz składniki i kalorie
        </p>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Typ posiłku (opcjonalnie)</Label>
        <Select value={mealType} onValueChange={setMealType}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Wybierz typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Śniadanie</SelectItem>
            <SelectItem value="lunch">Obiad</SelectItem>
            <SelectItem value="dinner">Kolacja</SelectItem>
            <SelectItem value="snack">Przekąska</SelectItem>
            <SelectItem value="drink">Napój</SelectItem>
            <SelectItem value="dessert">Deser</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-xl border bg-card p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Składnik {idx + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mb-2">
              <Input
                placeholder="Nazwa (np. ryż gotowany)"
                value={item.label}
                onChange={(e) => updateItem(idx, 'label', e.target.value)}
              />
            </div>

            <div className="mb-3">
              <Input
                placeholder="Porcja (np. ~200g, 1 talerz)"
                value={item.portion_estimate}
                onChange={(e) => updateItem(idx, 'portion_estimate', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Kalorie *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="kcal"
                  value={item.kcal_estimate}
                  onChange={(e) => updateItem(idx, 'kcal_estimate', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Białko (g)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="g"
                  value={item.protein_g}
                  onChange={(e) => updateItem(idx, 'protein_g', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Węgle (g)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="g"
                  value={item.carbs_g}
                  onChange={(e) => updateItem(idx, 'carbs_g', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tłuszcze (g)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="g"
                  value={item.fat_g}
                  onChange={(e) => updateItem(idx, 'fat_g', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" className="gap-2" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Dodaj składnik
        </Button>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full gap-2"
        size="lg"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Zapisz posiłek
      </Button>
    </div>
  )
}
