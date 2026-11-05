import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_ASSUMPTIONS, type BudgetAssumptions, type ComfortLevel } from '../data/budget'
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
  assumptions: Record<Country, BudgetAssumptions>
  setCountry: (country: Country) => void
  setMonth: (month: number) => void
  setDuration: (duration: TripDuration) => void
  setStyle: (style: TravelStyle) => void
  setRoute: (country: Country, routeId: string) => void
  setWeight: (key: keyof Weights, value: number) => void
  setBudget: (patch: Partial<Pick<TripState, 'travelers' | 'budgetDays' | 'comfort' | 'sharedRoom'>>) => void
  setAssumption: (country: Country, category: keyof BudgetAssumptions, bound: 'low' | 'high', value: number) => void
  resetAssumptions: () => void
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
      assumptions: DEFAULT_ASSUMPTIONS,
      setCountry: (country) => set({ country }),
      setMonth: (month) => set({ month }),
      setDuration: (duration) => set({ duration }),
      setStyle: (style) => set({ style }),
      setRoute: (country, routeId) => set((state) => ({ routeId: { ...state.routeId, [country]: routeId } })),
      setWeight: (key, value) => set((state) => ({ weights: { ...state.weights, [key]: value } })),
      setBudget: (patch) => set(patch),
      setAssumption: (country, category, bound, value) =>
        set((state) => {
          const current = state.assumptions[country]
          return {
            assumptions: {
              ...state.assumptions,
              [country]: { ...current, [category]: { ...current[category], [bound]: value } },
            },
          }
        }),
      resetAssumptions: () => set({ assumptions: DEFAULT_ASSUMPTIONS }),
    }),
    {
      name: 'nsa-preferences',
      version: 1,
      // Only personal preferences persist: the trip month always reopens on the planned May.
      partialize: ({ weights, travelers, budgetDays, comfort, sharedRoom, assumptions }) => ({
        weights, travelers, budgetDays, comfort, sharedRoom, assumptions,
      }),
    },
  ),
)
