import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSUMPTIONS } from '../../data/budget'
import { calculateBudget, formatEuros, formatRange, mealDaysFor, nightsFor, roundToTen } from './calculateBudget'

const defaults = { travelers: 1, days: 15, comfort: 'mid', sharedRoom: true } as const

describe('calculateBudget', () => {
  it('reproduces the stated illustrative ranges at default settings', () => {
    expect(calculateBudget(DEFAULT_ASSUMPTIONS.thailand, defaults).perPerson).toEqual({ low: 1520, high: 2610 })
    expect(calculateBudget(DEFAULT_ASSUMPTIONS.malaysia, defaults).perPerson).toEqual({ low: 1320, high: 2440 })
  })

  it('accounts for the two flight days', () => {
    expect(nightsFor(15)).toBe(13)
    expect(mealDaysFor(15)).toBe(14)
  })

  it('multiplies the group total by travelers', () => {
    const one = calculateBudget(DEFAULT_ASSUMPTIONS.thailand, defaults)
    const eight = calculateBudget(DEFAULT_ASSUMPTIONS.thailand, { ...defaults, travelers: 8 })
    expect(eight.perPerson).toEqual(one.perPerson)
    expect(eight.group).toEqual({ low: one.perPerson.low * 8, high: one.perPerson.high * 8 })
  })

  it('scales lodging and food with duration but not flights', () => {
    const short = calculateBudget(DEFAULT_ASSUMPTIONS.malaysia, { ...defaults, days: 14 })
    const long = calculateBudget(DEFAULT_ASSUMPTIONS.malaysia, { ...defaults, days: 16 })
    expect(long.categories.lodging.low - short.categories.lodging.low).toBe(2 * DEFAULT_ASSUMPTIONS.malaysia.lodging.low)
    expect(long.categories.food.high - short.categories.food.high).toBe(2 * DEFAULT_ASSUMPTIONS.malaysia.food.high)
    expect(long.categories.flights).toEqual(short.categories.flights)
  })

  it('raises costs with comfort and with single rooms', () => {
    const mid = calculateBudget(DEFAULT_ASSUMPTIONS.thailand, defaults)
    const comfort = calculateBudget(DEFAULT_ASSUMPTIONS.thailand, { ...defaults, comfort: 'comfort' })
    const saver = calculateBudget(DEFAULT_ASSUMPTIONS.thailand, { ...defaults, comfort: 'saver' })
    const single = calculateBudget(DEFAULT_ASSUMPTIONS.thailand, { ...defaults, sharedRoom: false })
    expect(comfort.perPerson.low).toBeGreaterThan(mid.perPerson.low)
    expect(saver.perPerson.high).toBeLessThan(mid.perPerson.high)
    expect(single.categories.lodging.low).toBeGreaterThan(mid.categories.lodging.low)
    expect(comfort.categories.flights).toEqual(mid.categories.flights)
  })

  it('reflects edited assumptions', () => {
    const edited = {
      ...DEFAULT_ASSUMPTIONS.thailand,
      flights: { low: 800, high: 800 },
    }
    expect(calculateBudget(edited, defaults).perPerson.low).toBe(1700)
  })
})

describe('formatting', () => {
  it('avoids false precision', () => {
    expect(roundToTen(1523)).toBe(1520)
    expect(formatEuros(1523)).toMatch(/^1\.520\s€$/)
  })
  it('formats ranges in euros', () => {
    expect(formatRange({ low: 1520, high: 2610 })).toMatch(/1\.520\s€ – 2\.610\s€/)
  })
})
