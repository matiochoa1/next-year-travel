import { CloudSun } from 'lucide-react'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { MAY, MONTHS, RATING_LABELS, type Rating } from '../../data/seasons'
import { COUNTRIES, COUNTRY_NAMES } from '../../data/types'
import { useTrip } from '../../store/tripStore'
import { ratingFor, regionsFor, seasonalAdvice } from './seasonality'

const RATING_STYLES: Record<Rating, string> = {
  1: 'bg-coral text-ivory',
  2: 'bg-[#dfa98c] text-ink',
  3: 'bg-sand-200 text-ink',
  4: 'bg-aqua-300 text-ink',
  5: 'bg-emerald-700 text-ivory',
}

const KNOWLEDGE = [
  { title: 'Patrones históricos', text: 'Lo que suele ocurrir según el clima de otros años. Es la base de esta sección.' },
  { title: 'Recomendación de temporada', text: 'Nuestra lectura de esos patrones para decidir ruta. Es una valoración, no un dato.' },
  { title: 'Previsión real', text: 'No disponible: no hay integración meteorológica y nadie puede predecir mayo de 2027. Mirad el pronóstico unos días antes de salir.' },
]

export function WeatherSection() {
  const month = useTrip((state) => state.month)
  const setMonth = useTrip((state) => state.setMonth)

  return (
    <section id="clima" className="bg-ivory px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Clima y temporada" title="El mes lo cambia todo">
          <p>Viajamos en mayo, justo cuando las costas de cada país se comportan al revés. Elige un mes para ver cómo cambian las rutas.</p>
        </SectionHeading>

        <div role="group" aria-label="Elegir mes" className="mt-10 grid grid-cols-4 gap-1 sm:grid-cols-6 lg:grid-cols-12">
          {MONTHS.map((name, index) => (
            <button
              key={name}
              type="button"
              aria-pressed={index === month}
              onClick={() => setMonth(index)}
              className={`min-h-11 px-1 text-sm transition-colors ${
                index === month ? 'bg-ocean-900 font-semibold text-ivory' : 'bg-sand-100 hover:bg-sand-200'
              }`}
            >
              {name.slice(0, 3)}
              {index === MAY && <span aria-label=" (nuestro viaje)" className={index === month ? 'text-gold-500' : 'text-gold-700'}> ✦</span>}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">✦ Mes previsto para el viaje</p>

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          {COUNTRIES.map((country) => {
            const advice = seasonalAdvice(country, month)
            return (
              <div key={country}>
                <h3 className="text-3xl">{COUNTRY_NAMES[country]}</h3>
                <p data-testid={`advice-${country}`} className={`mt-2 border-l-2 pl-3 ${
                  advice.tone === 'good' ? 'border-emerald-500' : advice.tone === 'mixed' ? 'border-gold-500' : 'border-coral'
                }`}>
                  {advice.message}
                </p>
                <ul className="mt-5 space-y-4">
                  {regionsFor(country).map((region) => {
                    const rating = ratingFor(region, month)
                    return (
                      <li key={region.id} data-testid={`region-${region.id}`}>
                        <div className="flex items-baseline justify-between gap-3">
                          <div>
                            <span className="font-semibold">{region.name}</span>
                            <span className="ml-2 hidden text-sm text-muted sm:inline">{region.scope}</span>
                          </div>
                          <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold ${RATING_STYLES[rating]}`}>{RATING_LABELS[rating]}</span>
                        </div>
                        <div aria-hidden className="mt-1 grid grid-cols-12 gap-px">
                          {region.ratings.map((value, index) => (
                            <span key={index} className={`h-2 ${RATING_STYLES[value].split(' ')[0]} ${index === month ? 'outline-2 outline-offset-1 outline-ocean-950' : ''}`} />
                          ))}
                        </div>
                        <p className="mt-1 text-sm text-muted">{month === MAY ? region.mayNote : region.pattern}</p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="mt-14 grid gap-6 bg-sand-100 p-6 md:grid-cols-3 md:p-8">
          {KNOWLEDGE.map(({ title, text }) => (
            <div key={title}>
              <h3 className="flex items-center gap-2 font-sans text-base font-semibold tracking-normal"><CloudSun aria-hidden className="size-4 text-emerald-700" /> {title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
