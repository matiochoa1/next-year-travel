import type { MeView } from '@nsa/shared'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { resolveClient, type VotingClient } from './client'

interface Session {
  client: VotingClient
  me: MeView | null
  setMe: (me: MeView | null) => void
  loading: boolean
  offline: boolean
  signIn: (credential: string) => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

/** One identity for the whole page: voting and the shared budget depend on the same login. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { groupId } = useParams()
  const client = useMemo(() => resolveClient(groupId), [groupId])
  const [me, setMe] = useState<MeView | null>(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let cancelled = false
    void client
      .getMe()
      .then((identity) => {
        if (!cancelled) setMe(identity)
      })
      .catch(() => {
        if (!cancelled) setOffline(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [client])

  const signIn = useCallback(
    async (credential: string) => {
      setMe(await client.signIn(credential))
    },
    [client],
  )

  const signOut = useCallback(async () => {
    await client.signOut()
    setMe(null)
  }, [client])

  const value = useMemo(
    () => ({ client, me, setMe, loading, offline, signIn, signOut }),
    [client, me, loading, offline, signIn, signOut],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside SessionProvider')
  return session
}
