import { useEffect, useRef, useState, type FormEvent } from 'react'
import { VotingError } from './client'

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

interface GoogleAccounts {
  initialize(config: { client_id: string; callback: (response: { credential: string }) => void; ux_mode: 'popup' }): void
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccounts } }
  }
}

function loadGoogle() {
  return new Promise<GoogleAccounts>((resolve, reject) => {
    if (window.google) {
      resolve(window.google.accounts.id)
      return
    }
    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT
    script.async = true
    script.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error('gsi')))
    script.onerror = () => reject(new Error('gsi'))
    document.head.append(script)
  })
}

function GoogleButton({ onCredential, onUnavailable }: { onCredential: (credential: string) => void; onUnavailable: () => void }) {
  const slot = useRef<HTMLDivElement>(null)
  const callback = useRef(onCredential)
  callback.current = onCredential

  useEffect(() => {
    let cancelled = false
    loadGoogle()
      .then((google) => {
        if (cancelled || !slot.current) return
        google.initialize({
          client_id: CLIENT_ID as string,
          callback: ({ credential }) => callback.current(credential),
          ux_mode: 'popup',
        })
        google.renderButton(slot.current, {
          theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', locale: 'es', width: 300,
        })
      })
      .catch(() => {
        if (!cancelled) onUnavailable()
      })
    return () => {
      cancelled = true
    }
    // The script is initialised once; the latest callback is read through the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={slot} data-testid="google-button" className="flex min-h-11 justify-center" />
}

/** Local stand-in for Google: demo mode asks for a name, the dev API for an invited address. */
function LocalSignIn({ demo, onCredential }: { demo: boolean; onCredential: (credential: string) => void }) {
  const [value, setValue] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = value.trim()
    if (text.length >= 2) onCredential(demo ? text : `dev|${text}|${text.split('@')[0]}`)
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end justify-center gap-3">
      <label className="block min-w-64 text-left text-sm font-medium">
        {demo ? 'Tu nombre' : 'Email invitado (solo desarrollo)'}
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          type={demo ? 'text' : 'email'}
          className="mt-1 min-h-11 w-full border border-current/40 bg-transparent px-3"
        />
      </label>
      <button type="submit" className="min-h-11 bg-gold-500 px-6 font-semibold text-ocean-950">Entrar</button>
    </form>
  )
}

interface SignInProps {
  demo: boolean
  onSignIn: (credential: string) => Promise<void>
  intro?: string
}

const messageFor = (error: unknown) => {
  const code = error instanceof VotingError ? error.code : 'internal'
  if (code === 'not_invited') return 'Esa cuenta no está invitada. Pide acceso a quien organiza el viaje, o entra con el email al que te invitó.'
  if (code === 'unauthorized') return 'Google no ha podido confirmar tu cuenta. Inténtalo de nuevo.'
  if (code === 'rate_limited') return 'Demasiados intentos seguidos. Espera unos minutos.'
  if (code === 'network') return 'No hemos podido conectar. Comprueba tu conexión.'
  return 'Algo ha fallado. Inténtalo de nuevo en un momento.'
}

export function SignIn({ demo, onSignIn, intro }: SignInProps) {
  const [error, setError] = useState<string | null>(null)
  const [googleDown, setGoogleDown] = useState(false)

  const handle = (credential: string) => {
    setError(null)
    onSignIn(credential).catch((caught: unknown) => setError(messageFor(caught)))
  }

  return (
    <div data-testid="sign-in" className="mx-auto mt-10 max-w-lg text-center">
      <p className="text-lg">{intro ?? 'La votación es solo para el grupo. Entra con la cuenta de Google que te han invitado.'}</p>
      <div className="mt-6">
        {!demo && CLIENT_ID
          ? <GoogleButton onCredential={handle} onUnavailable={() => setGoogleDown(true)} />
          : <LocalSignIn demo={demo} onCredential={handle} />}
      </div>
      {googleDown && <p role="alert" className="mt-4">No hemos podido cargar el acceso con Google. Desactiva el bloqueador de contenido o recarga la página.</p>}
      {error && <p role="alert" className="mt-4 font-medium">{error}</p>}
    </div>
  )
}
