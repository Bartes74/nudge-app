import type { GuardrailProfile, GuardrailResult } from './types'

/** BMI < 16 = severe underweight (critical); 16–17.5 = underweight (warning); > 40 = severe obesity (warning) */
const BMI_CRITICAL_LOW = 16
const BMI_WARNING_LOW = 17.5
const BMI_WARNING_HIGH = 40

function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100
  return weight_kg / (height_m * height_m)
}

export function checkBmiExtreme(profile: GuardrailProfile): GuardrailResult | null {
  if (profile.weight_kg === null || profile.height_cm === null) return null
  if (profile.weight_kg <= 0 || profile.height_cm <= 0) return null

  const bmi = calculateBMI(profile.weight_kg, profile.height_cm)
  const bmiRounded = Math.round(bmi * 10) / 10

  if (bmi < BMI_CRITICAL_LOW) {
    return {
      flag: 'bmi_extreme',
      severity: 'critical',
      message: `BMI wynosi ${bmiRounded} (ciężkie niedożywienie). Wymagana konsultacja lekarska przed rozpoczęciem programu.`,
      restrictions: [
        'block_plan_generation',
        'block_calorie_targets',
        'block_deficit_recommendations',
      ],
    }
  }

  if (bmi < BMI_WARNING_LOW) {
    return {
      flag: 'bmi_extreme',
      severity: 'warning',
      message: `BMI wynosi ${bmiRounded} (niedowaga). Rekomendujemy konsultację z dietetykiem przed wdrożeniem planu deficytowego.`,
      restrictions: [
        'block_deficit_recommendations',
        'require_medical_disclaimer',
      ],
    }
  }

  if (bmi > BMI_WARNING_HIGH) {
    return {
      flag: 'bmi_extreme',
      severity: 'warning',
      message: `BMI wynosi ${bmiRounded} (otyłość III stopnia). Rekomendujemy konsultację z lekarzem przed rozpoczęciem intensywnego programu.`,
      restrictions: [
        'block_high_intensity_training',
        'require_medical_disclaimer',
      ],
    }
  }

  return null
}
