import type { TripDuration } from '../../data/itineraries'
import type { Country } from '../../data/types'
import { buildItinerary } from '../itineraries/buildItinerary'

/** Works on calendar dates only, in UTC, so no time zone can shift a day. */
export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

const compactDate = (date: string) => date.slice(2).replaceAll('-', '')

export function skyscannerUrl(from: string, to: string, departure: string, back?: string) {
  const dates = [compactDate(departure), ...(back ? [compactDate(back)] : [])].join('/')
  return `https://www.skyscanner.es/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${dates}/?adultsv2=1&cabinclass=economy`
}

export function edreamsUrl(from: string, to: string, departure: string, back?: string) {
  const type = back ? 'R' : 'O'
  const ret = back ? `;ret=${back}` : ''
  return `https://www.edreams.es/travel/#results/type=${type};from=${from};to=${to};dep=${departure}${ret};adults=1`
}

export function googleFlightsUrl(from: string, to: string, departure: string, back?: string) {
  const period = back ? `on ${departure} through ${back}` : `on ${departure}`
  const query = new URLSearchParams({ q: `Flights from ${from} to ${to} ${period}`, hl: 'es', curr: 'EUR' })
  return `https://www.google.com/travel/flights?${query}`
}

export function bookingUrl(place: string, checkin: string, checkout: string) {
  const query = new URLSearchParams({
    ss: place, checkin, checkout, group_adults: '2', no_rooms: '1', selected_currency: 'EUR',
  })
  return `https://www.booking.com/searchresults.es.html?${query}`
}

export const twelveGoUrl = (from: string, to: string, date: string) =>
  `https://12go.asia/es/travel/${from}/${to}?date=${date}`

export interface SearchRoute {
  label: string
  from: string
  to: string
  /** Itinerary day of the trip, so the search opens on the right date. */
  day: string
}

export const INTERNATIONAL: Record<Country, { label: string; to: string }> = {
  thailand: { label: 'Madrid ↔ Bangkok', to: 'BKK' },
  malaysia: { label: 'Madrid ↔ Kuala Lumpur', to: 'KUL' },
}

export const DOMESTIC_FLIGHTS: Record<Country, SearchRoute[]> = {
  thailand: [
    { label: 'Bangkok → Chiang Mai', from: 'BKK', to: 'CNX', day: 'th-to-cm' },
    { label: 'Chiang Mai → Koh Samui', from: 'CNX', to: 'USM', day: 'th-to-samui' },
    { label: 'Koh Samui → Bangkok', from: 'USM', to: 'BKK', day: 'th-return' },
  ],
  malaysia: [
    { label: 'Penang → Kota Bharu', from: 'PEN', to: 'KBR', day: 'my-to-kb' },
    { label: 'Kota Bharu → Kuala Lumpur', from: 'KBR', to: 'KUL', day: 'my-return' },
  ],
}

export const FERRIES: Record<Country, SearchRoute[]> = {
  thailand: [
    { label: 'Koh Samui → Koh Phangan', from: 'koh-samui', to: 'koh-phangan', day: 'th-to-phangan' },
    { label: 'Koh Phangan → Koh Tao', from: 'koh-phangan', to: 'koh-tao', day: 'th-to-tao' },
    { label: 'Koh Tao → Koh Samui', from: 'koh-tao', to: 'koh-samui', day: 'th-return' },
  ],
  malaysia: [
    { label: 'Kuala Besut → Perhentian', from: 'kuala-besut', to: 'perhentian-islands', day: 'my-to-perhentian' },
  ],
}

const STAY_PLACES: Record<Country, Array<{ match: string; search: string }>> = {
  thailand: [
    { match: 'Bangkok', search: 'Bangkok' },
    { match: 'Chiang Mai', search: 'Chiang Mai' },
    { match: 'Koh Samui', search: 'Koh Samui' },
    { match: 'Koh Phangan', search: 'Koh Phangan' },
    { match: 'Koh Tao', search: 'Koh Tao' },
  ],
  malaysia: [
    { match: 'Kuala Lumpur', search: 'Kuala Lumpur' },
    { match: 'Tanah Rata', search: 'Tanah Rata, Cameron Highlands' },
    { match: 'George Town', search: 'George Town, Penang' },
    { match: 'Kota Bharu', search: 'Kota Bharu' },
    { match: 'Perhentian', search: 'Perhentian Kecil' },
  ],
}

export interface Stay {
  place: string
  checkin: string
  checkout: string
  nights: number
}

/** Dates come from the itinerary, so hotels always match the selected trip length. */
export function staysFor(country: Country, duration: TripDuration, departure: string): Stay[] {
  const stays: Stay[] = []
  buildItinerary(country, duration, 'balanced').forEach((day, index) => {
    if (day.base === null) return
    const match = STAY_PLACES[country].find((candidate) => day.base?.includes(candidate.match))
    if (!match) throw new Error(`No stay mapping for ${day.id}`)
    const checkout = addDays(departure, index + 1)
    const last = stays.at(-1)
    if (last?.place === match.search) {
      last.checkout = checkout
      last.nights += 1
    } else {
      stays.push({ place: match.search, checkin: addDays(departure, index), checkout, nights: 1 })
    }
  })
  return stays
}

export function dateOfDay(country: Country, duration: TripDuration, dayId: string, departure: string) {
  const index = buildItinerary(country, duration, 'balanced').findIndex((day) => day.id === dayId)
  if (index < 0) throw new Error(`Unknown itinerary day ${dayId}`)
  return addDays(departure, index)
}
