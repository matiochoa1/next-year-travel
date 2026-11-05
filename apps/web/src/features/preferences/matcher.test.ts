import { describe, expect, it } from 'vitest'
import { DEFAULT_WEIGHTS, explainMatch, matchScores, type Weights } from './matcher'

const zero: Weights = { beaches: 0, hopping: 0, snorkel: 0, nature: 0, culture: 0, nightlife: 0, budget: 0, transport: 0 }

describe('matchScores', () => {
  it('computes a weighted average', () => {
    expect(matchScores({ ...zero, nightlife: 5 })).toEqual({ thailand: 95, malaysia: 55 })
    expect(matchScores({ ...zero, nightlife: 1, budget: 1 })).toEqual({ thailand: 85, malaysia: 68 })
  })

  it('returns null when nothing matters', () => {
    expect(matchScores(zero)).toBeNull()
  })

  it('is scale independent', () => {
    const one = { ...zero, beaches: 1, snorkel: 1 }
    const five = { ...zero, beaches: 5, snorkel: 5 }
    expect(matchScores(one)).toEqual(matchScores(five))
  })

  it('stays within 0–100', () => {
    const scores = matchScores(DEFAULT_WEIGHTS)!
    for (const value of Object.values(scores)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
    }
  })
})

describe('explainMatch', () => {
  it('names the winner and its main reason in Spanish', () => {
    const text = explainMatch({ ...zero, nightlife: 5 })
    expect(text).toContain('Tailandia')
    expect(text).toContain('claramente')
    expect(text).toContain('vida nocturna')
  })

  it('credits Malaysia when snorkel and budget dominate', () => {
    expect(explainMatch({ ...zero, snorkel: 5, budget: 5, nature: 3 })).toContain('Malasia')
  })

  it('reports a tie', () => {
    expect(explainMatch({ ...zero, beaches: 5 })).toContain('empatados')
  })

  it('asks for input when all weights are zero', () => {
    expect(explainMatch(zero)).toContain('Mueve')
  })
})
