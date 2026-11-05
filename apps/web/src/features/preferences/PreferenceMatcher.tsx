import { CRITERIA } from '../../data/comparison'
import { COUNTRIES, COUNTRY_NAMES } from '../../data/types'
import { useTrip } from '../../store/tripStore'
import { explainMatch, matchScores } from './matcher'

export function PreferenceMatcher() {
  const weights = useTrip((state) => state.weights)
  const setWeight = useTrip((state) => state.setWeight)
  const scores = matchScores(weights)

  return (
    <div className="mt-20 grid gap-10 bg-ivory p-6 text-ink md:p-10 lg:grid-cols-2">
      <div>
        <p className="eyebrow text-gold-700">Tu compatibilidad</p>
        <h3 className="mt-3 text-4xl">¿Qué te importa a ti?</h3>
        <p className="mt-2 text-muted">Es tu resultado personal, se guarda solo en este navegador y no cuenta como voto.</p>
        <div className="mt-6 space-y-2">
          {CRITERIA.map(({ id, label }) => (
            <div key={id}>
              <label htmlFor={`weight-${id}`} className="flex justify-between text-sm font-medium">
                {label} <output className="tabular-nums">{weights[id]}</output>
              </label>
              <input
                id={`weight-${id}`}
                type="range"
                min={0}
                max={5}
                step={1}
                value={weights[id]}
                onChange={(event) => setWeight(id, Number(event.target.value))}
                className="range-track"
                style={{ '--fill': `${weights[id] * 20}%` } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center" aria-live="polite">
        {COUNTRIES.map((country) => {
          const score = scores?.[country] ?? 0
          return (
            <div key={country} className="mb-6">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-3xl">{COUNTRY_NAMES[country]}</span>
                <span data-testid={`match-${country}`} className="font-display text-5xl tabular-nums">
                  {scores ? `${score}%` : '—'}
                </span>
              </div>
              <div className="mt-2 h-2 bg-sand-200">
                <div
                  className={`h-full transition-[width] duration-500 ${country === 'thailand' ? 'bg-aqua-600' : 'bg-gold-700'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          )
        })}
        <p data-testid="match-explanation" className="font-display text-xl leading-snug">{explainMatch(weights)}</p>
      </div>
    </div>
  )
}
