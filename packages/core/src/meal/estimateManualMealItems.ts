import { callStructured, type StructuredCallResult } from '../llm/client.ts'

export type ManualMealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'drink'
  | 'dessert'

export interface ManualMealEstimateInputItem {
  label: string
  portion_estimate: string
}

export interface ManualMealEstimateOutputItem {
  kcal_estimate: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface ManualMealEstimateResult {
  items: ManualMealEstimateOutputItem[]
  user_warnings: string[]
}

const MANUAL_MEAL_ESTIMATE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  required: ['items', 'user_warnings'],
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['kcal_estimate', 'protein_g', 'carbs_g', 'fat_g'],
        additionalProperties: false,
        properties: {
          kcal_estimate: { type: 'number' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
        },
      },
    },
    user_warnings: {
      type: 'array',
      items: { type: 'string' },
    },
  },
}

const SYSTEM_PROMPT = `Jesteś asystentem do szacowania wartości odżywczych dla ręcznie wpisanych posiłków.

Zasady:
1. Użytkownik podaje nazwę produktu/składnika i ilość. Twoim zadaniem jest uczciwie oszacować kalorie i makro.
2. Zwracaj dokładnie tyle pozycji, ile dostałeś na wejściu, i w tej samej kolejności.
3. kcal_estimate podawaj jako liczbę dla jednej opisanej porcji.
4. protein_g, carbs_g i fat_g podawaj jako liczby nieujemne. Możesz używać wartości dziesiętnych.
5. Jeśli opis jest nieprecyzyjny, wybierz najbardziej typową interpretację dla polskiego użytkownika i dodaj krótkie ostrzeżenie do user_warnings.
6. user_warnings: maksymalnie 3 krótkie komunikaty po polsku. Jeśli estymacja jest dość oczywista, zwróć pustą tablicę.
7. Nie dawaj porad zdrowotnych ani komentarzy o jakości diety.
8. Szacuj konserwatywnie. Nie udawaj dużej precyzji, jeśli porcja jest opisana ogólnie.`

export async function estimateManualMealItems(opts: {
  apiKey: string
  mealType?: ManualMealType
  items: ManualMealEstimateInputItem[]
}): Promise<StructuredCallResult<ManualMealEstimateResult>> {
  return callStructured<ManualMealEstimateResult>({
    apiKey: opts.apiKey,
    model: 'gpt-4o-mini',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: [
      'Oszacuj kalorie i makroskładniki dla ręcznie wpisanych pozycji.',
      'Jeśli typ posiłku jest podany, potraktuj go jako dodatkowy kontekst.',
      `Zwróć dokładnie ${opts.items.length} pozycji w tej samej kolejności co wejście.`,
      '',
      'Dane wejściowe:',
      JSON.stringify(
        {
          meal_type: opts.mealType ?? null,
          items: opts.items,
        },
        null,
        2,
      ),
    ].join('\n'),
    jsonSchema: MANUAL_MEAL_ESTIMATE_SCHEMA,
    schemaName: 'manual_meal_item_estimate',
  })
}
