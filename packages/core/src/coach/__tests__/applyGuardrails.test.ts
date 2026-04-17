import { describe, it, expect } from 'vitest'
import { applyGuardrails } from '../applyGuardrails'

describe('applyGuardrails', () => {
  describe('blocks medical diagnosis', () => {
    it('blocks text containing diagnosis statement', () => {
      const text = 'Na podstawie Twoich objawów masz dyskopatię lędźwiową.'
      const result = applyGuardrails(text)
      expect(result.safe).toBe(false)
      expect(result.flags).toContain('medical_diagnosis')
      expect(result.modified_text).not.toContain('dyskopatię')
    })

    it('blocks cukrzyca diagnosis', () => {
      const result = applyGuardrails('Twoje objawy wskazują, że masz cukrzycę.')
      expect(result.safe).toBe(false)
      expect(result.flags).toContain('medical_diagnosis')
    })
  })

  describe('blocks drug dosage', () => {
    it('blocks specific drug dosage', () => {
      const text = 'Zalecam 500 mg dawka dziennie witaminy D.'
      const result = applyGuardrails(text)
      expect(result.safe).toBe(false)
      expect(result.flags).toContain('drug_dosage')
      expect(result.modified_text).toContain('farmaceutą')
    })

    it('blocks mcg dosage', () => {
      const result = applyGuardrails('Przyjmij 100 mcg dziennej dawka.')
      expect(result.safe).toBe(false)
    })
  })

  describe('blocks injury during training', () => {
    it('blocks "trenuj przez ból"', () => {
      const result = applyGuardrails('Mimo bólu kontynuuj trening — to normalne.')
      expect(result.safe).toBe(false)
      expect(result.flags).toContain('injury_continue_training')
      expect(result.modified_text).toContain('fizjoterapeutą')
    })
  })

  describe('blocks harmful supplements', () => {
    it('blocks mention of DNP', () => {
      const result = applyGuardrails('Weź DNP aby szybciej spalić tłuszcz.')
      expect(result.safe).toBe(false)
      expect(result.flags).toContain('harmful_supplement_advice')
    })
  })

  describe('blocks mental health diagnosis', () => {
    it('blocks eating disorder diagnosis', () => {
      const result = applyGuardrails('Wydaje mi się, że masz zaburzenia odżywiania.')
      expect(result.safe).toBe(false)
      expect(result.flags).toContain('mental_health_diagnosis')
    })
  })

  describe('flags (adds disclaimer, does not block)', () => {
    it('flags extreme weight loss endorsement', () => {
      const result = applyGuardrails('Schudniesz 5 kg w 2 tygodnie stosując tę metodę.')
      expect(result.safe).toBe(false)
      expect(result.flags).toContain('extreme_weight_loss_endorsement')
      expect(result.modified_text).toContain('_Uwaga')
      expect(result.modified_text).toContain('5 kg')
    })

    it('flags guarantee results', () => {
      const result = applyGuardrails('Gwarantuję że schudniesz.')
      expect(result.safe).toBe(false)
      expect(result.flags).toContain('guarantee_results')
    })

    it('flags starvation recommendation', () => {
      const result = applyGuardrails('Jedz mniej niż 800 kcal przez tydzień.')
      expect(result.safe).toBe(false)
      expect(result.flags).toContain('starvation_recommendation')
    })
  })

  describe('passes safe content', () => {
    it('passes normal training advice', () => {
      const text = 'Wykonaj martwy ciąg z prostymi plecami, uginając kolana.'
      const result = applyGuardrails(text)
      expect(result.safe).toBe(true)
      expect(result.flags).toHaveLength(0)
      expect(result.modified_text).toBe(text)
    })

    it('passes diet advice without diagnosis', () => {
      const text = 'Kurczak pierś to świetne źródło białka — ok. 31g/100g.'
      const result = applyGuardrails(text)
      expect(result.safe).toBe(true)
    })

    it('passes motivational message', () => {
      const text = 'Widzę postęp — przez ostatnie 4 tygodnie ukończyłeś 14 treningów.'
      const result = applyGuardrails(text)
      expect(result.safe).toBe(true)
    })
  })
})
