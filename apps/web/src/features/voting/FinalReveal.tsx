import type { Destination, ResultsView } from '@nsa/shared'
import { Check, Share2 } from 'lucide-react'
import { m } from 'motion/react'
import { useState } from 'react'
import { Photo } from '../../components/ui/Photo'
import { DESTINATIONS } from '../../data/destinations'
import { DEFAULT_ASSUMPTIONS } from '../../data/budget'
import { ROUTES } from '../../data/routes'
import { COUNTRY_NAMES } from '../../data/types'
import { DEFAULT_ROUTES, useTrip } from '../../store/tripStore'
import { calculateBudget, formatRange, mergeAssumptions } from '../budget/calculateBudget'
import { Confetti } from './Confetti'
import { Comments, ResultBars } from './ResultBars'

const summaryOf = (country: Destination) => {
  const route = ROUTES.find((candidate) => candidate.id === DEFAULT_ROUTES[country])
  return route?.stops.filter((stop) => !stop.dayTrip).map((stop) => stop.label).join(' → ') ?? ''
}

export function shareText(results: ResultsView) {
  if (results.totalVotes === 0) return 'La votación de Next Stop: Asia ha terminado sin votos.'
  if (results.tie) {
    return `Next Stop: Asia: ¡empate! ${results.counts.thailand} votos para Tailandia y ${results.counts.malaysia} para Malasia. Toca desempatar.`
  }
  const winner = results.winner as Destination
  return `Next Stop: Asia: ¡nos vamos a ${COUNTRY_NAMES[winner]}! ${results.percentages[winner]}% de los votos, con ${results.participants} participantes.`
}

export function FinalReveal({ results }: { results: ResultsView }) {
  const [copied, setCopied] = useState(false)
  const { winner, tie } = results
  const budgetItems = useTrip((state) => state.budgetItems)

  const share = async () => {
    const text = shareText(results)
    if (navigator.share) {
      await navigator.share({ title: 'Next Stop: Asia', text }).catch(() => undefined)
      return
    }
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const budget = winner
    ? calculateBudget(mergeAssumptions(DEFAULT_ASSUMPTIONS[winner], budgetItems, winner), { travelers: 1, days: 15, comfort: 'mid', sharedRoom: true }).perPerson
    : null

  return (
    <div data-testid="final-reveal">
      {winner && <Confetti />}
      <div className="relative -mx-5 overflow-hidden md:mx-0">
        <div className="grid h-[60svh] min-h-96" style={{ gridTemplateColumns: winner ? '1fr' : '1fr 1fr' }}>
          {(winner ? [DESTINATIONS[winner].heroImage] : ['th-angthong3', 'my-langtengah']).map((id) => (
            <Photo key={id} id={id} alt="" sizes="100vw" className="size-full" />
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-ocean-950 via-ocean-950/30 to-transparent p-6 text-center">
          <m.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="eyebrow text-gold-500">
            {winner ? 'Nuestro próximo destino es' : tie ? 'Resultado final' : 'Votación cerrada'}
          </m.p>
          <m.h3
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            data-testid="reveal-title"
            className="mt-3 text-6xl md:text-9xl"
          >
            {winner ? COUNTRY_NAMES[winner] : tie ? '¡Empate!' : 'Sin votos'}
          </m.h3>
          {winner && (
            <p className="mt-3 text-lg">
              {results.percentages[winner]}% de los votos · {results.participants} {results.participants === 1 ? 'participante' : 'participantes'}
            </p>
          )}
          {tie && <p className="mt-3 max-w-lg text-lg">Dos países, los mismos votos. Habrá que desempatar en persona, con algo fresco en la mano.</p>}
        </div>
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <ResultBars results={results} />
        {winner && (
          <div>
            <h3 className="text-2xl">El viaje que nos espera</h3>
            <p className="mt-2 text-ivory/85">{summaryOf(winner)}</p>
            <p className="mt-3 text-ivory/85">
              Con los precios del grupo, para 15 días: <strong className="text-ivory">{budget && formatRange(budget)}</strong> por persona.
            </p>
            <p className="mt-3 font-display text-xl text-gold-500">{DESTINATIONS[winner].may.verdict}.</p>
          </div>
        )}
      </div>

      <button type="button" onClick={() => void share()} className="mt-8 flex min-h-12 items-center gap-2 bg-gold-500 px-6 font-semibold text-ocean-950 transition-colors hover:bg-ivory">
        {copied ? <Check aria-hidden className="size-5" /> : <Share2 aria-hidden className="size-5" />}
        {copied ? 'Copiado' : 'Compartir el resultado'}
      </button>
      <span aria-live="polite" className="sr-only">{copied ? 'Resumen copiado al portapapeles' : ''}</span>

      <Comments results={results} />
    </div>
  )
}
