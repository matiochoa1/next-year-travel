import {
  BUDGET_CATEGORIES,
  COMFORT_FACTORS,
  type BudgetAssumptions,
  type BudgetCategory,
  type ComfortLevel,
  type Range,
} from '../../data/budget'

export interface BudgetInputs {
  travelers: number
  days: number
  comfort: ComfortLevel
  sharedRoom: boolean
}

export interface BudgetResult {
  categories: Record<BudgetCategory, Range>
  perPerson: Range
  group: Range
}

/** A single room costs well under double, since the price is per room and two people share it. */
const SOLO_ROOM_FACTOR = 1.7

const scale = (range: Range, factor: number): Range => ({ low: range.low * factor, high: range.high * factor })

/** Day 1 and the last day are spent flying, so 15 days means 13 hotel nights and 14 days of meals. */
export const nightsFor = (days: number) => Math.max(0, days - 2)
export const mealDaysFor = (days: number) => Math.max(0, days - 1)

export function calculateBudget(assumptions: BudgetAssumptions, inputs: BudgetInputs): BudgetResult {
  const comfort = COMFORT_FACTORS[inputs.comfort]
  const room = inputs.sharedRoom ? 1 : SOLO_ROOM_FACTOR
  const factors: Record<BudgetCategory, number> = {
    flights: 1,
    domestic: 1,
    ferries: 1,
    lodging: nightsFor(inputs.days) * comfort * room,
    food: mealDaysFor(inputs.days) * comfort,
    tours: comfort,
    insurance: 1,
    contingency: comfort,
  }

  const categories = {} as Record<BudgetCategory, Range>
  const perPerson: Range = { low: 0, high: 0 }
  for (const category of BUDGET_CATEGORIES) {
    const value = scale(assumptions[category], factors[category])
    categories[category] = value
    perPerson.low += value.low
    perPerson.high += value.high
  }

  return { categories, perPerson, group: scale(perPerson, inputs.travelers) }
}

/** Figures are rough planning estimates, so they are displayed to the nearest ten euros. */
export const roundToTen = (value: number) => Math.round(value / 10) * 10

const euroFormat = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  useGrouping: 'always',
})

export const formatEuros = (value: number) => euroFormat.format(roundToTen(value))

export const formatRange = ({ low, high }: Range) => `${formatEuros(low)} – ${formatEuros(high)}`
