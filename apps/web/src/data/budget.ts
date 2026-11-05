import type { BudgetCategory } from '@nsa/shared'
import type { Country } from './types'

export { BUDGET_CATEGORIES } from '@nsa/shared'
export type { BudgetCategory }

export type ComfortLevel = 'saver' | 'mid' | 'comfort'

export interface Range {
  low: number
  high: number
}

/** `perNight` / `perDay` amounts scale with duration; the rest are per trip. */
export type BudgetAssumptions = Record<BudgetCategory, Range>

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  flights: 'Vuelos internacionales',
  domestic: 'Vuelos internos',
  ferries: 'Ferris y traslados',
  lodging: 'Alojamiento (por noche)',
  food: 'Comida (por día)',
  tours: 'Excursiones y actividades',
  insurance: 'Seguro de viaje',
  contingency: 'Imprevistos',
}

export const CATEGORY_UNITS: Record<BudgetCategory, string> = {
  flights: '€ por persona, ida y vuelta',
  domestic: '€ por persona, todo el viaje',
  ferries: '€ por persona, todo el viaje',
  lodging: '€ por persona y noche',
  food: '€ por persona y día',
  tours: '€ por persona, todo el viaje',
  insurance: '€ por persona',
  contingency: '€ por persona',
}

export const COMFORT_LABELS: Record<ComfortLevel, string> = {
  saver: 'Ahorro',
  mid: 'Gama media',
  comfort: 'Confort',
}

export const COMFORT_FACTORS: Record<ComfortLevel, number> = { saver: 0.75, mid: 1, comfort: 1.5 }

/** Illustrative planning figures per person, for two people sharing a room. Not live quotes. */
export const DEFAULT_ASSUMPTIONS: Record<Country, BudgetAssumptions> = {
  thailand: {
    flights: { low: 620, high: 1000 },
    domestic: { low: 110, high: 190 },
    ferries: { low: 70, high: 120 },
    lodging: { low: 22, high: 38 },
    food: { low: 16, high: 27 },
    tours: { low: 120, high: 240 },
    insurance: { low: 40, high: 60 },
    contingency: { low: 50, high: 128 },
  },
  malaysia: {
    flights: { low: 600, high: 1000 },
    domestic: { low: 60, high: 150 },
    ferries: { low: 60, high: 110 },
    lodging: { low: 20, high: 36 },
    food: { low: 13, high: 22 },
    tours: { low: 90, high: 220 },
    insurance: { low: 40, high: 60 },
    contingency: { low: 28, high: 124 },
  },
}
