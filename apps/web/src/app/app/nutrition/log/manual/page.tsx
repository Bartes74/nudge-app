'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
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

type MealTypeValue = '' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink' | 'dessert'

interface ItemForm {
  label: string
  portion_estimate: string
  kcal_estimate: string
  protein_g: string
  carbs_g: string
  fat_g: string
  manualNutritionExpanded: boolean
}

interface MealTypeFieldConfig {
  entryLabel: string
  nameLabel: string
  namePlaceholder: string
  portionLabel: string
  portionPlaceholder: string
  helperText: string
}

const DEFAULT_FIELD_CONFIG: MealTypeFieldConfig = {
  entryLabel: 'Składnik',
  nameLabel: 'Co jesz?',
  namePlaceholder: 'Np. focaccia, pomidor, mozzarella',
  portionLabel: 'Ilość',
  portionPlaceholder: 'Np. 2 kawałki, pół sztuki, 100 g',
  helperText: 'Wystarczy nazwa i ilość. Jeśli nie znasz kalorii i makro, spróbujemy oszacować je automatycznie.',
}

const MEAL_TYPE_FIELD_CONFIG: Record<Exclude<MealTypeValue, ''>, MealTypeFieldConfig> = {
  breakfast: {
    entryLabel: 'Składnik śniadania',
    nameLabel: 'Co jesz na śniadanie?',
    namePlaceholder: 'Np. jajecznica, chleb razowy, twarożek',
    portionLabel: 'Ilość / porcja',
    portionPlaceholder: 'Np. 2 jajka, 2 kromki, 150 g',
    helperText: 'Opisz produkt i porcję. Resztę oszacujemy, jeśli nie chcesz wpisywać makro ręcznie.',
  },
  lunch: {
    entryLabel: 'Składnik obiadu',
    nameLabel: 'Co jesz na obiad?',
    namePlaceholder: 'Np. kurczak pieczony, ryż, surówka',
    portionLabel: 'Ilość / porcja',
    portionPlaceholder: 'Np. 1 talerz, 200 g, 3 łyżki',
    helperText: 'Najlepiej wpisz główne składniki i mniej więcej ile ich było.',
  },
  dinner: {
    entryLabel: 'Składnik kolacji',
    nameLabel: 'Co jesz na kolację?',
    namePlaceholder: 'Np. kanapka z szynką, sałatka grecka',
    portionLabel: 'Ilość / porcja',
    portionPlaceholder: 'Np. 2 kanapki, 1 miska, 150 g',
    helperText: 'Podaj nazwę i porcję. Jeśli makro zostanie puste, spróbujemy je oszacować.',
  },
  snack: {
    entryLabel: 'Przekąska',
    nameLabel: 'Co podjadasz?',
    namePlaceholder: 'Np. banan, garść orzechów, batonik',
    portionLabel: 'Ilość',
    portionPlaceholder: 'Np. 1 sztuka, 1 garść, 45 g',
    helperText: 'Dla przekąsek wystarczy prosty opis i ilość.',
  },
  drink: {
    entryLabel: 'Napój',
    nameLabel: 'Co pijesz?',
    namePlaceholder: 'Np. latte, sok pomarańczowy, cola',
    portionLabel: 'Objętość',
    portionPlaceholder: 'Np. 250 ml, 1 szklanka, 1 puszka',
    helperText: 'Dla napojów najważniejsza jest nazwa i objętość.',
  },
  dessert: {
    entryLabel: 'Deser',
    nameLabel: 'Co to za deser?',
    namePlaceholder: 'Np. tiramisu, lody waniliowe, sernik',
    portionLabel: 'Porcja',
    portionPlaceholder: 'Np. 1 kawałek, 2 gałki, 150 g',
    helperText: 'Podaj nazwę deseru i porcję. Makro oszacujemy, jeśli go nie znasz.',
  },
}

function emptyItem(): ItemForm {
  return {
    label: '',
    portion_estimate: '',
    kcal_estimate: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    manualNutritionExpanded: false,
  }
}

function fieldConfigForMealType(mealType: MealTypeValue): MealTypeFieldConfig {
  if (!mealType) return DEFAULT_FIELD_CONFIG
  return MEAL_TYPE_FIELD_CONFIG[mealType]
}

export default function ManualMealLogPage() {
  const router = useRouter()
  const [mealType, setMealType] = useState<MealTypeValue>('')
  const [items, setItems] = useState<ItemForm[]>([emptyItem()])
  const [loading, setLoading] = useState(false)

  const fieldConfig = fieldConfigForMealType(mealType)

  function updateItem(idx: number, field: keyof ItemForm, value: string | boolean) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    const validItems = items.filter((item) => item.label.trim() && item.portion_estimate.trim())
    if (validItems.length === 0) {
      toast.error('Dodaj przynajmniej jeden składnik z nazwą i ilością')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/meal/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_type: mealType || undefined,
          items: validItems.map((item) => ({
            label: item.label.trim(),
            portion_estimate: item.portion_estimate.trim(),
            kcal_estimate: item.kcal_estimate ? Number(item.kcal_estimate) : undefined,
            protein_g: item.protein_g ? Number(item.protein_g) : undefined,
            carbs_g: item.carbs_g ? Number(item.carbs_g) : undefined,
            fat_g: item.fat_g ? Number(item.fat_g) : undefined,
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
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app/nutrition/log" label="Jedzenie" />

      <PageHero
        eyebrow="Ręczny wpis"
        titleEmphasis="Wpisz"
        titleMain="składniki."
        lede="Podaj nazwę i ilość. Jeśli nie znasz kalorii i makro, spróbujemy oszacować je automatycznie."
      />

      <PageSection
        number="01 — Typ"
        title="Typ posiłku"
        description="To pole jest opcjonalne. Pomaga tylko lepiej opisać wpis."
        className="gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label className="text-label uppercase text-muted-foreground">
            Typ posiłku <span className="normal-case tracking-tight">(opcjonalnie)</span>
          </Label>
          <Select value={mealType} onValueChange={(value) => setMealType(value as MealTypeValue)}>
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
          <p className="text-body-s text-[var(--fg-secondary)]">{fieldConfig.helperText}</p>
        </div>
      </PageSection>

      <PageSection
        number="02 — Składniki"
        title="Dodaj składniki"
        description="Każdy wpis powinien zawierać nazwę i ilość. Własne kalorie i makro możesz dopisać tylko wtedy, gdy je znasz."
        className="gap-4"
      >
        <div className="flex flex-col gap-4">
          {items.map((item, idx) => (
            <Card key={idx} variant="default" padding="md">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-label uppercase text-muted-foreground">
                {fieldConfig.entryLabel}{' '}
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`item-${idx}-label`} className="text-label uppercase text-muted-foreground">
                  {fieldConfig.nameLabel}
                </Label>
                <Input
                  id={`item-${idx}-label`}
                  placeholder={fieldConfig.namePlaceholder}
                  value={item.label}
                  onChange={(e) => updateItem(idx, 'label', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`item-${idx}-portion`} className="text-label uppercase text-muted-foreground">
                  {fieldConfig.portionLabel}
                </Label>
                <Input
                  id={`item-${idx}-portion`}
                  placeholder={fieldConfig.portionPlaceholder}
                  value={item.portion_estimate}
                  onChange={(e) => updateItem(idx, 'portion_estimate', e.target.value)}
                />
              </div>

              {item.manualNutritionExpanded ? (
                <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-label uppercase text-muted-foreground">
                        Własne wartości <span className="normal-case tracking-tight">(opcjonalnie)</span>
                      </p>
                      <p className="mt-1 text-body-s text-muted-foreground">
                        Jeśli znasz kalorie albo makro, wpisz je tutaj. Puste pola spróbujemy oszacować.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateItem(idx, 'manualNutritionExpanded', false)}
                      className="text-body-s text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Ukryj
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`item-${idx}-kcal`} className="text-label uppercase text-muted-foreground">
                        Kalorie
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
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start"
                  onClick={() => updateItem(idx, 'manualNutritionExpanded', true)}
                >
                  Mam własne kalorie i makro
                </Button>
              )}
            </div>
            </Card>
          ))}

          <Button type="button" variant="outline" className="gap-2" onClick={addItem}>
            <Plus className="h-4 w-4" />
            Dodaj składnik
          </Button>
        </div>
      </PageSection>

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
