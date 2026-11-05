import {
  aggregateResults,
  isClosed,
  type ApiErrorCode,
  type AdminGroupView,
  type Destination,
  type GroupView,
  type MeView,
  type ResultsView,
} from '@nsa/shared'

export class VotingError extends Error {
  constructor(readonly code: ApiErrorCode | 'network') {
    super(code)
  }
}

export interface VoteInput {
  destination: Destination
  comment: string
  expectedVersion: string | null
}

export interface VotingClient {
  mode: 'api' | 'demo'
  groupId: string
  getResults(): Promise<ResultsView>
  getMe(): Promise<MeView | null>
  /** Google credential, or a plain name in demo mode. */
  signIn(credential: string): Promise<MeView>
  signOut(): Promise<void>
  vote(input: VoteInput): Promise<MeView>
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-NSA-Client': 'web', ...init.headers },
    })
  } catch {
    throw new VotingError('network')
  }
  const payload = (await response.json().catch(() => null)) as T | { error?: ApiErrorCode } | null
  if (!response.ok) {
    throw new VotingError((payload as { error?: ApiErrorCode } | null)?.error ?? 'internal')
  }
  return payload as T
}

export function createApiClient(groupId: string): VotingClient {
  const base = `/groups/${encodeURIComponent(groupId)}`
  return {
    mode: 'api',
    groupId,
    getResults: () => apiFetch<ResultsView>(`${base}/results`),
    getMe: () => apiFetch<MeView | null>(`${base}/me`),
    signIn: (credential) => apiFetch<MeView>(`${base}/login`, { method: 'POST', body: JSON.stringify({ credential }) }),
    signOut: async () => {
      await apiFetch(`${base}/logout`, { method: 'POST' })
    },
    vote: (input) => apiFetch<MeView>(`${base}/vote`, { method: 'PUT', body: JSON.stringify(input) }),
  }
}

export const adminApi = (groupId: string) => {
  const base = `/manage/groups/${encodeURIComponent(groupId)}`
  const post = <T>(path: string, body?: unknown) =>
    apiFetch<T>(`${base}${path}`, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
  return {
    status: () => apiFetch<AdminGroupView>(base),
    lock: () => post<GroupView>('/lock'),
    unlock: () => post<GroupView>('/unlock'),
    deadline: (votingClosesAt: string | null) => post<GroupView>('/deadline', { votingClosesAt }),
    reset: (confirm: string) => post<{ deleted: number }>('/reset', { confirm }),
    invite: (emails: string[]) => post<{ invited: number }>('/invitations', { emails }),
    uninvite: (email: string) => post<unknown>('/invitations/remove', { email }),
  }
}

interface DemoState {
  name: string | null
  vote: { destination: Destination; comment: string; updatedAt: string; version: string } | null
  locked: boolean
}

const DEMO_KEY = 'nsa-demo-vote'
const DEMO_ID = 'demo-participant'

const readDemo = (): DemoState => {
  try {
    const stored = localStorage.getItem(DEMO_KEY)
    if (stored) return JSON.parse(stored) as DemoState
  } catch {
    // Unavailable or corrupted storage simply starts a fresh demo.
  }
  return { name: null, vote: null, locked: false }
}

const writeDemo = (state: DemoState) => localStorage.setItem(DEMO_KEY, JSON.stringify(state))

/** Single-browser stand-in for local development. Nothing here is shared with anyone. */
export function createDemoClient(): VotingClient & { setLocked(locked: boolean): void; reset(): void } {
  const toMe = (state: DemoState): MeView | null =>
    state.name
      ? { participantId: DEMO_ID, name: state.name, email: 'demo@example.com', isAdmin: false, vote: state.vote }
      : null

  return {
    mode: 'demo',
    groupId: 'demo',
    async getResults() {
      const state = readDemo()
      const groupStatus = state.locked ? ('locked' as const) : ('open' as const)
      const group: GroupView = {
        groupId: 'demo',
        title: 'Demo',
        status: groupStatus,
        votingClosesAt: null,
        closed: isClosed({ status: groupStatus, votingClosesAt: null }, new Date()),
      }
      const votes = state.vote ? [{ participantId: DEMO_ID, ...state.vote }] : []
      const names = new Map(state.name ? [[DEMO_ID, state.name]] : [])
      return aggregateResults(group, votes, names)
    },
    getMe: async () => toMe(readDemo()),
    async signIn(name) {
      const next = { ...readDemo(), name }
      writeDemo(next)
      return toMe(next) as MeView
    },
    signOut: async () => writeDemo({ ...readDemo(), name: null }),
    async vote({ destination, comment }) {
      const state = readDemo()
      if (!state.name) throw new VotingError('unauthorized')
      if (state.locked) throw new VotingError('voting_closed')
      const next: DemoState = {
        ...state,
        vote: { destination, comment, updatedAt: new Date().toISOString(), version: String(Date.now()) },
      }
      writeDemo(next)
      return toMe(next) as MeView
    },
    setLocked: (locked) => writeDemo({ ...readDemo(), locked }),
    reset: () => localStorage.removeItem(DEMO_KEY),
  }
}

export function resolveClient(routeGroupId?: string): VotingClient {
  const groupId = routeGroupId || import.meta.env.VITE_GROUP_ID
  if (import.meta.env.VITE_VOTING_MODE === 'api' && groupId) return createApiClient(groupId)
  return createDemoClient()
}
