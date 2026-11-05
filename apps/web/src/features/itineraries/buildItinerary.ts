import { ITINERARY_PLANS, type DayPlan, type TravelStyle, type TripDuration } from '../../data/itineraries'
import type { Country } from '../../data/types'

export interface ItineraryDay extends DayPlan {
  dayNumber: number
  styleNote?: string
}

const STYLE_INTENSITY: Record<TravelStyle, number> = { relaxed: -1, balanced: 0, adventurous: 1 }

const clampIntensity = (value: number) => Math.min(5, Math.max(1, value)) as DayPlan['intensity']

export function buildItinerary(country: Country, duration: TripDuration, style: TravelStyle): ItineraryDay[] {
  return ITINERARY_PLANS[country]
    .filter((day) => {
      if (day.onlyIn16) return duration === 16
      if (day.skipIn14) return duration !== 14
      return true
    })
    .map((day, index) => ({
      ...day,
      dayNumber: index + 1,
      // Flight days are immovable: style only shapes days with discretionary activity.
      intensity: day.base === null ? day.intensity : clampIntensity(day.intensity + STYLE_INTENSITY[style]),
      styleNote: day.styleNotes?.[style],
    }))
}

export const averageIntensity = (days: ItineraryDay[]) =>
  days.reduce((sum, day) => sum + day.intensity, 0) / days.length
