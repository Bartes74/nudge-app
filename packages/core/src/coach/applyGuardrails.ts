import type { GuardrailResult } from './types'

const FALLBACK_MEDICAL =
  'Nie mogę postawić diagnozy ani zalecić leczenia — skonsultuj się z lekarzem lub fizjoterapeutą.'

const FALLBACK_DRUG_DOSAGE =
  'Nie podaję dawek leków ani suplementów farmaceutycznych — skonsultuj się z farmaceutą lub lekarzem.'

interface GuardrailRule {
  id: string
  test: (text: string) => boolean
  action: 'block' | 'flag'
  replacement?: string
}

const RULES: GuardrailRule[] = [
  {
    id: 'medical_diagnosis',
    test: (t) =>
      /masz\s+(cukrzycę|nadciśnienie|hipotensję|niedoczynność|nadczynność|astmę|arytmię|skoliozę|dyskopatię|rwę|przepuklinę)/.test(
        t.toLowerCase(),
      ),
    action: 'block',
    replacement: FALLBACK_MEDICAL,
  },
  {
    id: 'drug_dosage',
    test: (t) =>
      /(\d+\s*mg|\d+\s*mcg|\d+\s*µg|\d+\s*ml)\s+(dawka|dziennie|na dobę|dziennej|dzienną)/.test(
        t.toLowerCase(),
      ),
    action: 'block',
    replacement: FALLBACK_DRUG_DOSAGE,
  },
  {
    id: 'extreme_weight_loss_endorsement',
    test: (t) =>
      /schudniesz\s+\d+\s*kg\s+(w|przez)\s+\d+\s*(dzień|dni|tydzień|tygodnie|tygodni)/i.test(t),
    action: 'flag',
  },
  {
    id: 'starvation_recommendation',
    test: (t) =>
      /(jedz\s+(mniej\s+niż|poniżej)\s+\d{3,4}\s*kcal|głodówka|post\s+wodny\s+przez\s+\d+\s*dni)/i.test(
        t,
      ),
    action: 'flag',
  },
  {
    id: 'injury_continue_training',
    test: (t) =>
      /(mimo\s+bólu\s+(kontynuuj|ćwicz|trenuj)|trenuj\s+przez\s+ból|push\s+through\s+the\s+pain)/i.test(
        t,
      ),
    action: 'block',
    replacement:
      'Trening przez ból może prowadzić do poważniejszego urazu. Zrób przerwę i skonsultuj się z fizjoterapeutą.',
  },
  {
    id: 'harmful_supplement_advice',
    test: (t) =>
      /(weź|przyjmij|zażyj|dawkuj)\s+(efedryną|efedryna|dnp|dinitrofenol|sibutramina|clenbuterol|sterydy\s+anaboliczne)/i.test(
        t,
      ),
    action: 'block',
    replacement:
      'Nie mogę polecać substancji zabronionych lub potencjalnie niebezpiecznych. Skonsultuj się z lekarzem.',
  },
  {
    id: 'guarantee_results',
    test: (t) => /gwarantuję|na\s+pewno\s+schudniesz|na\s+pewno\s+przytyjesz|na\s+100%\s+zadziała/i.test(t),
    action: 'flag',
  },
  {
    id: 'eating_disorder_enablement',
    test: (t) =>
      /(nie\s+jedz\s+przez\s+\d+\s*(dni|godzin|h)|opuść\s+\d+\s*posiłk|pomijaj\s+posiłki\s+regularnie)/i.test(
        t,
      ),
    action: 'flag',
  },
  {
    id: 'mental_health_diagnosis',
    test: (t) =>
      /masz\s+(depresję|zaburzenia\s+odżywiania|anoreksję|bulimię|ortoreksję|dysmorfię)/i.test(t),
    action: 'block',
    replacement:
      'Nie mogę diagnozować problemów zdrowia psychicznego. Jeśli masz obawy w tym zakresie, skonsultuj się z psychologiem lub psychiatrą.',
  },
  {
    id: 'age_restricted_advice',
    test: (t) =>
      /(dla\s+dziecka|dla\s+niemowlęcia|dla\s+noworodka|w\s+ciąży\s+(możesz|ćwicz|trenuj))/i.test(
        t,
      ),
    action: 'flag',
  },
]

export function applyGuardrails(text: string, _userFlags?: string[]): GuardrailResult {
  const flags: string[] = []
  let result = text
  let blocked = false
  let blockReplacement = ''

  for (const rule of RULES) {
    if (rule.test(text)) {
      flags.push(rule.id)
      if (rule.action === 'block' && rule.replacement) {
        blocked = true
        blockReplacement = rule.replacement
        break
      }
    }
  }

  if (blocked) {
    return { safe: false, modified_text: blockReplacement, flags }
  }

  if (flags.length > 0) {
    const disclaimer =
      '\n\n_Uwaga: Ta informacja ma charakter ogólny. W razie wątpliwości skonsultuj się ze specjalistą._'
    result = text + disclaimer
    return { safe: false, modified_text: result, flags }
  }

  return { safe: true, modified_text: text, flags: [] }
}
