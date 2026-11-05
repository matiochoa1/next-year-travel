import { REGION_BY_ID, REGIONS, type ClimateRegion, type Rating } from '../../data/seasons'
import { routesFor, type Route } from '../../data/routes'
import type { Country } from '../../data/types'

export const ratingFor = (region: ClimateRegion, month: number): Rating => {
  const rating = region.ratings[month]
  if (rating === undefined) throw new RangeError(`Invalid month ${month}`)
  return rating
}

export const regionsFor = (country: Country) => REGIONS.filter((region) => region.country === country)

/**
 * The sea region dominates because a closed island cancels the point of the route, while a rainy
 * city is merely less pleasant. A route can therefore never score above what its sea allows + 0.5.
 */
export function routeSuitability(route: Route, month: number): number {
  const sea = ratingFor(REGION_BY_ID[route.seaRegion], month)
  const others = route.regions.filter((id) => id !== route.seaRegion)
  const land = others.length
    ? others.reduce((sum, id) => sum + ratingFor(REGION_BY_ID[id], month), 0) / others.length
    : sea
  return Math.min(sea * 0.7 + land * 0.3, sea + 0.5)
}

export interface SeasonalAdvice {
  route: Route
  suitability: number
  tone: 'good' | 'mixed' | 'bad'
  /** The route shown by default no longer is the best for this month. */
  switched: boolean
  message: string
}

const mainRoutes = (country: Country) =>
  routesFor(country).filter((route) => !route.caveat)

export function seasonalAdvice(country: Country, month: number): SeasonalAdvice {
  const candidates = mainRoutes(country)
  const best = candidates.reduce((winner, route) =>
    routeSuitability(route, month) > routeSuitability(winner, month) ? route : winner,
  )
  const suitability = routeSuitability(best, month)
  const switched = best.tier !== 'recommended'
  const tone = suitability >= 3.5 ? 'good' : suitability >= 2.5 ? 'mixed' : 'bad'
  const message = switched
    ? `Ese mes encaja mejor la ruta «${best.name}» que la recomendada para mayo.`
    : tone === 'good'
      ? `La ruta «${best.name}» encaja bien con el patrón climático habitual de ese mes.`
      : `La ruta «${best.name}» es la mejor opción de ese mes, pero con reservas: el mar o la lluvia pueden condicionar el viaje.`
  return { route: best, suitability, tone, switched, message }
}

/** 0–10 score used by the comparison engine; it follows the selected month. */
export const countrySuitability = (country: Country, month: number) =>
  Math.round(seasonalAdvice(country, month).suitability * 2 * 10) / 10
