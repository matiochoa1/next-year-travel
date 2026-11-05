import { useCallback, useEffect, type RefObject } from 'react'
import { useTrip } from '../../store/tripStore'
import { useSession } from '../voting/session'

/** Shared prices are private to the group, so they load only after sign-in. */
export function useGroupBudget(sectionRef: RefObject<HTMLElement | null>) {
  const { client, me } = useSession()
  const setItems = useTrip((state) => state.setBudgetItems)
  const signedIn = me !== null

  const reload = useCallback(async () => {
    setItems(await client.getBudget())
  }, [client, setItems])

  useEffect(() => {
    if (!signedIn) {
      setItems([])
      return
    }
    const refresh = () => {
      if (document.visibilityState === 'visible') void reload().catch(() => undefined)
    }
    refresh()
    // Prices change rarely, so catching up on arrival is enough: no polling.
    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && refresh())
    if (sectionRef.current) observer.observe(sectionRef.current)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [reload, sectionRef, setItems, signedIn])

  return reload
}
