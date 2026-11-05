import { describe, expect, it } from 'vitest'
import { routesFor } from '../../data/routes'
import { MAY, REGION_BY_ID, REGIONS } from '../../data/seasons'
import { countrySuitability, ratingFor, routeSuitability, seasonalAdvice } from './seasonality'

const JANUARY = 0
const NOVEMBER = 10

describe('seasonal patterns', () => {
  it('rates every region for twelve months', () => {
    for (const region of REGIONS) expect(region.ratings).toHaveLength(12)
  })

  it('reflects the May contrast between Thai coasts', () => {
    expect(ratingFor(REGION_BY_ID.gulf, MAY)).toBeGreaterThan(ratingFor(REGION_BY_ID.andaman, MAY))
  })

  it('reflects the Andaman dry season from November to April', () => {
    for (const month of [10, 11, 0, 1, 2, 3]) {
      expect(ratingFor(REGION_BY_ID.andaman, month)).toBeGreaterThanOrEqual(4)
    }
  })

  it('reflects the Malaysian east coast season from March to October', () => {
    for (let month = 2; month <= 8; month += 1) {
      expect(ratingFor(REGION_BY_ID.eastcoast, month)).toBeGreaterThanOrEqual(4)
    }
    expect(ratingFor(REGION_BY_ID.eastcoast, 9)).toBeGreaterThanOrEqual(3)
    for (const month of [10, 11, 0, 1]) expect(ratingFor(REGION_BY_ID.eastcoast, month)).toBe(1)
  })

  it('gives Langkawi a pattern opposite to the east coast', () => {
    expect(ratingFor(REGION_BY_ID.langkawi, JANUARY)).toBeGreaterThan(ratingFor(REGION_BY_ID.eastcoast, JANUARY))
    expect(ratingFor(REGION_BY_ID.langkawi, MAY)).toBeLessThan(ratingFor(REGION_BY_ID.eastcoast, MAY))
  })

  it('rejects impossible months', () => {
    expect(() => ratingFor(REGION_BY_ID.kl, 12)).toThrow(RangeError)
  })
})

describe('seasonalAdvice', () => {
  it('keeps both recommended routes in May', () => {
    for (const country of ['thailand', 'malaysia'] as const) {
      const advice = seasonalAdvice(country, MAY)
      expect(advice.route.tier).toBe('recommended')
      expect(advice.switched).toBe(false)
      expect(advice.tone).toBe('good')
    }
  })

  it('switches Thailand to the Andaman route in January', () => {
    expect(seasonalAdvice('thailand', JANUARY).route.id).toBe('th-andaman')
  })

  it('switches Malaysia to the west coast during the monsoon', () => {
    const advice = seasonalAdvice('malaysia', NOVEMBER)
    expect(advice.route.id).toBe('my-west')
    expect(advice.switched).toBe(true)
  })

  it('never recommends routes that do not fit the trip length', () => {
    for (let month = 0; month < 12; month += 1) {
      expect(seasonalAdvice('malaysia', month).route.caveat).toBeUndefined()
    }
  })

  it('caps a route by its sea region', () => {
    const route = routesFor('malaysia').find(({ id }) => id === 'my-east')!
    expect(routeSuitability(route, JANUARY)).toBeLessThanOrEqual(1.5)
  })

  it('favours Malaysia for May on the 0–10 scale and follows the month', () => {
    expect(countrySuitability('malaysia', MAY)).toBeGreaterThan(countrySuitability('thailand', MAY))
    expect(countrySuitability('thailand', JANUARY)).not.toBe(countrySuitability('thailand', MAY))
  })
})
