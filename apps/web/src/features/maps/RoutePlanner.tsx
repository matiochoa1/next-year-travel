import { AlertTriangle, MapPinned } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { CountrySwitch } from '../../components/ui/CountrySwitch'
import { Photo } from '../../components/ui/Photo'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { DURATIONS, STYLE_LABELS, type TravelStyle } from '../../data/itineraries'
import { MODE_LABELS, PLACES, routesFor, ROUTES, type TransportMode } from '../../data/routes'
import { MONTHS } from '../../data/seasons'
import { DEFAULT_ROUTES, useTrip } from '../../store/tripStore'
import { averageIntensity, buildItinerary, type ItineraryDay } from '../itineraries/buildItinerary'
import { DayList } from '../itineraries/DayList'
import { routeSuitability, seasonalAdvice } from '../weather/seasonality'

const TripMap = lazy(() => import('./TripMap'))

const LEGEND: Array<{ mode: TransportMode; style: string }> = [
  { mode: 'flight', style: 'border-t-2 border-dashed border-gold-700' },
  { mode: 'ferry', style: 'border-t-[3px] border-dashed border-aqua-600' },
  { mode: 'boat', style: 'border-t-2 border-dotted border-aqua-600' },
  { mode: 'road', style: 'border-t-2 border-ocean-900' },
  { mode: 'rail', style: 'border-t-2 border-emerald-700' },
]

function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '500px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return { ref, near }
}

const Segment = <T extends string | number>({ label, options, value, onChange, render }: {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  render: (option: T) => string
}) => (
  <div role="group" aria-label={label} className="flex">
    {options.map((option) => (
      <button
        key={option}
        type="button"
        aria-pressed={option === value}
        onClick={() => onChange(option)}
        className={`min-h-11 flex-1 border border-ocean-900 px-3 text-sm font-medium transition-colors not-first:-ml-px sm:px-4 ${
          option === value ? 'bg-ocean-900 text-ivory' : 'hover:bg-sand-100'
        }`}
      >
        {render(option)}
      </button>
    ))}
  </div>
)

export function RoutePlanner() {
  const { country, setCountry, month, duration, setDuration, style, setStyle, routeId, setRoute } = useTrip()
  const route = ROUTES.find((candidate) => candidate.id === routeId[country]) ?? (routesFor(country)[0] as (typeof ROUTES)[number])
  const days = useMemo(() => buildItinerary(country, duration, style), [country, duration, style])
  const [activePlace, setActivePlace] = useState<string | null>(null)
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [mapFailed, setMapFailed] = useState(false)
  const { ref: mapSlot, near } = useNearViewport<HTMLDivElement>()
  const dayListRef = useRef<HTMLDivElement>(null)

  const hasDayPlan = route.id === DEFAULT_ROUTES[country]
  const advice = seasonalAdvice(country, month)
  const stop = route.stops.find(({ place }) => place === activePlace)
  const place = stop ? PLACES[stop.place] : null
  const placeLegs = route.legs.filter((leg) => leg.to === activePlace)

  useEffect(() => {
    setActivePlace(null)
    setOpenDay(null)
  }, [route.id])

  const selectDay = (day: ItineraryDay) => {
    const opening = openDay !== day.id
    setOpenDay(opening ? day.id : null)
    if (opening) setActivePlace(day.place)
  }

  const selectPlace = (placeId: string) => {
    setActivePlace(placeId)
    const firstDay = days.find((day) => day.place === placeId)
    if (hasDayPlan && firstDay) setOpenDay(firstDay.id)
  }

  return (
    <section id="rutas" className="bg-sand-100 px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading eyebrow="Rutas" title="Dos mapas, dos viajes posibles">
            <p>Toca un punto del mapa o un día del itinerario: los dos se mueven a la vez.</p>
          </SectionHeading>
          <CountrySwitch value={country} onChange={setCountry} label="Elegir mapa por país" />
        </div>

        <div role="group" aria-label="Elegir ruta" className="mt-10 flex flex-wrap gap-2">
          {routesFor(country).map((candidate) => {
            const active = candidate.id === route.id
            return (
              <button
                key={candidate.id}
                type="button"
                aria-pressed={active}
                onClick={() => setRoute(country, candidate.id)}
                className={`min-h-11 border px-4 text-sm font-medium transition-colors ${
                  active ? 'border-ocean-900 bg-ocean-900 text-ivory' : 'border-sand-400 hover:border-ocean-900'
                }`}
              >
                {candidate.name}
                {candidate.tier === 'recommended' && <span className={active ? 'text-gold-500' : 'text-gold-700'}> · para mayo</span>}
              </button>
            )
          })}
        </div>
        <p className="mt-4 max-w-3xl">{route.summary}</p>
        {route.caveat && (
          <p className="mt-3 flex max-w-3xl gap-2 text-sm text-coral">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" /> {route.caveat}
          </p>
        )}
        <p data-testid="seasonal-advice" className="mt-3 max-w-3xl text-sm text-muted">
          <strong className="text-ink">{MONTHS[month]}:</strong> {advice.message}{' '}
          Encaje de esta ruta: {routeSuitability(route, month).toFixed(1).replace('.', ',')} sobre 5.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div ref={mapSlot} className="relative h-[58svh] min-h-80 overflow-hidden bg-[#a6dcd9] lg:sticky lg:top-20 lg:h-[calc(100svh-7rem)]">
              {mapFailed ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                  <MapPinned aria-hidden className="size-8" />
                  <p className="font-semibold">No hemos podido cargar el mapa.</p>
                  <p className="text-sm">Tienes todas las paradas y traslados en la lista.</p>
                </div>
              ) : near ? (
                <Suspense fallback={<p className="p-6 text-sm">Cargando mapa…</p>}>
                  <TripMap route={route} activePlace={activePlace} onSelectPlace={selectPlace} onError={() => setMapFailed(true)} />
                </Suspense>
              ) : null}

              {place && stop && (
                <div data-testid="map-card" className="absolute inset-x-2 bottom-8 z-10 flex gap-3 bg-ivory p-2 shadow-lg sm:left-3 sm:right-auto sm:w-96">
                  <Photo id={place.image} alt="" sizes="96px" className="size-20 shrink-0" />
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold">{stop.label}{stop.dayTrip && <span className="font-normal text-muted"> · excursión</span>}</p>
                    <p className="line-clamp-2 text-muted">{place.blurb}</p>
                    {placeLegs[0] && <p className="truncate text-emerald-700">{MODE_LABELS[placeLegs[0].mode]}: {placeLegs[0].note}</p>}
                  </div>
                </div>
              )}
            </div>
            <ul aria-label="Leyenda de transporte" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {LEGEND.map(({ mode, style: lineStyle }) => (
                <li key={mode} className="flex items-center gap-2">
                  <span aria-hidden className={`inline-block w-7 ${lineStyle}`} /> {MODE_LABELS[mode]}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-sm text-muted">Vuelos y barcos se dibujan como trayectos conceptuales, no como rutas exactas.</p>
          </div>

          <div className="lg:col-span-5" ref={dayListRef}>
            <h3 className="text-2xl">Paradas de la ruta</h3>
            <ol className="mt-3">
              {route.stops.map((item, index) => {
                const incoming = route.legs.find((leg) => leg.to === item.place)
                return (
                  <li key={item.place}>
                    <button
                      type="button"
                      data-testid="route-stop"
                      aria-pressed={activePlace === item.place}
                      onClick={() => selectPlace(item.place)}
                      className={`flex min-h-11 w-full items-baseline gap-3 px-2 py-1.5 text-left transition-colors ${
                        activePlace === item.place ? 'bg-ocean-900 text-ivory' : 'hover:bg-sand-200'
                      }`}
                    >
                      <span className="w-5 text-sm tabular-nums opacity-70">{index + 1}</span>
                      <span className="flex-1 font-medium">
                        {item.label}
                        {item.dayTrip && <span className="text-sm font-normal opacity-70"> · excursión</span>}
                      </span>
                      {incoming && <span className="text-xs opacity-70">{MODE_LABELS[incoming.mode]}</span>}
                    </button>
                  </li>
                )
              })}
            </ol>

            {hasDayPlan ? (
              <div className="mt-10">
                <h3 className="text-2xl">Día a día</h3>
                <div className="mt-4 grid gap-3">
                  <Segment label="Duración del viaje" options={DURATIONS} value={duration} onChange={setDuration} render={(d) => `${d} días`} />
                  <Segment
                    label="Estilo de viaje"
                    options={Object.keys(STYLE_LABELS) as TravelStyle[]}
                    value={style}
                    onChange={setStyle}
                    render={(s) => STYLE_LABELS[s]}
                  />
                </div>
                <p className="mt-3 text-sm text-muted">
                  <span data-testid="day-count">{days.length} días</span> incluidos los vuelos · intensidad media{' '}
                  {averageIntensity(days).toFixed(1).replace('.', ',')} de 5. Ejemplo orientativo: los enlaces y horarios no están confirmados.
                </p>
                <div className="mt-4">
                  <DayList days={days} openDay={openDay} onToggle={selectDay} />
                </div>
              </div>
            ) : (
              <p className="mt-8 border-l-2 border-gold-500 pl-4">
                El día a día detallado está preparado para la ruta recomendada en mayo. Esta alternativa sirve para comparar la idea general del viaje.
              </p>
            )}
            <p className="mt-6 text-sm text-muted">
              Antes de reservar: Tailandia pide la tarjeta digital TDAC y Malasia la MDAC antes de llegar. Confirmad en fuentes oficiales los requisitos vigentes para pasaporte español.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
