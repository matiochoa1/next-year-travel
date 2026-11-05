import { AlertTriangle, BedDouble, ChevronDown, Lightbulb, Route as RouteIcon } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { Dots } from '../../components/ui/Dots'
import { Photo } from '../../components/ui/Photo'
import { MODE_LABELS } from '../../data/routes'
import type { ItineraryDay } from './buildItinerary'

interface DayListProps {
  days: ItineraryDay[]
  openDay: string | null
  onToggle: (day: ItineraryDay) => void
}

export function DayList({ days, openDay, onToggle }: DayListProps) {
  return (
    <ol data-testid="day-list" className="border-b border-sand-200">
      {days.map((day) => {
        const open = openDay === day.id
        return (
          <li key={day.id} data-testid="day" className="border-t border-sand-200">
            <h4 className="font-sans">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => onToggle(day)}
                className="flex min-h-14 w-full items-center gap-3 py-3 text-left"
              >
                <span className="font-display text-2xl text-gold-700 tabular-nums" aria-label={`Día ${day.dayNumber}`}>
                  {String(day.dayNumber).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{day.title}</span>
                  <span className="block truncate text-sm text-muted">{day.destination}</span>
                </span>
                {day.warning && <AlertTriangle aria-label="Conexión delicada" className="size-4 shrink-0 text-coral" />}
                <ChevronDown aria-hidden className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
            </h4>
            <AnimatePresence initial={false}>
              {open && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pb-6">
                    <Photo id={day.image} sizes="(min-width: 1024px) 34vw, 100vw" className="aspect-[2/1] w-full" />
                    {day.warning && (
                      <p className="flex gap-2 border-l-2 border-coral bg-coral/8 p-3 text-sm">
                        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-coral" />
                        <span><strong>Aviso:</strong> {day.warning}</span>
                      </p>
                    )}
                    <ul className="list-disc space-y-1 pl-5">
                      {day.activities.map((activity) => <li key={activity}>{activity}</li>)}
                    </ul>
                    {day.styleNote && (
                      <p className="flex gap-2 text-sm text-emerald-700">
                        <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0" /> {day.styleNote}
                      </p>
                    )}
                    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold">Experiencias recomendadas</dt>
                        <dd className="text-muted">{day.experiences.join(' · ')}</dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1 font-semibold"><BedDouble aria-hidden className="size-4" /> Alojamiento</dt>
                        <dd className="text-muted">{day.base ?? 'Noche en el avión'}</dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1 font-semibold"><RouteIcon aria-hidden className="size-4" /> Transporte</dt>
                        <dd className="text-muted">
                          {day.transport ? `${MODE_LABELS[day.transport.mode]}: ${day.transport.text}` : 'Sin traslados largos'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Intensidad</dt>
                        <dd><Dots value={day.intensity} label="Intensidad estimada" /></dd>
                      </div>
                      {day.alternatives.length > 0 && (
                        <div className="sm:col-span-2">
                          <dt className="font-semibold">Alternativas</dt>
                          <dd className="text-muted">{day.alternatives.join(' ')}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ol>
  )
}
