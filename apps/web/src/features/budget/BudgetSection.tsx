import { RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { BUDGET_CATEGORIES, CATEGORY_LABELS, COMFORT_LABELS, type ComfortLevel } from '../../data/budget'
import { COUNTRIES, COUNTRY_NAMES, type Country } from '../../data/types'
import { useTrip } from '../../store/tripStore'
import { calculateBudget, formatEuros, formatRange, nightsFor, type BudgetResult } from './calculateBudget'

function NumberField({ label, value, onChange, min = 0, max }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return (
    <label className="block min-w-0">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (Number.isFinite(parsed) && parsed >= min) onChange(parsed)
        }}
        className="min-h-10 w-full border border-sand-400 bg-ivory px-1.5 text-right tabular-nums"
      />
    </label>
  )
}

const Total = ({ country, result, travelers }: { country: Country; result: BudgetResult; travelers: number }) => (
  <div className="flex-1 bg-ocean-900 p-6 text-ivory">
    <p className="font-display text-2xl">{COUNTRY_NAMES[country]}</p>
    <p data-testid={`total-${country}`} className="mt-2 font-display text-3xl text-gold-500 tabular-nums md:text-4xl">
      {formatRange(result.perPerson)}
    </p>
    <p className="text-sm text-ivory/75">por persona</p>
    <p data-testid={`group-${country}`} className="mt-3 tabular-nums">{formatRange(result.group)}</p>
    <p className="text-sm text-ivory/75">para {travelers} {travelers === 1 ? 'persona' : 'personas'}</p>
  </div>
)

export function BudgetSection() {
  const { assumptions, travelers, budgetDays, comfort, sharedRoom, setBudget, setAssumption, resetAssumptions } = useTrip()
  const inputs = useMemo(() => ({ travelers, days: budgetDays, comfort, sharedRoom }), [travelers, budgetDays, comfort, sharedRoom])
  const results = useMemo(
    () => ({
      thailand: calculateBudget(assumptions.thailand, inputs),
      malaysia: calculateBudget(assumptions.malaysia, inputs),
    }),
    [assumptions, inputs],
  )
  const lowDiff = results.thailand.perPerson.low - results.malaysia.perPerson.low
  const highDiff = results.thailand.perPerson.high - results.malaysia.perPerson.high
  const midDiff = (lowDiff + highDiff) / 2
  const cheaper = midDiff >= 0 ? 'Malasia' : 'Tailandia'
  const maxHigh = Math.max(...COUNTRIES.flatMap((c) => BUDGET_CATEGORIES.map((k) => results[c].categories[k].high)))

  return (
    <section id="presupuesto" className="bg-sand-100 px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Presupuesto" title="¿Cuánto nos va a costar?">
          <p>Estimaciones orientativas y editables para planificar, no presupuestos reales: aquí no se consultan precios de vuelos ni de hoteles en directo.</p>
        </SectionHeading>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <label className="text-sm font-medium">
            Viajeros
            <input
              type="number" min={1} max={30} value={travelers}
              onChange={(event) => setBudget({ travelers: Math.min(30, Math.max(1, Number(event.target.value) || 1)) })}
              className="mt-1 min-h-11 w-full border border-sand-400 bg-ivory px-3"
            />
          </label>
          <label className="text-sm font-medium">
            Días de viaje
            <select
              value={budgetDays}
              onChange={(event) => setBudget({ budgetDays: Number(event.target.value) })}
              className="mt-1 min-h-11 w-full border border-sand-400 bg-ivory px-2"
            >
              {[14, 15, 16].map((days) => <option key={days} value={days}>{days} días</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Nivel de comodidad
            <select
              value={comfort}
              onChange={(event) => setBudget({ comfort: event.target.value as ComfortLevel })}
              className="mt-1 min-h-11 w-full border border-sand-400 bg-ivory px-2"
            >
              {(Object.keys(COMFORT_LABELS) as ComfortLevel[]).map((level) => <option key={level} value={level}>{COMFORT_LABELS[level]}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Alojamiento
            <select
              value={sharedRoom ? 'shared' : 'single'}
              onChange={(event) => setBudget({ sharedRoom: event.target.value === 'shared' })}
              className="mt-1 min-h-11 w-full border border-sand-400 bg-ivory px-2"
            >
              <option value="shared">Habitación compartida</option>
              <option value="single">Habitación individual</option>
            </select>
          </label>
        </div>

        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          {COUNTRIES.map((country) => <Total key={country} country={country} result={results[country]} travelers={travelers} />)}
        </div>

        <p data-testid="budget-diff" className="mt-4 font-display text-xl">
          {Math.abs(midDiff) < 5
            ? 'Con estos supuestos, salen prácticamente igual.'
            : `${cheaper} sale unos ${formatEuros(Math.abs(midDiff))} más barata por persona, en el punto medio de cada rango.`}
        </p>

        <div className="mt-10 overflow-hidden">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-2xl">Desglose y supuestos</h3>
              <p className="text-sm text-muted">
                Importes por persona, mínimo y máximo. Se basan en {nightsFor(budgetDays)} noches de hotel y gama media; edítalos si tenéis mejores datos.
              </p>
            </div>
            <button type="button" onClick={resetAssumptions} className="flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium">
              <RotateCcw aria-hidden className="size-4" /> Restablecer
            </button>
          </div>

          <ul className="mt-5 space-y-5">
            {BUDGET_CATEGORIES.map((category) => (
              <li key={category} className="border-t border-sand-400 pt-3">
                <h4 className="font-sans text-sm font-semibold tracking-normal">{CATEGORY_LABELS[category]}</h4>
                <div className="mt-2 grid gap-4 md:grid-cols-2">
                  {COUNTRIES.map((country) => {
                    const range = results[country].categories[category]
                    const assumption = assumptions[country][category]
                    const label = `${CATEGORY_LABELS[category]}, ${COUNTRY_NAMES[country]}`
                    return (
                      <div key={country} className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2">
                        <div className="min-w-0">
                          <p className="flex justify-between gap-2 text-xs">
                            <span className="text-muted">{COUNTRY_NAMES[country]}</span>
                            <span className="truncate tabular-nums">{formatRange(range)}</span>
                          </p>
                          <div className="relative mt-1 h-1.5 bg-sand-200">
                            <span
                              className={`absolute inset-y-0 ${country === 'thailand' ? 'bg-aqua-600' : 'bg-gold-700'}`}
                              style={{ left: `${(range.low / maxHigh) * 100}%`, width: `${((range.high - range.low) / maxHigh) * 100}%` }}
                            />
                          </div>
                        </div>
                        <NumberField label={`${label}, mínimo`} value={assumption.low} onChange={(value) => setAssumption(country, category, 'low', value)} />
                        <NumberField label={`${label}, máximo`} value={assumption.high} onChange={(value) => setAssumption(country, category, 'high', value)} />
                      </div>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
