import { zodResolver } from '@hookform/resolvers/zod'
import { COMMENT_MAX, commentSchema, destinationSchema } from '@nsa/shared'
import { Check, FlaskConical, Loader2, WifiOff } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useParams } from 'react-router'
import { z } from 'zod'
import { Photo } from '../../components/ui/Photo'
import { Reveal } from '../../components/ui/Reveal'
import { COUNTRIES, COUNTRY_NAMES } from '../../data/types'
import { resolveClient, VotingError, type createDemoClient } from './client'
import { FinalReveal } from './FinalReveal'
import { SignIn } from './SignIn'
import { Comments, ResultBars } from './ResultBars'
import { useVoting } from './useVoting'

const VOTE_IMAGES = { thailand: 'th-nangyuan', malaysia: 'my-redang2' } as const

const ERROR_MESSAGES: Record<string, string> = {
  voting_closed: 'La votación ya está cerrada.',
  rate_limited: 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.',
  version_conflict: 'Tu voto ha cambiado desde otra pestaña o dispositivo. Revísalo y vuelve a enviarlo.',
  unauthorized: 'Tu sesión ha caducado. Vuelve a entrar.',
  network: 'No hemos podido conectar. Comprueba tu conexión e inténtalo de nuevo.',
}

const formSchema = z.object({
  destination: destinationSchema,
  comment: commentSchema,
})
type FormValues = z.infer<typeof formSchema>

export function VotingSection() {
  const { groupId } = useParams()
  const client = useMemo(() => resolveClient(groupId), [groupId])
  const sectionRef = useRef<HTMLElement>(null)
  const { results, me, loading, offline, signIn, signOut, submit, refresh } = useVoting(client, sectionRef)
  const [editing, setEditing] = useState(false)
  const closed = results?.group.closed ?? false
  const signedIn = !loading && me !== null
  const showForm = signedIn && results !== null && !closed && (!me.vote || editing)

  return (
    <section id="votacion" ref={sectionRef} className="bg-ocean-950 px-5 py-24 text-ivory md:px-8 md:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-gold-500">La decisión</p>
          <h2 className="mt-4 text-5xl md:text-7xl">El próximo destino lo decidimos juntos.</h2>
        </Reveal>

        {client.mode === 'demo' && (
          <DemoBanner client={client as ReturnType<typeof createDemoClient>} closed={closed} onChange={refresh} />
        )}
        {offline && (
          <p role="status" className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-2 text-sm text-gold-500">
            <WifiOff aria-hidden className="size-4" /> Sin conexión con la votación: los datos pueden no estar actualizados.
          </p>
        )}

        {loading && (
          <p role="status" className="mt-12 flex items-center justify-center gap-2">
            <Loader2 aria-hidden className="size-5 motion-safe:animate-spin" /> Cargando la votación…
          </p>
        )}

        {!loading && !me && <SignIn demo={client.mode === 'demo'} onSignIn={signIn} />}

        {signedIn && (
          <p className="mt-6 text-center text-sm text-ivory/75">
            Has entrado como {me.name} ·{' '}
            <button type="button" onClick={() => void signOut()} className="link-underline min-h-11 text-ivory">Cerrar sesión</button>
          </p>
        )}

        {signedIn && closed && results && <div className="mt-12"><FinalReveal results={results} /></div>}

        {showForm && (
          <VoteForm
            key={me.vote?.version ?? 'new'}
            defaults={me.vote}
            onCancel={me.vote ? () => setEditing(false) : undefined}
            onSubmit={async (values) => {
              await submit(values)
              setEditing(false)
            }}
          />
        )}

        {signedIn && !closed && me.vote && !editing && results && (
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <div data-testid="vote-confirmation">
              <p className="flex items-center gap-2 text-gold-500">
                <Check aria-hidden className="size-5" /> ¡Voto registrado, {me.name}!
              </p>
              <p className="mt-3 font-display text-4xl">Has elegido {COUNTRY_NAMES[me.vote.destination]}</p>
              {me.vote.comment && <p className="mt-3 border-l-2 border-gold-500 pl-4 break-words">{me.vote.comment}</p>}
              <button type="button" onClick={() => setEditing(true)} className="link-underline mt-6 min-h-11 text-ivory/90 hover:text-ivory">
                Cambiar mi voto
              </button>
              <p className="mt-2 text-sm text-ivory/70">
                Puedes cambiarlo hasta que se cierre la votación
                {results.group.votingClosesAt ? `, el ${new Date(results.group.votingClosesAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}` : ''}.
              </p>
            </div>
            <ResultBars results={results} />
          </div>
        )}

        {showForm && results && results.totalVotes > 0 && (
          <div className="mx-auto mt-10 max-w-2xl">
            <ResultBars results={results} />
          </div>
        )}
        {signedIn && !closed && results && <Comments results={results} />}
      </div>
    </section>
  )
}

function DemoBanner({ client, closed, onChange }: { client: ReturnType<typeof createDemoClient>; closed: boolean; onChange: () => Promise<void> }) {
  return (
    <div role="note" className="mx-auto mt-8 max-w-2xl border border-gold-500/60 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-gold-500"><FlaskConical aria-hidden className="size-4" /> Modo demo</p>
      <p className="mt-1 text-ivory/85">
        Tu voto se guarda solo en este navegador: nadie más puede verlo y no se comparte entre dispositivos.
      </p>
      <button
        type="button"
        onClick={() => {
          client.setLocked(!closed)
          void onChange()
        }}
        className="link-underline mt-2 min-h-11 text-ivory"
      >
        {closed ? 'Reabrir la votación de prueba' : 'Simular el cierre de la votación'}
      </button>
    </div>
  )
}

interface VoteFormProps {
  defaults?: { destination: FormValues['destination']; comment: string } | null
  onSubmit: (values: FormValues) => Promise<void>
  onCancel?: () => void
}

function VoteForm({ defaults, onSubmit, onCancel }: VoteFormProps) {
  const { register, handleSubmit, setError, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { destination: defaults?.destination, comment: defaults?.comment ?? '' },
  })
  const destination = useWatch({ control, name: 'destination' })
  const comment = useWatch({ control, name: 'comment' }) ?? ''

  const send = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const code = error instanceof VotingError ? error.code : 'internal'
      setError('root', { message: ERROR_MESSAGES[code] ?? 'Algo ha fallado. Inténtalo de nuevo en un momento.' })
    }
  })

  return (
    <form onSubmit={(event) => void send(event)} noValidate className="mt-12">
      <fieldset>
        <legend className="sr-only">Elige destino</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {COUNTRIES.map((country) => {
            const selected = destination === country
            return (
              <label key={country} className="group relative block cursor-pointer overflow-hidden">
                <input type="radio" value={country} {...register('destination')} className="peer sr-only" />
                <Photo
                  id={VOTE_IMAGES[country]}
                  alt=""
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className={`h-56 w-full transition-all duration-700 md:h-[52vh] ${
                    destination && !selected ? 'brightness-50 saturate-50' : 'group-hover:scale-105'
                  }`}
                />
                <span aria-hidden className={`absolute inset-0 border-4 transition-colors ${selected ? 'border-gold-500' : 'border-transparent'} peer-focus-visible:border-aqua-300`} />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ocean-950/90 to-transparent p-5 pt-20">
                  <span className="font-display text-4xl tracking-wide uppercase md:text-6xl">{COUNTRY_NAMES[country]}</span>
                  <span aria-hidden className={`flex size-9 items-center justify-center rounded-full border-2 ${selected ? 'border-gold-500 bg-gold-500 text-ocean-950' : 'border-ivory/70'}`}>
                    {selected && <Check className="size-5" />}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
        {errors.destination && <p role="alert" className="mt-2 text-sm text-gold-500">Elige Tailandia o Malasia.</p>}
      </fieldset>

      <div className="mx-auto mt-8 max-w-2xl space-y-5">
        <div>
          <label htmlFor="comment" className="block font-medium">Tu motivo <span className="font-normal text-ivory/70">(opcional)</span></label>
          <textarea
            id="comment"
            rows={2}
            maxLength={COMMENT_MAX}
            {...register('comment')}
            className="mt-1 w-full border border-ivory/40 bg-ocean-900 px-4 py-3 text-ivory placeholder:text-ivory/50"
            placeholder="¿Qué te ha convencido?"
          />
          <p className="text-right text-xs text-ivory/70">{comment.length} / {COMMENT_MAX}</p>
        </div>
        {errors.root && <p role="alert" className="text-gold-500">{errors.root.message}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={isSubmitting} className="flex min-h-13 items-center gap-2 bg-gold-500 px-8 font-semibold text-ocean-950 transition-colors hover:bg-ivory disabled:opacity-60">
            {isSubmitting && <Loader2 aria-hidden className="size-5 motion-safe:animate-spin" />}
            {defaults ? 'Actualizar mi voto' : 'Enviar mi voto'}
          </button>
          {onCancel && <button type="button" onClick={onCancel} className="link-underline min-h-11">Cancelar</button>}
        </div>
      </div>
    </form>
  )
}
