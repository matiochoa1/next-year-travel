import { COUNTRIES, COUNTRY_NAMES, type Country } from '../../data/types'

interface CountrySwitchProps {
  value: Country
  onChange: (country: Country) => void
  label: string
  tone?: 'light' | 'dark'
}

/** Sliding thumb is pure CSS so it does not need Motion's heavier layout feature bundle. */
export function CountrySwitch({ value, onChange, label, tone = 'light' }: CountrySwitchProps) {
  const dark = tone === 'dark'
  return (
    <div role="group" aria-label={label} className={`relative inline-grid grid-cols-2 p-1 ${dark ? 'bg-ocean-800' : 'bg-sand-100'}`}>
      <span
        aria-hidden
        className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] transition-transform duration-500 ease-editorial ${dark ? 'bg-ivory' : 'bg-ocean-900'}`}
        style={{ transform: value === 'malaysia' ? 'translateX(100%)' : 'none' }}
      />
      {COUNTRIES.map((country) => {
        const active = country === value
        return (
          <button
            key={country}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(country)}
            className={`relative min-h-11 px-7 text-sm font-semibold transition-colors duration-300 ${
              active ? (dark ? 'text-ocean-950' : 'text-ivory') : dark ? 'text-ivory/80' : 'text-ocean-900'
            }`}
          >
            {COUNTRY_NAMES[country]}
          </button>
        )
      })}
    </div>
  )
}
