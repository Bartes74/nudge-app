import { callStructuredVision, type StructuredCallResult } from '../llm/client.ts'
import { MEAL_VISION_SCHEMA } from './mealVisionSchema.ts'
import type { MealAnalysisResult } from './types.ts'

const SYSTEM_PROMPT = `Jesteś asystentem analizy posiłków. Na podstawie zdjęcia szacujesz skład i wartości odżywcze.

ZASADY BEZWZGLĘDNE:
1. Zawsze podawaj ZAKRESY (min/max), nigdy pojedynczą pewną wartość. Niepewność jest normalna i uczciwa.
2. Gdy nie jesteś pewien składnika — mimo to go wymień z niższym confidence i szerszym zakresem.
3. confidence_score: 0.0–1.0. 0.9+ = bardzo czytelne zdjęcie z prostymi produktami. 0.5 = przeciętne. Poniżej 0.4 = trudne do oceny.
4. user_warnings: konkretne ostrzeżenia dotyczące niepewności (np. "Sos niewidoczny na zdjęciu — może znacząco zmienić kalorie"). Max 3 ostrzeżenia, po polsku.
5. Nie dawaj porad medycznych, nie oceniaj jakości diety, nie komentuj wyborów żywieniowych.
6. Język składników (label): po polsku, opisowo ("kurczak grillowany bez skóry", nie "chicken").
7. portion_estimate: opisowo ("~150g", "1 średni talerz", "2 łyżki").`

export async function analyzeMealPhoto(opts: {
  apiKey: string
  imageUrl: string
  note?: string
}): Promise<StructuredCallResult<MealAnalysisResult>> {
  const noteFragment = opts.note
    ? `\n\nNotatka od użytkownika: "${opts.note}"`
    : ''

  return callStructuredVision<MealAnalysisResult>({
    apiKey: opts.apiKey,
    model: 'gpt-4o',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Przeanalizuj to zdjęcie posiłku.${noteFragment}\n\nPodaj skład i wartości odżywcze zgodnie ze schematem JSON.`,
    imageUrl: opts.imageUrl,
    jsonSchema: MEAL_VISION_SCHEMA,
    schemaName: 'meal_vision_analysis',
  })
}
