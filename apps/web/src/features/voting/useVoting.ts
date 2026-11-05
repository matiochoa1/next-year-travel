import type { MeView, ResultsView } from '@nsa/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { VotingError, type VoteInput, type VotingClient } from './client'

export const POLL_VISIBLE_MS = 15_000
export const POLL_OFFSCREEN_MS = 60_000

/** Next delay, or null to pause. Hidden tabs never poll: they refresh when they become visible. */
export function pollDelay(tabVisible: boolean, sectionVisible: boolean): number | null {
  if (!tabVisible) return null
  return sectionVisible ? POLL_VISIBLE_MS : POLL_OFFSCREEN_MS
}

export function useVoting(client: VotingClient, sectionRef: React.RefObject<HTMLElement | null>) {
  const [results, setResults] = useState<ResultsView | null>(null)
  const [me, setMe] = useState<MeView | null>(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const sectionVisible = useRef(false)
  const signedIn = me !== null

  const refresh = useCallback(async () => {
    try {
      setResults(await client.getResults())
      setOffline(false)
    } catch (error) {
      // An expired or revoked session sends the person back to the sign-in screen.
      if (error instanceof VotingError && error.code === 'unauthorized') {
        setMe(null)
        setResults(null)
        return
      }
      // Stale results stay on screen; the banner tells the user they may be out of date.
      setOffline(true)
    }
  }, [client])

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

  // Results are private to signed-in participants, so nothing polls before login.
  useEffect(() => {
    if (!signedIn) return
    let timer: ReturnType<typeof setTimeout> | undefined

    const schedule = () => {
      clearTimeout(timer)
      const delay = pollDelay(document.visibilityState === 'visible', sectionVisible.current)
      if (delay !== null) {
        timer = setTimeout(() => {
          void refresh().finally(schedule)
        }, delay)
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
      schedule()
    }

    const observer = new IntersectionObserver(([entry]) => {
      const nowVisible = Boolean(entry?.isIntersecting)
      if (nowVisible && !sectionVisible.current) void refresh()
      sectionVisible.current = nowVisible
      schedule()
    })
    if (sectionRef.current) observer.observe(sectionRef.current)

    void refresh()
    document.addEventListener('visibilitychange', onVisibility)
    schedule()
    return () => {
      clearTimeout(timer)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refresh, sectionRef, signedIn])

  const signIn = useCallback(
    async (credential: string) => {
      setMe(await client.signIn(credential))
    },
    [client],
  )

  const signOut = useCallback(async () => {
    await client.signOut()
    setMe(null)
    setResults(null)
  }, [client])

  const submit = useCallback(
    async (input: Omit<VoteInput, 'expectedVersion'>) => {
      try {
        setMe(await client.vote({ ...input, expectedVersion: me?.vote?.version ?? null }))
      } catch (error) {
        // Our view of the vote was stale (another tab or device): resync so a retry can succeed.
        if (error instanceof VotingError && error.code === 'version_conflict') {
          setMe(await client.getMe())
        }
        throw error
      } finally {
        await refresh()
      }
    },
    [client, me, refresh],
  )

  return { results, me, loading, offline, signIn, signOut, submit, refresh }
}
