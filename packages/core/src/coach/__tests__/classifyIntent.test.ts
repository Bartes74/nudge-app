import { describe, it, expect } from 'vitest'
import { fastClassifyIntent, hasPainSignal, hasExtremeGoalSignal } from '../classifyIntent'

describe('hasPainSignal', () => {
  const painCases: [string, string][] = [
    ['boli mnie kolano', 'kolano boli'],
    ['strzyka w łokciu', 'strzyka'],
    ['drętwieje mi ręka podczas bench', 'drętwienie'],
    ['czuję rwanie w plecach', 'rwanie/rwa'],
    ['mam dyskomfort w barku', 'dyskomfort'],
    ['skręciłem kostkę', 'skręcenie'],
    ['kontuzja stawu', 'kontuzja'],
    ['piecze mnie w klatce', 'pieczenie'],
    ['chrupie mi kolano podczas przysiadu', 'chrupanie'],
    ['drętwi mnie palec', 'drętwienie wariant'],
  ]

  it.each(painCases)('detects pain in: "%s" (%s)', (message) => {
    expect(hasPainSignal(message)).toBe(true)
  })

  const noPainCases = [
    'jak prawidłowo wykonać wyciskanie',
    'ile białka powinienem jeść',
    'nie mam motywacji do treningu',
    'chcę schudnąć 5 kg',
    'jaki jest dobry plan na masę',
  ]

  it.each(noPainCases)('no pain signal in: "%s"', (message) => {
    expect(hasPainSignal(message)).toBe(false)
  })
})

describe('hasExtremeGoalSignal', () => {
  const extremeCases: [string, string][] = [
    ['chcę schudnąć 10 kg w 2 tygodnie', '>5 kg/tydzień'],
    ['chcę schudnąć 5 kg w 3 tyg.', '>1.6 kg/tydzień'],
    ['chcę stracić 20 kg w 10 tygodni', '2 kg/tydzień'],
  ]

  it.each(extremeCases)('detects extreme goal in: "%s" (%s)', (message) => {
    expect(hasExtremeGoalSignal(message)).toBe(true)
  })

  const normalCases = [
    'chcę schudnąć 4 kg w 8 tygodni',
    'planuję stracić 1 kg tygodniowo',
    'chcę zrzucić 5 kg w 2 miesiące',
    'jak schudnąć 3 kg na wakacje za miesiąc',
  ]

  it.each(normalCases)('no extreme goal in: "%s"', (message) => {
    expect(hasExtremeGoalSignal(message)).toBe(false)
  })
})

describe('fastClassifyIntent', () => {
  it('returns pain for messages with pain signals', () => {
    expect(fastClassifyIntent('boli mnie barko przy wyciskaniu')).toBe('pain')
  })

  it('returns goal_extreme for extreme weight loss requests', () => {
    expect(fastClassifyIntent('chcę schudnąć 10 kg w 2 tygodnie')).toBe('goal_extreme')
  })

  it('pain takes priority over extreme goal', () => {
    expect(fastClassifyIntent('boli mnie kolano i chcę schudnąć 10 kg w tydzień')).toBe('pain')
  })

  it('returns null for normal messages', () => {
    expect(fastClassifyIntent('jak prawidłowo wykonać martwy ciąg?')).toBeNull()
    expect(fastClassifyIntent('ile kalorii potrzebuję')).toBeNull()
    expect(fastClassifyIntent('nie mam energii do treningu')).toBeNull()
  })
})
