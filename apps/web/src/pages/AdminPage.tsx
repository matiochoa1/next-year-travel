import type { AdminGroupView, MeView } from '@nsa/shared'
import { Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Dialog } from '../components/ui/Dialog'
import { adminApi, createApiClient } from '../features/voting/client'
import { SignIn } from '../features/voting/SignIn'

const inputClass = 'mt-1 min-h-11 w-full border border-sand-400 bg-ivory px-3'
const buttonClass = 'min-h-11 bg-ocean-900 px-5 font-medium text-ivory disabled:opacity-50'

const STATUS_LABELS = { pending: 'Pendiente', joined: 'Ha entrado', voted: 'Ha votado' }

function Dashboard({ groupId }: { groupId: string }) {
  const api = useMemo(() => adminApi(groupId), [groupId])
  const [view, setView] = useState<AdminGroupView | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emails, setEmails] = useState('')
  const [deadline, setDeadline] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      setView(await api.status())
    } catch {
      setError('No se ha podido completar la acción.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void api.status().then(setView, () => setError('No se ha podido cargar el grupo.'))
  }, [api])

  const invite = (event: FormEvent) => {
    event.preventDefault()
    const list = emails.split(/[\s,;]+/).filter(Boolean)
    if (list.length === 0) return
    void run(async () => {
      await api.invite(list)
      setEmails('')
    })
  }

  return (
    <div className="mt-10 space-y-10">
      {busy && <p role="status" className="flex items-center gap-2"><Loader2 aria-hidden className="size-4 motion-safe:animate-spin" /> Un momento…</p>}
      {error && <p role="alert" className="text-coral">{error}</p>}
      {view && (
        <>
          <dl className="grid grid-cols-3 gap-4">
            <div><dt className="text-sm text-muted">Estado</dt><dd className="font-display text-2xl">{view.group.closed ? 'Cerrada' : 'Abierta'}</dd></div>
            <div><dt className="text-sm text-muted">Participantes</dt><dd className="font-display text-2xl">{view.participants}</dd></div>
            <div><dt className="text-sm text-muted">Votos</dt><dd className="font-display text-2xl">{view.totalVotes}</dd></div>
          </dl>

          <section aria-labelledby="invites">
            <h2 id="invites" className="text-2xl">Invitados</h2>
            <p className="text-sm text-muted">Solo estas cuentas de Google pueden entrar. Aquí no se envía ningún correo: pásales tú el enlace.</p>
            <form onSubmit={invite} className="mt-3">
              <label className="block text-sm font-medium">
                Emails, separados por comas o espacios
                <textarea value={emails} onChange={(event) => setEmails(event.target.value)} rows={2} className={inputClass} />
              </label>
              <button type="submit" disabled={busy} className={`${buttonClass} mt-3`}>Invitar</button>
            </form>
            <ul className="mt-5">
              {view.invitations.map(({ email, status, name }) => (
                <li key={email} data-testid="invitation" className="flex items-center gap-3 border-t border-sand-200 py-1">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{name ?? email}</span>
                    {name && <span className="block truncate text-sm text-muted">{email}</span>}
                  </span>
                  <span className="text-sm text-muted">{STATUS_LABELS[status]}</span>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Quitar a ${email}`}
                    onClick={() => void run(() => api.uninvite(email))}
                    className="flex size-11 items-center justify-center text-coral"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            {view.invitations.length === 0 && <p className="mt-3 text-muted">Todavía no hay nadie invitado.</p>}
          </section>

          <section aria-labelledby="poll" className="space-y-5">
            <h2 id="poll" className="text-2xl">Votación</h2>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={() => void run(api.lock)} className={buttonClass}>Cerrar votación</button>
              <button type="button" disabled={busy} onClick={() => void run(api.unlock)} className={buttonClass}>Reabrir votación</button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void run(() => api.deadline(deadline ? new Date(deadline).toISOString() : null))
              }}
            >
              <label className="block text-sm font-medium">
                Fecha límite {view.group.votingClosesAt && <span className="font-normal text-muted">(actual: {new Date(view.group.votingClosesAt).toLocaleString('es-ES')})</span>}
                <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} className={inputClass} />
              </label>
              <button type="submit" disabled={busy} className={`${buttonClass} mt-3`}>{deadline ? 'Guardar fecha' : 'Quitar fecha'}</button>
            </form>
            <button type="button" onClick={() => setConfirmOpen(true)} className="min-h-11 border border-coral px-5 font-medium text-coral">
              Borrar todos los votos
            </button>
          </section>
        </>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} label="Confirmar borrado de votos" className="w-[min(32rem,calc(100vw-2rem))] bg-ivory p-8">
        <h2 className="pr-10 text-2xl">¿Borrar todos los votos?</h2>
        <p className="mt-2 text-muted">No se puede deshacer. Los invitados se mantienen. Escribe <strong className="text-ink">{groupId}</strong> para confirmar.</p>
        <input aria-label="Identificador del grupo" value={confirmText} onChange={(event) => setConfirmText(event.target.value)} className={inputClass} />
        <button
          type="button"
          disabled={confirmText !== groupId}
          onClick={() => {
            setConfirmOpen(false)
            setConfirmText('')
            void run(() => api.reset(groupId))
          }}
          className="mt-4 min-h-11 bg-coral px-5 font-medium text-ivory disabled:opacity-40"
        >
          Borrar votos
        </button>
      </Dialog>
    </div>
  )
}

export default function AdminPage() {
  const [params] = useSearchParams()
  const groupId = params.get('grupo') ?? import.meta.env.VITE_GROUP_ID ?? ''
  const available = import.meta.env.VITE_VOTING_MODE === 'api' && groupId !== ''
  const client = useMemo(() => createApiClient(groupId), [groupId])
  const [me, setMe] = useState<MeView | null>(null)
  const [loading, setLoading] = useState(available)

  useEffect(() => {
    if (!available) return
    void client.getMe().then(setMe).catch(() => undefined).finally(() => setLoading(false))
  }, [available, client])

  const signOut = async () => {
    await client.signOut()
    setMe(null)
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-16">
      <Link to="/" className="link-underline text-sm">Volver al viaje</Link>
      <h1 className="mt-4 text-4xl">Administración</h1>

      {!available && (
        <p className="mt-6 border-l-2 border-gold-500 pl-4">
          La administración solo existe con el backend real. Esta versión está en modo demo.
        </p>
      )}
      {available && !loading && !me && (
        <SignIn demo={false} intro="Entra con tu cuenta de administración." onSignIn={async (credential) => setMe(await client.signIn(credential))} />
      )}
      {me && !me.isAdmin && <p role="alert" className="mt-6">La cuenta {me.email} no tiene permisos de administración.</p>}
      {me && (
        <p className="mt-4 text-sm text-muted">
          {me.email} · <button type="button" onClick={() => void signOut()} className="link-underline min-h-11">Cerrar sesión</button>
        </p>
      )}
      {me?.isAdmin && <Dashboard groupId={groupId} />}
    </main>
  )
}
