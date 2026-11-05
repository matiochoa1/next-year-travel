import type { BudgetItemView } from '@nsa/shared'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ComfortLevel } from '../data/budget'
import type { TravelStyle, TripDuration } from '../data/itineraries'
import { MAY } from '../data/seasons'
import type { Country } from '../data/types'
import { DEFAULT_WEIGHTS, type Weights } from '../features/preferences/matcher'

interface TripState {
  country: Country
  month: number
  duration: TripDuration
  style: TravelStyle
  routeId: Record<Country, string>
  weights: Weights
  travelers: number
  budgetDays: number
  comfort: ComfortLevel
  sharedRoom: boolean
  /** Editions shared by the group; empty until signed in. */
  budgetItems: BudgetItemView[]
  /** Personal search date for the flight and hotel links. */
  departureDate: string
  setCountry: (country: Country) => void
  setMonth: (month: number) => void
  setDuration: (duration: TripDuration) => void
  setStyle: (style: TravelStyle) => void
  setRoute: (country: Country, routeId: string) => void
  setWeight: (key: keyof Weights, value: number) => void
  setBudget: (patch: Partial<Pick<TripState, 'travelers' | 'budgetDays' | 'comfort' | 'sharedRoom'>>) => void
  setBudgetItems: (items: BudgetItemView[]) => void
  setDepartureDate: (date: string) => void
}

export const DEFAULT_ROUTES: Record<Country, string> = { thailand: 'th-gulf', malaysia: 'my-east' }

export const useTrip = create<TripState>()(
  persist(
    (set) => ({
      country: 'thailand',
      month: MAY,
      duration: 15,
      style: 'balanced',
      routeId: DEFAULT_ROUTES,
      weights: DEFAULT_WEIGHTS,
      travelers: 8,
      budgetDays: 15,
      comfort: 'mid',
      sharedRoom: true,
      budgetItems: [],
      departureDate: '2027-05-08',
      setCountry: (country) => set({ country }),
      setMonth: (month) => set({ month }),
      setDuration: (duration) => set({ duration }),
      setStyle: (style) => set({ style }),
      setRoute: (country, routeId) => set((state) => ({ routeId: { ...state.routeId, [country]: routeId } })),
      setWeight: (key, value) => set((state) => ({ weights: { ...state.weights, [key]: value } })),
      setBudget: (patch) => set(patch),
      setBudgetItems: (budgetItems) => set({ budgetItems }),
      setDepartureDate: (departureDate) => set({ departureDate }),
    }),
    {
      name: 'nsa-preferences',
      version: 2,
      // Only personal preferences persist: the trip month always reopens on the planned May.
      partialize: ({ weights, travelers, budgetDays, comfort, sharedRoom, departureDate }) => ({
        weights, travelers, budgetDays, comfort, sharedRoom, departureDate,
      }),
    },
  ),
)
