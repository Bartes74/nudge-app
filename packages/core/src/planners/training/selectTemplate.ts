import type { PlannerProfile } from './types'
import type { PlanTemplate } from './types'
import { fbwTemplate } from './templates/fbw'
import { upperLowerTemplate } from './templates/upper_lower'
import { pplTemplate } from './templates/ppl'
import { splitTemplate } from './templates/split'

/**
 * Pure deterministic rule: given a profile, return the best-fit template.
 *
 * Decision matrix:
 *  days ≤ 3 | any level       → FBW
 *  days = 4 | zero/beginner   → FBW (3x) + 1 active rest
 *  days = 4 | amateur         → Upper/Lower
 *  days = 4 | advanced        → Split (4-day)
 *  days = 5 | zero/beginner   → Upper/Lower (4x) + 1 active rest
 *  days = 5 | amateur/advanced → PPL (5x with core day) or Split (5-day)
 *  days ≥ 6 | amateur/advanced → PPL (6x)
 *  days ≥ 6 | zero/beginner   → Upper/Lower (treat as 4 days, rest 2)
 */
export function selectTemplate(profile: PlannerProfile): PlanTemplate {
  const days = profile.days_per_week ?? 3
  const level = profile.experience_level ?? 'beginner'

  if (days <= 3) {
    return fbwTemplate(days)
  }

  if (days === 4) {
    if (level === 'zero' || level === 'beginner') return fbwTemplate(3)
    if (level === 'advanced') return splitTemplate(4)
    return upperLowerTemplate()
  }

  if (days === 5) {
    if (level === 'zero' || level === 'beginner') return upperLowerTemplate()
    if (level === 'advanced') return splitTemplate(5)
    return pplTemplate(5)
  }

  // days >= 6
  if (level === 'zero' || level === 'beginner') return upperLowerTemplate()
  return pplTemplate(6)
}
