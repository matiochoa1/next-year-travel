import type { ResultsView } from '@nsa/shared'
import { m } from 'motion/react'
import { COUNTRIES, COUNTRY_NAMES } from '../../data/types'

export function ResultBars({ results }: { results: ResultsView }) {
  return (
    <div data-testid="results">
      {COUNTRIES.map((country) => {
        const votes = results.counts[country]
        return (
          <div key={country} className="mb-5">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl md:text-3xl">{COUNTRY_NAMES[country]}</span>
              <span className="tabular-nums">
                <strong data-testid={`pct-${country}`} className="font-display text-3xl font-medium">{results.percentages[country]}%</strong>
                <span className="ml-2 text-sm text-ivory/75">{votes} {votes === 1 ? 'voto' : 'votos'}</span>
              </span>
            </div>
            <div className="mt-2 h-3 bg-ivory/15">
              <m.div
                className={`h-full ${country === 'thailand' ? 'bg-aqua-300' : 'bg-gold-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${results.percentages[country]}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )
      })}
      <p className="text-sm text-ivory/75" aria-live="polite">
        <span data-testid="participants">{results.participants}</span> {results.participants === 1 ? 'participante' : 'participantes'} · {results.totalVotes} {results.totalVotes === 1 ? 'voto emitido' : 'votos emitidos'}
      </p>
    </div>
  )
}

export function Comments({ results }: { results: ResultsView }) {
  if (results.comments.length === 0) return null
  return (
    <div className="mt-10">
      <h3 className="text-2xl">Lo que dice el grupo</h3>
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {results.comments.map((comment) => (
          <li key={`${comment.name}-${comment.updatedAt}`} className="border-l-2 border-gold-500 pl-4">
            {/* Rendered as a text node: React escapes it, so stored text can never become markup. */}
            <p className="break-words">{comment.comment}</p>
            <p className="mt-1 text-sm text-ivory/70">
              {comment.name} · {COUNTRY_NAMES[comment.destination]}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
