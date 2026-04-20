export interface GuardedWorkoutFeedbackInput {
  wentWell: string | null
  wentPoorly: string | null
  whatToImprove: string | null
  combinedText: string
  blockedForLlm: boolean
  reasons: string[]
}

const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const MULTI_SPACE_REGEX = /[^\S\r\n]{2,}/g
const MULTI_BREAK_REGEX = /\n{3,}/g

const PROMPT_INJECTION_PATTERNS: Array<{ reason: string; pattern: RegExp }> = [
  {
    reason: 'contains_role_override_language',
    pattern:
      /\b(ignore|disregard|override|forget)\b.{0,40}\b(previous|above|earlier|system|developer|instructions?)\b/i,
  },
  {
    reason: 'mentions_system_or_developer_prompt',
    pattern: /\b(system prompt|developer prompt|hidden prompt|internal prompt)\b/i,
  },
  {
    reason: 'contains_role_tag_markup',
    pattern: /<\s*(system|assistant|developer|user)\s*>/i,
  },
  {
    reason: 'contains_role_json',
    pattern: /"role"\s*:\s*"(system|assistant|developer|user)"/i,
  },
  {
    reason: 'contains_chat_role_prefix',
    pattern: /(^|\n)\s*(system|assistant|developer|user)\s*:/i,
  },
  {
    reason: 'requests_model_reprogramming',
    pattern: /\b(act as|you are now|follow these instructions|jailbreak|bypass safety)\b/i,
  },
  {
    reason: 'contains_code_fence',
    pattern: /```/,
  },
]

function sanitizeFeedbackText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null

  const sanitized = value
    .normalize('NFKC')
    .replace(/\r\n/g, '\n')
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(MULTI_SPACE_REGEX, ' ')
    .replace(MULTI_BREAK_REGEX, '\n\n')
    .trim()

  return sanitized.length > 0 ? sanitized : null
}

export function guardWorkoutFeedbackInput(input: {
  wentWell?: string | null
  wentPoorly?: string | null
  whatToImprove?: string | null
}): GuardedWorkoutFeedbackInput {
  const wentWell = sanitizeFeedbackText(input.wentWell)
  const wentPoorly = sanitizeFeedbackText(input.wentPoorly)
  const whatToImprove = sanitizeFeedbackText(input.whatToImprove)

  const combinedText = [wentWell, wentPoorly, whatToImprove].filter(Boolean).join('\n')

  const reasons = PROMPT_INJECTION_PATTERNS.flatMap(({ reason, pattern }) =>
    pattern.test(combinedText) ? [reason] : [],
  )

  return {
    wentWell,
    wentPoorly,
    whatToImprove,
    combinedText,
    blockedForLlm: reasons.length > 0,
    reasons,
  }
}
