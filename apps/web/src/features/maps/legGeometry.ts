import { PLACES, type Leg, type Route } from '../../data/routes'

export type LngLat = [number, number]

const ARC_SAMPLES = 32
/** Sideways bow relative to the leg's length, so flights read as "through the air". */
const ARC_BOW = 0.18

export function legCoordinates(leg: Leg): LngLat[] {
  const from = PLACES[leg.from]
  const to = PLACES[leg.to]
  if (!from || !to) throw new Error(`Unknown place in leg ${leg.from} → ${leg.to}`)
  const start: LngLat = [from.lng, from.lat]
  const end: LngLat = [to.lng, to.lat]
  if (leg.mode !== 'flight') return [start, end]

  const mid: LngLat = [
    (start[0] + end[0]) / 2 + (end[1] - start[1]) * ARC_BOW,
    (start[1] + end[1]) / 2 - (end[0] - start[0]) * ARC_BOW,
  ]
  return Array.from({ length: ARC_SAMPLES + 1 }, (_, i): LngLat => {
    const t = i / ARC_SAMPLES
    const a = (1 - t) ** 2
    const b = 2 * (1 - t) * t
    const c = t ** 2
    return [a * start[0] + b * mid[0] + c * end[0], a * start[1] + b * mid[1] + c * end[1]]
  })
}

export function routeGeoJson(route: Route) {
  return {
    type: 'FeatureCollection' as const,
    features: route.legs.map((leg) => ({
      type: 'Feature' as const,
      properties: { mode: leg.mode },
      geometry: { type: 'LineString' as const, coordinates: legCoordinates(leg) },
    })),
  }
}

export function routeBounds(route: Route): [LngLat, LngLat] {
  const lngs = route.stops.map(({ place }) => PLACES[place]?.lng ?? 0)
  const lats = route.stops.map(({ place }) => PLACES[place]?.lat ?? 0)
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}
