import { describe, expect, it } from 'vitest'
import { DURATIONS } from '../../data/itineraries'
import { COUNTRIES } from '../../data/types'
import {
  addDays,
  bookingUrl,
  dateOfDay,
  DOMESTIC_FLIGHTS,
  edreamsUrl,
  FERRIES,
  googleFlightsUrl,
  skyscannerUrl,
  staysFor,
  twelveGoUrl,
} from './searchLinks'

const DEPARTURE = '2027-05-08'

describe('addDays', () => {
  it('crosses month ends', () => {
    expect(addDays('2027-05-30', 3)).toBe('2027-06-02')
  })
})

describe('search urls', () => {
  it('builds round trips', () => {
    expect(skyscannerUrl('MAD', 'BKK', '2027-05-08', '2027-05-22')).toContain('/flights/mad/bkk/270508/270522/')
    expect(edreamsUrl('MAD', 'BKK', '2027-05-08', '2027-05-22')).toContain('type=R;from=MAD;to=BKK;dep=2027-05-08;ret=2027-05-22')
    expect(decodeURIComponent(googleFlightsUrl('MAD', 'KUL', '2027-05-08', '2027-05-22')).replaceAll('+', ' ')).toContain(
      'Flights from MAD to KUL on 2027-05-08 through 2027-05-22',
    )
  })

  it('builds one-way trips', () => {
    expect(skyscannerUrl('BKK', 'CNX', '2027-05-12')).toContain('/bkk/cnx/270512/?')
    expect(edreamsUrl('BKK', 'CNX', '2027-05-12')).toContain('type=O;')
    expect(edreamsUrl('BKK', 'CNX', '2027-05-12')).not.toContain('ret=')
  })

  it('encodes place names and dates for Booking', () => {
    const url = new URL(bookingUrl('George Town, Penang', '2027-05-14', '2027-05-16'))
    expect(url.searchParams.get('ss')).toBe('George Town, Penang')
    expect(url.searchParams.get('checkin')).toBe('2027-05-14')
    expect(url.searchParams.get('group_adults')).toBe('2')
  })

  it('points ferries at 12Go with the date', () => {
    expect(twelveGoUrl('koh-samui', 'koh-phangan', '2027-05-16')).toBe('https://12go.asia/es/travel/koh-samui/koh-phangan?date=2027-05-16')
  })
})

describe.each(COUNTRIES)('%s trip dates', (country) => {
  it.each(DURATIONS)('covers every night of a %i-day trip without gaps', (duration) => {
    const stays = staysFor(country, duration, DEPARTURE)
    expect(stays.reduce((sum, stay) => sum + stay.nights, 0)).toBe(duration - 2)
    expect(stays[0]?.checkin).toBe(addDays(DEPARTURE, 1))
    expect(stays.at(-1)?.checkout).toBe(addDays(DEPARTURE, duration - 1))
    stays.slice(1).forEach((stay, index) => expect(stay.checkin).toBe(stays[index]?.checkout))
  })

  it.each(DURATIONS)('finds every transport day in %i days', (duration) => {
    for (const route of [...DOMESTIC_FLIGHTS[country], ...FERRIES[country]]) {
      expect(dateOfDay(country, duration, route.day, DEPARTURE) > DEPARTURE).toBe(true)
    }
  })
})
