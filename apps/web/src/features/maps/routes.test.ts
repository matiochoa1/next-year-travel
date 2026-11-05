import { describe, expect, it } from 'vitest'
import { PLACES, ROUTES } from '../../data/routes'
import { legCoordinates, routeBounds, routeGeoJson } from './legGeometry'

const BOUNDS = {
  thailand: { lat: [5.5, 20.5], lng: [97.3, 105.7] },
  malaysia: { lat: [0.8, 7.5], lng: [99.6, 119.3] },
}

describe('map data', () => {
  it('keeps every place inside its country', () => {
    for (const place of Object.values(PLACES)) {
      const { lat, lng } = BOUNDS[place.country]
      expect(place.lat, place.id).toBeGreaterThan(lat[0] as number)
      expect(place.lat, place.id).toBeLessThan(lat[1] as number)
      expect(place.lng, place.id).toBeGreaterThan(lng[0] as number)
      expect(place.lng, place.id).toBeLessThan(lng[1] as number)
    }
  })

  it('never crosses water overland', () => {
    for (const route of ROUTES) {
      for (const leg of route.legs) {
        if (leg.mode !== 'road' && leg.mode !== 'rail') continue
        for (const id of [leg.from, leg.to]) {
          const isIsland = PLACES[id]?.kind === 'island'
          // George Town is on Penang island but is really connected by road bridges.
          const bridged = id === 'penang' && leg.bridge === true
          expect(isIsland && !bridged, `${route.id}: ${leg.from} → ${leg.to}`).toBe(false)
        }
      }
    }
  })

  it('reaches every island by sea or air', () => {
    for (const route of ROUTES) {
      for (const leg of route.legs) {
        if (PLACES[leg.to]?.kind === 'island') expect(['boat', 'ferry', 'flight']).toContain(leg.mode)
      }
    }
  })

  it('has connected legs that touch every stop', () => {
    for (const route of ROUTES) {
      const stops = new Set(route.stops.map((stop) => stop.place))
      const touched = new Set(route.legs.flatMap((leg) => [leg.from, leg.to]))
      for (const leg of route.legs) {
        expect(stops.has(leg.from), `${route.id}/${leg.from}`).toBe(true)
        expect(stops.has(leg.to), `${route.id}/${leg.to}`).toBe(true)
      }
      for (const stop of stops) expect(touched.has(stop), `${route.id}/${stop}`).toBe(true)
    }
  })

  it('flags options that do not fit in the 15-day plan', () => {
    for (const id of ['my-sabah', 'my-redang']) {
      expect(ROUTES.find((route) => route.id === id)?.caveat).toMatch(/15 días/)
    }
  })

  it('shows Thailand’s Gulf islands as the primary route', () => {
    const primary = ROUTES.filter((route) => route.tier === 'recommended')
    expect(primary.map((route) => route.id).sort()).toEqual(['my-east', 'th-gulf'])
  })
})

describe('leg geometry', () => {
  const leg = (mode: 'flight' | 'ferry') => ({ from: 'bangkok', to: 'chiangmai', mode, note: '' })

  it('draws flights as an arc that keeps its endpoints', () => {
    const line = legCoordinates(leg('flight'))
    expect(line.length).toBeGreaterThan(10)
    expect(line[0]).toEqual([PLACES.bangkok?.lng, PLACES.bangkok?.lat])
    expect(line.at(-1)?.[1]).toBeCloseTo(PLACES.chiangmai?.lat ?? 0)
  })

  it('draws surface legs as a direct conceptual line', () => {
    expect(legCoordinates(leg('ferry'))).toHaveLength(2)
  })

  it('computes bounds containing every stop', () => {
    const route = ROUTES[0]!
    const [[west, south], [east, north]] = routeBounds(route)
    for (const { place } of route.stops) {
      const { lat, lng } = PLACES[place]!
      expect(lat).toBeGreaterThanOrEqual(south)
      expect(lat).toBeLessThanOrEqual(north)
      expect(lng).toBeGreaterThanOrEqual(west)
      expect(lng).toBeLessThanOrEqual(east)
    }
  })

  it('exports one feature per leg', () => {
    const route = ROUTES[0]!
    expect(routeGeoJson(route).features).toHaveLength(route.legs.length)
  })
})
