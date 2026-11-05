import { Plus } from 'lucide-react'
import { useState } from 'react'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { COMPARISON, type ComparisonCategory } from '../../data/comparison'
import { MONTHS } from '../../data/seasons'
import { COUNTRIES, COUNTRY_NAMES, type Country } from '../../data/types'
import { useTrip } from '../../store/tripStore'
import { countrySuitability } from '../weather/seasonality'
import { PreferenceMatcher } from '../preferences/PreferenceMatcher'

const fmt = (value: number) => value.toFixed(1).replace('.', ',').replace(',0', '')

function Row({ category, month }: { category: ComparisonCategory; month: number }) {
  const [open, setOpen] = useState(false)
  const scoreOf = (country: Country) => category.scores?.[country] ?? countrySuitability(country, month)
  const th = scoreOf('thailand')
  const my = scoreOf('malaysia')
  const label = category.scores ? category.label : `Encaje con ${MONTHS[month]?.toLowerCase()}`

  return (
    <li data-testid="comparison-row" className="border-b border-ivory/15">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="grid w-full grid-cols-[2.5rem_1fr_2.5rem] items-center gap-x-3 gap-y-1 py-3 text-left md:grid-cols-[3rem_1fr_13rem_1fr_3rem]"
      >
        <span className={`font-display text-xl ${th > my ? 'text-aqua-300' : ''}`}><span className="sr-only">Tailandia </span>{fmt(th)}</span>
        <span aria-hidden className="col-span-1 flex h-2 justify-end bg-ivory/10 md:col-start-2">
          <span className="bg-aqua-300 transition-[width] duration-700" style={{ width: `${th * 10}%` }} />
        </span>
        <span className={`order-last col-span-3 flex items-center justify-center gap-1 text-center text-sm md:order-none md:col-span-1`}>
          {label} <Plus aria-hidden className={`size-3.5 transition-transform ${open ? 'rotate-45' : ''}`} />
        </span>
        <span aria-hidden className="col-start-2 row-start-2 flex h-2 bg-ivory/10 md:col-start-4 md:row-start-1">
          <span className="bg-gold-500 transition-[width] duration-700" style={{ width: `${my * 10}%` }} />
        </span>
        <span className={`col-start-3 row-start-2 text-right font-display text-xl md:col-start-5 md:row-start-1 ${my > th ? 'text-gold-500' : ''}`}><span className="sr-only">Malasia </span>{fmt(my)}</span>
      </button>
      {open && (
        <div className="grid gap-4 pb-5 text-sm md:grid-cols-2">
          <p className="md:col-span-2"><strong>{category.winnerNote}</strong></p>
          {COUNTRIES.map((country) => (
            <p key={country} className="text-ivory/80"><strong className="text-ivory">{COUNTRY_NAMES[country]}.</strong> {category.detail[country]}</p>
          ))}
        </div>
      )}
    </li>
  )
}

export function ComparisonSection() {
  const month = useTrip((state) => state.month)
  return (
    <section id="comparativa" className="bg-ocean-900 px-5 py-24 text-ivory md:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Comparativa" title="Cara a cara, categoría por categoría" tone="dark">
          <p>Puntuaciones editoriales del 0 al 10, escritas por nosotros y por tanto subjetivas. Abre cada fila para leer el porqué.</p>
        </SectionHeading>

        <div className="mt-10 flex justify-between font-display text-2xl">
          <span className="text-aqua-300">Tailandia</span>
          <span className="text-gold-500">Malasia</span>
        </div>
        <ul className="mt-3 border-t border-ivory/15">
          {COMPARISON.map((category) => <Row key={category.id} category={category} month={month} />)}
        </ul>

        <PreferenceMatcher />
      </div>
    </section>
  )
}
