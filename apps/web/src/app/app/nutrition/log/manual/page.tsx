'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app/nutrition/log"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Wróć
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Ręczny wpis</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Wpisz</span>
          <br />
          <span className="font-sans font-semibold">składniki.</span>
        </h1>
      </header>

      <div className="flex flex-col gap-2">
        <Label className="text-label uppercase text-muted-foreground">
          Typ posiłku <span className="normal-case tracking-tight">(opcjonalnie)</span>
        </Label>
        <Select value={mealType} onValueChange={setMealType}>
          <SelectTrigger>
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

      <div className="flex flex-col gap-3">
        {items.map((item, idx) => (
          <Card key={idx} variant="default" padding="md">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-label uppercase text-muted-foreground">
                Składnik{' '}
                <span className="font-mono tabular-nums text-foreground">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </p>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Usuń składnik"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Input
                id={`item-${idx}-label`}
                placeholder="Nazwa (np. ryż gotowany)"
                value={item.label}
                onChange={(e) => updateItem(idx, 'label', e.target.value)}
              />
              <Input
                id={`item-${idx}-portion`}
                placeholder="Porcja (np. ~200g, 1 talerz)"
                value={item.portion_estimate}
                onChange={(e) => updateItem(idx, 'portion_estimate', e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`item-${idx}-kcal`} className="text-label uppercase text-muted-foreground">
                    Kalorie <span className="text-brand">*</span>
                  </Label>
                  <Input
                    id={`item-${idx}-kcal`}
                    type="number"
                    min="0"
                    placeholder="kcal"
                    value={item.kcal_estimate}
                    onChange={(e) => updateItem(idx, 'kcal_estimate', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`item-${idx}-protein`} className="text-label uppercase text-muted-foreground">
                    Białko (g)
                  </Label>
                  <Input
                    id={`item-${idx}-protein`}
                    type="number"
                    min="0"
                    placeholder="g"
                    value={item.protein_g}
                    onChange={(e) => updateItem(idx, 'protein_g', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`item-${idx}-carbs`} className="text-label uppercase text-muted-foreground">
                    Węgle (g)
                  </Label>
                  <Input
                    id={`item-${idx}-carbs`}
                    type="number"
                    min="0"
                    placeholder="g"
                    value={item.carbs_g}
                    onChange={(e) => updateItem(idx, 'carbs_g', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`item-${idx}-fat`} className="text-label uppercase text-muted-foreground">
                    Tłuszcze (g)
                  </Label>
                  <Input
                    id={`item-${idx}-fat`}
                    type="number"
                    min="0"
                    placeholder="g"
                    value={item.fat_g}
                    onChange={(e) => updateItem(idx, 'fat_g', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}

        <Button type="button" variant="outline" className="gap-2" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Dodaj składnik
        </Button>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading}
        isLoading={loading}
        className="w-full"
        size="hero"
      >
        Zapisz posiłek
      </Button>
    </div>
  )
}
