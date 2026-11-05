import { describe, expect, it } from 'vitest'
import { DURATIONS, ITINERARY_PLANS, type TravelStyle } from '../../data/itineraries'
import { PLACES } from '../../data/routes'
import { COUNTRIES } from '../../data/types'
import { buildItinerary } from './buildItinerary'

const STYLES: TravelStyle[] = ['relaxed', 'balanced', 'adventurous']

describe.each(COUNTRIES)('%s itinerary', (country) => {
  it.each(DURATIONS)('has exactly %i consecutive days', (duration) => {
    const days = buildItinerary(country, duration, 'balanced')
    expect(days).toHaveLength(duration)
    expect(days.map((day) => day.dayNumber)).toEqual(Array.from({ length: duration }, (_, i) => i + 1))
  })

  it.each(DURATIONS)('starts and ends with a flight in the %i-day version', (duration) => {
    const days = buildItinerary(country, duration, 'balanced')
    for (const day of [days[0], days.at(-1)]) {
      expect(day?.transport?.mode).toBe('flight')
      expect(day?.destination).toContain('Madrid')
      expect(day?.base).toBeNull()
    }
  })

  it.each(DURATIONS)('sleeps on the ground every night except the flights in %i days', (duration) => {
    const days = buildItinerary(country, duration, 'balanced')
    expect(days.slice(1, -1).every((day) => day.base !== null)).toBe(true)
  })

  it('warns about the risky pre-departure connection', () => {
    const returnDay = buildItinerary(country, 15, 'balanced').at(-2)
    expect(returnDay?.warning).toMatch(/Conexión ajustada/)
  })

  it('keeps the day before the flight home in the departure hub', () => {
    const hub = country === 'thailand' ? 'Bangkok' : 'Kuala Lumpur'
    expect(buildItinerary(country, 15, 'balanced').at(-2)?.base).toContain(hub)
  })

  it('only references known places, with complete days', () => {
    for (const day of ITINERARY_PLANS[country]) {
      expect(PLACES[day.place], day.id).toBeDefined()
      expect(day.activities.length, day.id).toBeGreaterThan(0)
      expect(day.experiences.length, day.id).toBeGreaterThan(0)
    }
  })

  it('adapts intensity to the travel style without touching flight days', () => {
    const [relaxed, adventurous] = (['relaxed', 'adventurous'] as const).map((style) => buildItinerary(country, 15, style))
    relaxed?.forEach((day, index) => {
      const other = adventurous?.[index]
      if (day.base === null) expect(day.intensity).toBe(other?.intensity)
      else expect(day.intensity).toBeLessThanOrEqual(other?.intensity ?? 0)
    })
  })

  it.each(STYLES)('stays within the 1–5 intensity range when %s', (style) => {
    for (const day of buildItinerary(country, 16, style)) {
      expect(day.intensity).toBeGreaterThanOrEqual(1)
      expect(day.intensity).toBeLessThanOrEqual(5)
    }
  })
})

describe('itinerary content', () => {
  it('keeps the sample Thai and Malaysian day order', () => {
    expect(buildItinerary('thailand', 15, 'balanced')[3]?.title).toContain('Ayutthaya')
    expect(buildItinerary('thailand', 15, 'balanced')[8]?.title).toContain('Phangan')
    expect(buildItinerary('malaysia', 15, 'balanced')[9]?.title).toContain('Perhentian')
  })

  it('offers a real extra day at 16 days', () => {
    const fifteen = new Set(buildItinerary('malaysia', 15, 'balanced').map((day) => day.id))
    const extra = buildItinerary('malaysia', 16, 'balanced').filter((day) => !fifteen.has(day.id))
    expect(extra.map((day) => day.id)).toEqual(['my-penang2'])
  })
})
