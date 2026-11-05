import type { Destination } from '@nsa/shared'

export type Country = Destination

export const COUNTRY_NAMES: Record<Country, string> = {
  thailand: 'Tailandia',
  malaysia: 'Malasia',
}

export const COUNTRIES: Country[] = ['thailand', 'malaysia']
