import { BedDouble, ExternalLink, Plane, Ship } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TripDuration } from '../../data/itineraries'
import { COUNTRIES, COUNTRY_NAMES, type Country } from '../../data/types'
import { useTrip } from '../../store/tripStore'
import {
  addDays,
  bookingUrl,
  dateOfDay,
  DOMESTIC_FLIGHTS,
  edreamsUrl,
  FERRIES,
  googleFlightsUrl,
  INTERNATIONAL,
  skyscannerUrl,
  staysFor,
  twelveGoUrl,
} from './searchLinks'

const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function SiteLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${label}: ${detail} (se abre en una pestaña nueva)`}
      className="inline-flex min-h-10 items-center gap-1 border border-ocean-900 px-3 text-sm font-medium transition-colors hover:bg-ocean-900 hover:text-ivory"
    >
      {label} <ExternalLink aria-hidden className="size-3.5" />
    </a>
  )
}

function Group({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h5 className="flex items-center gap-2 font-sans text-sm font-semibold">{icon} {title}</h5>
      <div className="mt-2 space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-1 flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function CountrySearch({ country, duration, departure }: { country: Country; duration: TripDuration; departure: string }) {
  const back = addDays(departure, duration - 1)
  const { label, to } = INTERNATIONAL[country]
  return (
    <div data-testid={`search-${country}`}>
      <h4 className="text-2xl">{COUNTRY_NAMES[country]}</h4>
      <Group icon={<Plane aria-hidden className="size-4" />} title="Vuelos internacionales">
        <Row label={`${label} · ${shortDate(departure)} – ${shortDate(back)}`}>
          <SiteLink href={skyscannerUrl('MAD', to, departure, back)} label="Skyscanner" detail={label} />
          <SiteLink href={edreamsUrl('MAD', to, departure, back)} label="eDreams" detail={label} />
          <SiteLink href={googleFlightsUrl('MAD', to, departure, back)} label="Google Flights" detail={label} />
        </Row>
      </Group>
      <Group icon={<Plane aria-hidden className="size-4" />} title="Vuelos internos">
        {DOMESTIC_FLIGHTS[country].map((route) => {
          const date = dateOfDay(country, duration, route.day, departure)
          return (
            <Row key={route.label} label={`${route.label} · ${shortDate(date)}`}>
              <SiteLink href={skyscannerUrl(route.from, route.to, date)} label="Skyscanner" detail={route.label} />
              <SiteLink href={googleFlightsUrl(route.from, route.to, date)} label="Google Flights" detail={route.label} />
            </Row>
          )
        })}
      </Group>
      <Group icon={<Ship aria-hidden className="size-4" />} title="Ferris y barcos">
        <div className="flex flex-wrap gap-2">
          {FERRIES[country].map((route) => (
            <SiteLink
              key={route.label}
              href={twelveGoUrl(route.from, route.to, dateOfDay(country, duration, route.day, departure))}
              label={route.label}
              detail="12Go"
            />
          ))}
        </div>
        <p className="text-xs text-muted">Se abre en 12Go. No todos los trayectos se venden con tanta antelación.</p>
      </Group>
      <Group icon={<BedDouble aria-hidden className="size-4" />} title="Hoteles en Booking">
        <div className="flex flex-wrap gap-2">
          {staysFor(country, duration, departure).map((stay) => (
            <SiteLink
              key={stay.checkin}
              href={bookingUrl(stay.place, stay.checkin, stay.checkout)}
              label={`${stay.place.split(',')[0]} · ${stay.nights} ${stay.nights === 1 ? 'noche' : 'noches'}`}
              detail={`${shortDate(stay.checkin)} a ${shortDate(stay.checkout)}`}
            />
          ))}
        </div>
      </Group>
    </div>
  )
}

export function PriceSearch() {
  const departure = useTrip((state) => state.departureDate)
  const setDeparture = useTrip((state) => state.setDepartureDate)
  const days = useTrip((state) => state.budgetDays) as TripDuration

  return (
    <div className="mt-14 bg-ivory p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <h3 className="text-3xl">Busca precios reales</h3>
          <p className="mt-1 text-muted">
            Abre cada web con la ruta y las fechas ya puestas. Cuando encuentres un buen precio, apúntalo abajo para que lo vea todo el grupo.
          </p>
        </div>
        <label className="text-sm font-medium">
          Salida desde Madrid
          <input
            type="date"
            value={departure}
            min="2027-05-01"
            max="2027-05-31"
            onChange={(event) => event.target.value && setDeparture(event.target.value)}
            className="mt-1 block min-h-11 border border-sand-400 bg-ivory px-3"
          />
        </label>
      </div>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        {COUNTRIES.map((country) => <CountrySearch key={country} country={country} duration={days} departure={departure} />)}
      </div>
      <p className="mt-6 text-xs text-muted">
        Son webs externas: los precios y la disponibilidad dependen de ellas y pueden cambiar. No ganamos nada con estos enlaces.
      </p>
    </div>
  )
}
