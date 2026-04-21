import type {
  PlannerProfile,
  PlanTemplate,
  TrainingPlannerContext,
} from './types'
import { fbwTemplate } from './templates/fbw'
import { upperLowerTemplate } from './templates/upper_lower'
import { pplTemplate } from './templates/ppl'
import { splitTemplate } from './templates/split'

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function reorderFocus(
  focus: string[],
  prioritize: string[],
  deprioritize: string[],
): string[] {
  const prioritySet = new Set(prioritize)
  const deprioritizeSet = new Set(deprioritize)

  const preferred = focus.filter((entry) => prioritySet.has(entry))
  const neutral = focus.filter((entry) => !prioritySet.has(entry) && !deprioritizeSet.has(entry))
  const reduced = focus.filter((entry) => deprioritizeSet.has(entry) && !prioritySet.has(entry))

  return unique([...preferred, ...neutral, ...reduced])
}

function buildPlanningDirectives(
  profile: PlannerProfile,
  context?: TrainingPlannerContext,
): string[] {
  if (!context) return []

  const directives: string[] = []
  const prioritizedCategories = context.muscle_balance.undertrained_categories.slice(0, 3)
  const deprioritizedCategories = context.muscle_balance.overtrained_categories.slice(0, 3)

  if (prioritizedCategories.length > 0) {
    directives.push(
      `W tym planie dołóż więcej jakościowej pracy dla kategorii: ${prioritizedCategories.join(', ')}.`,
    )
  }

  if (deprioritizedCategories.length > 0) {
    directives.push(
      `Kategorie ${deprioritizedCategories.join(', ')} utrzymaj na objętości podtrzymującej, bez dokładania zbędnej objętości.`,
    )
  }

  if (context.adaptation.progress_ready_exercises.length > 0 && context.adaptation.progression_bias === 'progress') {
    directives.push(
      `Jeśli wracają ćwiczenia ${context.adaptation.progress_ready_exercises.slice(0, 4).join(', ')}, zaplanuj realistyczną progresję: najpierw powtórzenia, potem ciężar.`,
    )
  }

  if (context.adaptation.deload_exercises.length > 0) {
    directives.push(
      `Jeśli wracają ćwiczenia ${context.adaptation.deload_exercises.join(', ')}, zostaw łatwiejszy wariant, mniej objętości albo wyraźniejszy margines RIR.`,
    )
  }

  if (context.adaptation.repeatable_exercises.length > 0 && context.adaptation.requires_more_guidance) {
    directives.push(
      `Opieraj plan na znajomych ćwiczeniach: ${context.adaptation.repeatable_exercises.slice(0, 6).join(', ')}.`,
    )
  }

  if (context.adaptation.avoid_exercise_slugs.length > 0) {
    directives.push(
      `Nie planuj ćwiczeń: ${context.adaptation.avoid_exercise_slugs.join(', ')}.`,
    )
  }

  if (context.adaptation.should_reduce_novelty) {
    directives.push('Nie dokładaj wielu nowych wzorców ruchowych ani nowych maszyn w jednej wersji planu.')
  } else if (context.adaptation.can_introduce_new_skills) {
    directives.push('Możesz wprowadzić maksymalnie jeden nowy wzorzec ruchowy lub jedną nową maszynę na tydzień.')
  }

  if (context.communication.guidance_level === 'full' || context.communication.guidance_level === 'supported') {
    directives.push('Dobieraj ćwiczenia, które łatwo wytłumaczyć prostym językiem i bez technicznego żargonu.')
  } else {
    directives.push('Copy może być krótsze i bardziej techniczne, ale wciąż konkretne i praktyczne.')
  }

  if (context.adaptation.progression_bias === 'slow_down') {
    directives.push('Priorytetem jest odzyskanie pewności, jakości ruchu i regeneracji, a nie agresywna progresja.')
  } else if (context.adaptation.progression_bias === 'progress') {
    directives.push('Plan ma stawiać ambitne, ale realne cele progresji zgodne z ostatnimi udanymi treningami.')
  }

  if (context.adaptation.blocks_progression_until_plan_completed) {
    directives.push(
      'Nie zwiększaj trudności względem poprzedniego tygodnia. Powtórz podobny poziom albo lekko uprość plan, bo wcześniejsze zaplanowane treningi z minionych dni nie zostały ukończone z podsumowaniem.',
    )
  }

  if (profile.injuries.length > 0) {
    directives.push(`Uwzględnij ograniczenia użytkownika: ${profile.injuries.join(', ')}.`)
  }

  return directives
}

function applyPlanningContextToTemplate(
  template: PlanTemplate,
  profile: PlannerProfile,
  context?: TrainingPlannerContext,
): PlanTemplate {
  if (!context) return template

  const durationCap = profile.session_duration_min ?? null
  const durationAdjustment =
    context.adaptation.progression_bias === 'slow_down'
      ? -10
      : context.adaptation.requires_more_guidance
        ? -5
        : 0
  const prioritizedCategories = context.muscle_balance.undertrained_categories
  const deprioritizedCategories = context.muscle_balance.overtrained_categories
  const planningDirectives = buildPlanningDirectives(profile, context)

  return {
    ...template,
    workouts: template.workouts.map((workout) => {
      const adjustedDuration = durationCap == null
        ? Math.max(30, workout.duration_min_estimated + durationAdjustment)
        : Math.max(
            30,
            Math.min(durationCap, workout.duration_min_estimated + durationAdjustment),
          )

      const focus = reorderFocus(workout.focus, prioritizedCategories, deprioritizedCategories)

      if (focus.includes('legs') && prioritizedCategories.includes('core') && !focus.includes('core')) {
        focus.push('core')
      }

      return {
        ...workout,
        duration_min_estimated: adjustedDuration,
        focus,
      }
    }),
    notes_for_llm: [
      template.notes_for_llm,
      ...planningDirectives.map((directive) => `MANDATORY DIRECTIVE: ${directive}`),
    ].join(' '),
    planning_directives: planningDirectives,
  }
}

function selectBaseTemplate(
  profile: PlannerProfile,
  context?: TrainingPlannerContext,
): PlanTemplate {
  const days = profile.days_per_week ?? 3
  const level = profile.experience_level ?? 'beginner'
  const adaptation = context?.adaptation
  const isStandardEntry = profile.entry_path === 'standard_training'
  if (days <= 3) {
    return fbwTemplate(days)
  }

  if (days === 4) {
    if (level === 'beginner_zero' || level === 'beginner') {
      if (
        isStandardEntry &&
        adaptation?.can_introduce_new_skills &&
        !adaptation.requires_more_guidance &&
        adaptation.training_maturity !== 'novice'
      ) {
        return upperLowerTemplate()
      }
      return fbwTemplate(3)
    }
    if (level === 'advanced') {
      if (adaptation?.progression_bias === 'slow_down' || adaptation?.requires_more_guidance) {
        return upperLowerTemplate()
      }
      return splitTemplate(4)
    }
    return upperLowerTemplate()
  }

  if (days === 5) {
    if (level === 'beginner_zero' || level === 'beginner') return upperLowerTemplate()
    if (level === 'advanced') {
      if (adaptation?.progression_bias === 'slow_down' || adaptation?.requires_more_guidance) {
        return pplTemplate(5)
      }
      return splitTemplate(5)
    }
    return pplTemplate(5)
  }

  if (level === 'beginner_zero' || level === 'beginner') return upperLowerTemplate()
  return pplTemplate(6)
}

export function selectTemplate(
  profile: PlannerProfile,
  context?: TrainingPlannerContext,
): PlanTemplate {
  const baseTemplate = selectBaseTemplate(profile, context)
  return applyPlanningContextToTemplate(baseTemplate, profile, context)
}
