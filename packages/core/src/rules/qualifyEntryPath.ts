import {
  normalizeExperienceLevel,
  type AdaptationPhase,
  type EntryPath,
  type ExperienceLevel,
  type NutritionMode,
  type RecentActivityWindow,
  type TonePreset,
  type TrainingBackground,
} from '../domain/profile'

export interface EntryPathQualificationInput {
  ageYears: number | null
  heightCm: number | null
  currentWeightKg: number | null
  recentActivityWindow: RecentActivityWindow | null
  trainingBackground: TrainingBackground | null
  healthConstraints: string[]
}

export interface EntryPathQualificationResult {
  experienceLevel: ExperienceLevel
  entryPath: EntryPath
  adaptationPhase: AdaptationPhase | null
  guidedMode: boolean
  needsGuidedMode: boolean
  inferredBeginnerStatus: boolean
  inferredBeginnerReasonCodes: string[]
  tonePreset: TonePreset
  nutritionMode: NutritionMode
  requiresSafetyScreening: boolean
}

function calculateBmi(heightCm: number | null, currentWeightKg: number | null): number | null {
  if (heightCm == null || currentWeightKg == null || heightCm <= 0) return null
  const heightM = heightCm / 100
  return currentWeightKg / (heightM * heightM)
}

function hasNoRecentRegularTraining(
  recentActivityWindow: RecentActivityWindow | null,
  trainingBackground: TrainingBackground | null,
): boolean {
  if (trainingBackground === 'just_starting') return true
  if (recentActivityWindow === 'never_regular' || recentActivityWindow === 'over_12_months') {
    return true
  }
  return false
}

export function qualifyEntryPath(
  input: EntryPathQualificationInput,
): EntryPathQualificationResult {
  const healthConstraints = input.healthConstraints.filter((item) => item !== 'none')
  const bmi = calculateBmi(input.heightCm, input.currentWeightKg)
  const noRecentTraining = hasNoRecentRegularTraining(
    input.recentActivityWindow,
    input.trainingBackground,
  )
  const reasonCodes: string[] = []

  if (noRecentTraining) {
    reasonCodes.push('no_regular_training_last_12_months')
  }

  if ((input.ageYears ?? 0) > 45 && noRecentTraining) {
    reasonCodes.push('age_over_45_with_low_recent_activity')
  }

  if ((bmi ?? 0) >= 25 && noRecentTraining) {
    reasonCodes.push('higher_bmi_with_low_recent_activity')
  }

  const requiresSafetyScreening = healthConstraints.some((constraint) =>
    [
      'pain_or_injury',
      'medical_condition',
      'medication_affecting_exertion',
      'cardiovascular',
      'back_pain',
      'knee_pain',
      'shoulder_pain',
      'hip_pain',
      'wrist_pain',
      'other_contraindication',
    ].includes(constraint),
  )

  if (requiresSafetyScreening) {
    reasonCodes.push('safety_screening_required')
  }

  if (input.trainingBackground === 'training_regularly' || input.recentActivityWindow === 'within_3_months') {
    return {
      experienceLevel: 'intermediate',
      entryPath: 'standard_training',
      adaptationPhase: null,
      guidedMode: false,
      needsGuidedMode: false,
      inferredBeginnerStatus: false,
      inferredBeginnerReasonCodes: [],
      tonePreset: 'partnering',
      nutritionMode: 'ranges',
      requiresSafetyScreening,
    }
  }

  if (noRecentTraining) {
    return {
      experienceLevel: 'beginner_zero',
      entryPath: 'guided_beginner',
      adaptationPhase: 'phase_0_familiarization',
      guidedMode: true,
      needsGuidedMode: true,
      inferredBeginnerStatus: true,
      inferredBeginnerReasonCodes: reasonCodes,
      tonePreset: 'calm_guided',
      nutritionMode: 'simple',
      requiresSafetyScreening,
    }
  }

  if (input.trainingBackground === 'returning_after_break') {
    return {
      experienceLevel: 'beginner',
      entryPath: 'standard_training',
      adaptationPhase: 'phase_1_adaptation',
      guidedMode: false,
      needsGuidedMode: false,
      inferredBeginnerStatus: true,
      inferredBeginnerReasonCodes: reasonCodes,
      tonePreset: 'warm_encouraging',
      nutritionMode: 'simple',
      requiresSafetyScreening,
    }
  }

  return {
    experienceLevel: normalizeExperienceLevel('beginner') ?? 'beginner',
    entryPath: 'standard_training',
    adaptationPhase: null,
    guidedMode: false,
    needsGuidedMode: false,
    inferredBeginnerStatus: false,
    inferredBeginnerReasonCodes: [],
    tonePreset: 'partnering',
    nutritionMode: 'ranges',
    requiresSafetyScreening,
  }
}
