import { COUNTRY_PROFILES, CRITERIA, type Criterion } from '../../data/comparison'
import { COUNTRIES, COUNTRY_NAMES, type Country } from '../../data/types'

export type Weights = Record<Criterion, number>

export const DEFAULT_WEIGHTS: Weights = {
  beaches: 5, hopping: 5, snorkel: 4, nature: 4, culture: 3, nightlife: 2, budget: 3, transport: 2,
}

export function matchScores(weights: Weights): Record<Country, number> | null {
  const total = CRITERIA.reduce((sum, { id }) => sum + weights[id], 0)
  if (total === 0) return null
  const score = (country: Country) =>
    Math.round(CRITERIA.reduce((sum, { id }) => sum + weights[id] * COUNTRY_PROFILES[country][id], 0) / total)
  return { thailand: score('thailand'), malaysia: score('malaysia') }
}

/** Contribution of each criterion to the gap between countries, largest first. */
function drivers(weights: Weights, winner: Country) {
  const loser = COUNTRIES.find((country) => country !== winner) as Country
  return CRITERIA.map(({ id, short }) => ({
    short,
    impact: weights[id] * (COUNTRY_PROFILES[winner][id] - COUNTRY_PROFILES[loser][id]),
  }))
    .filter(({ impact }) => impact > 0)
    .sort((a, b) => b.impact - a.impact)
}

const joinNatural = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items.at(-1)}` : (items[0] ?? '')

export function explainMatch(weights: Weights): string {
  const scores = matchScores(weights)
  if (!scores) return 'Mueve algún control para descubrir qué destino encaja mejor contigo.'
  const gap = Math.abs(scores.thailand - scores.malaysia)
  const winner: Country = scores.thailand >= scores.malaysia ? 'thailand' : 'malaysia'
  const top = drivers(weights, winner).slice(0, 2).map(({ short }) => short)
  if (gap <= 1) {
    return 'Tus prioridades dejan a los dos destinos prácticamente empatados: te lo vas a pasar bien con cualquiera, así que decide con el corazón.'
  }
  const strength = gap >= 8 ? 'claramente' : 'por poco'
  return `Con tus prioridades, ${COUNTRY_NAMES[winner]} encaja ${strength} mejor, sobre todo porque valoras ${joinNatural(top)}.`
}
