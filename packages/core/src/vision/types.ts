export interface DetectedIngredient {
  label: string
  portion_estimate: string
  grams_estimate: number
  kcal_estimate: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface MealAnalysisResult {
  meal_type_guess: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink' | 'dessert'
  ingredients_detected: DetectedIngredient[]
  kcal_estimate_min: number
  kcal_estimate_max: number
  protein_g_min: number
  protein_g_max: number
  carbs_g_min: number
  carbs_g_max: number
  fat_g_min: number
  fat_g_max: number
  confidence_score: number
  user_warnings: string[]
}
