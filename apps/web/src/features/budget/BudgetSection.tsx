import { Users } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { BUDGET_CATEGORIES, CATEGORY_LABELS, COMFORT_LABELS, DEFAULT_ASSUMPTIONS, type ComfortLevel } from '../../data/budget'
import { COUNTRIES, COUNTRY_NAMES, type Country } from '../../data/types'
import { useTrip } from '../../store/tripStore'
import { useSession } from '../voting/session'
import { BudgetItem } from './BudgetItem'
import { calculateBudget, formatEuros, formatRange, mergeAssumptions, nightsFor, type BudgetResult } from './calculateBudget'
import { PriceSearch } from './PriceSearch'
import { useGroupBudget } from './useGroupBudget'

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
  const { budgetItems, travelers, budgetDays, comfort, sharedRoom, setBudget } = useTrip()
  const { client, me, loading } = useSession()
  const sectionRef = useRef<HTMLElement>(null)
  const reload = useGroupBudget(sectionRef)
  const inputs = useMemo(() => ({ travelers, days: budgetDays, comfort, sharedRoom }), [travelers, budgetDays, comfort, sharedRoom])
  const assumptions = useMemo(
    () => ({
      thailand: mergeAssumptions(DEFAULT_ASSUMPTIONS.thailand, budgetItems, 'thailand'),
      malaysia: mergeAssumptions(DEFAULT_ASSUMPTIONS.malaysia, budgetItems, 'malaysia'),
    }),
    [budgetItems],
  )
  const results = useMemo(
    () => ({
      thailand: calculateBudget(assumptions.thailand, inputs),
      malaysia: calculateBudget(assumptions.malaysia, inputs),
    }),
    [assumptions, inputs],
  )
  const realCount = budgetItems.length
  const lowDiff = results.thailand.perPerson.low - results.malaysia.perPerson.low
  const highDiff = results.thailand.perPerson.high - results.malaysia.perPerson.high
  const midDiff = (lowDiff + highDiff) / 2
  const cheaper = midDiff >= 0 ? 'Malasia' : 'Tailandia'
  const maxHigh = Math.max(...COUNTRIES.flatMap((c) => BUDGET_CATEGORIES.map((k) => results[c].categories[k].high)))

  return (
    <section id="presupuesto" ref={sectionRef} className="bg-sand-100 px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Presupuesto" title="¿Cuánto nos va a costar?">
          <p>Empezamos con estimaciones orientativas y entre todos las sustituimos por precios reales. Cada cambio se guarda para todo el grupo, con el nombre de quien lo hizo.</p>
        </SectionHeading>

        <p data-testid="budget-status" className="mt-6 flex items-center gap-2 text-sm font-medium">
          <Users aria-hidden className="size-4" />
          {me
            ? realCount === 0
              ? 'Todavía nadie ha añadido precios reales. ¡Empieza tú!'
              : `${realCount} ${realCount === 1 ? 'precio actualizado' : 'precios actualizados'} por el grupo.`
            : !loading && <a href="#votacion" className="link-underline">Entra con Google para ver y editar los precios del grupo</a>}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
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

        <p className="mt-2 text-xs text-muted">Viajeros, días y comodidad solo cambian tu cálculo. Los precios de abajo son los del grupo.</p>

        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          {COUNTRIES.map((country) => <Total key={country} country={country} result={results[country]} travelers={travelers} />)}
        </div>

        <p data-testid="budget-diff" className="mt-4 font-display text-xl">
          {Math.abs(midDiff) < 5
            ? 'Con estos supuestos, salen prácticamente igual.'
            : `${cheaper} sale unos ${formatEuros(Math.abs(midDiff))} más barata por persona, en el punto medio de cada rango.`}
        </p>

        <PriceSearch />

        <div className="mt-14">
          <h3 className="text-3xl">Precios del grupo</h3>
          <p className="mt-1 text-sm text-muted">
            Por persona, para {nightsFor(budgetDays)} noches de hotel. Pon un rango si dudas, o el mismo valor en mínimo y máximo si ya tienes el precio exacto.
          </p>
          <ul className="mt-5 space-y-5">
            {BUDGET_CATEGORIES.map((category) => (
              <li key={category} className="border-t border-sand-400 pt-3">
                <h4 className="font-sans text-sm font-semibold tracking-normal">{CATEGORY_LABELS[category]}</h4>
                <div className="mt-2 grid gap-6 md:grid-cols-2">
                  {COUNTRIES.map((country) => (
                    <BudgetItem
                      key={country}
                      client={client}
                      country={country}
                      category={category}
                      base={assumptions[country][category]}
                      total={results[country].categories[category]}
                      maxHigh={maxHigh}
                      item={budgetItems.find((item) => item.country === country && item.category === category)}
                      canEdit={me !== null}
                      onChanged={reload}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
