import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiRequest } from './http'
import type { VerifyIdentity } from './identity'
import { MemoryRepository } from './memory-repository'
import { ConcurrencyError } from './repository'
import { execute, routes, type Deps } from './service'
import { loadConfig } from './config'

const GROUP = 'group12345'
const ORIGIN = 'https://nextstop.example'
const ADMIN_EMAIL = 'owner@gmail.com'

const config = loadConfig({
  RATE_LIMIT_SALT: 'salt',
  SESSION_SECRET: 'session-secret',
  ADMIN_EMAILS: 'Owner@gmail.com',
  ALLOWED_ORIGINS: ORIGIN,
  GROUP_CREATION_SECRET: 'bootstrap',
  COOKIE_SECURE: 'true',
})

/** Test credentials are simply the email, or "<email>|<name>"; "bad" is a rejected token. */
const verifyIdentity: VerifyIdentity = async (credential) => {
  if (credential === 'bad') return null
  const [email = '', name] = credential.split('|')
  return { subject: `sub-${email.toLowerCase()}`, email, name }
}

interface CallOptions {
  body?: unknown
  cookie?: string
  headers?: Record<string, string>
  params?: Record<string, string>
  method?: string
}

function caller(deps: Deps) {
  return async (name: string, options: CallOptions = {}) => {
    const route = routes.find((candidate) => candidate.name === name)
    if (!route) throw new Error(`Unknown route ${name}`)
    const headers = new Headers({ 'x-nsa-client': 'web', 'x-forwarded-for': '1.2.3.4:5000', ...options.headers })
    if (options.cookie) headers.set('cookie', options.cookie)
    const request: ApiRequest = {
      method: options.method ?? route.method,
      params: options.params ?? { groupId: GROUP },
      headers,
      json: async () => options.body,
    }
    return execute(route, request, deps)
  }
}

const cookieOf = (setCookie: string | undefined) => setCookie?.split(';')[0] ?? ''

describe('voting API', () => {
  let repo: MemoryRepository
  let now: Date
  let deps: Deps
  let call: ReturnType<typeof caller>
  let admin: string

  const signIn = async (credential: string) => {
    const response = await call('login', { body: { credential } })
    expect(response.status).toBe(200)
    return cookieOf(response.headers['Set-Cookie'])
  }

  const invite = (...emails: string[]) => call('adminInvite', { cookie: admin, body: { emails } })

  const join = async (name: string) => {
    const email = `${name.toLowerCase()}@example.com`
    await invite(email)
    return signIn(`${email}|${name}`)
  }

  beforeEach(async () => {
    repo = new MemoryRepository()
    now = new Date('2026-12-01T10:00:00Z')
    deps = { repo, config, verifyIdentity, now: () => now, log: vi.fn() }
    call = caller(deps)
    await repo.createGroup({
      groupId: GROUP,
      title: 'Prueba',
      createdAt: now.toISOString(),
      status: 'open',
      votingClosesAt: null,
    })
    admin = await signIn(`${ADMIN_EMAIL}|Dueño`)
  })

  describe('login', () => {
    it('sets a hardened session cookie for invited people', async () => {
      await invite('ana@example.com')
      const response = await call('login', { body: { credential: 'ana@example.com|Ana' } })
      const cookie = response.headers['Set-Cookie'] ?? ''
      expect(cookie).toMatch(/^__Host-nsa_s_group12345=/)
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('Secure')
      expect(cookie).toContain('SameSite=Lax')
      expect(cookie).toContain('Path=/')
      expect(response.body).toMatchObject({ name: 'Ana', isAdmin: false, vote: null })
    })

    it('refuses anyone who has not been invited, without a session', async () => {
      const response = await call('login', { body: { credential: 'stranger@example.com' } })
      expect(response.status).toBe(403)
      expect(response.body).toEqual({ error: 'not_invited' })
      expect(response.headers['Set-Cookie']).toBeUndefined()
    })

    it('rejects an invalid Google credential', async () => {
      const response = await call('login', { body: { credential: 'bad' } })
      expect(response.status).toBe(401)
    })

    it('matches Gmail invitations regardless of dots, tags and case', async () => {
      await invite('Ana.Perez+viaje@gmail.com')
      await expect(signIn('anaperez@GMAIL.com')).resolves.toBeTruthy()
    })

    it('lets admins in without an invitation', async () => {
      expect((await call('getMe', { cookie: admin })).body).toMatchObject({ isAdmin: true })
    })

    it('keeps one participant per Google account across devices', async () => {
      const laptop = await join('Ana')
      const phone = await signIn('ana@example.com|Ana')
      await call('putVote', { body: { destination: 'thailand' }, cookie: laptop })
      expect((await call('getMe', { cookie: phone })).body).toMatchObject({ vote: { destination: 'thailand' } })
      expect((await repo.getSnapshot(GROUP)).participants).toHaveLength(2)
    })

    it('allows invited people in after closing so they can see the result', async () => {
      await invite('ana@example.com')
      await call('adminLock', { cookie: admin })
      await expect(signIn('ana@example.com')).resolves.toBeTruthy()
    })

    it('logs out by expiring the cookie', async () => {
      const response = await call('logout')
      expect(response.headers['Set-Cookie']).toContain('Max-Age=0')
    })

    it('expires old sessions', async () => {
      const cookie = await join('Ana')
      now = new Date('2027-03-01T10:00:00Z')
      expect((await call('getMe', { cookie })).body).toBeNull()
    })

    it('validates the payload', async () => {
      expect((await call('login', { body: {} })).status).toBe(400)
      expect((await call('login', { body: 'not-json' })).status).toBe(400)
    })

    it('returns 404 for unknown or malformed groups', async () => {
      const options = { body: { credential: 'x@example.com' } }
      expect((await call('login', { ...options, params: { groupId: 'nonexistent1' } })).status).toBe(404)
      expect((await call('login', { ...options, params: { groupId: '../../etc' } })).status).toBe(404)
    })
  })

  describe('privacy', () => {
    it('hides results from anyone without a session', async () => {
      expect((await call('getResults')).status).toBe(401)
    })

    it('never exposes email addresses in results', async () => {
      const cookie = await join('Ana')
      await call('putVote', { body: { destination: 'thailand', comment: 'Hola' }, cookie })
      expect(JSON.stringify((await call('getResults', { cookie })).body)).not.toContain('@')
    })

    it('does not accept a session from another group', async () => {
      await repo.createGroup({ groupId: 'othergroup1', title: 'x', createdAt: '', status: 'open', votingClosesAt: null })
      const cookie = await join('Ana')
      const forged = cookie.replace('nsa_s_group12345', 'nsa_s_othergroup1')
      expect((await call('getMe', { cookie: forged, params: { groupId: 'othergroup1' } })).body).toBeNull()
    })
  })

  describe('voting', () => {
    it('requires a session', async () => {
      const response = await call('putVote', { body: { destination: 'thailand' } })
      expect(response.status).toBe(401)
    })

    it('rejects a forged session', async () => {
      const cookie = await join('Ana')
      const forged = `${cookie.slice(0, cookie.lastIndexOf('.'))}.forged`
      const response = await call('putVote', { body: { destination: 'thailand' }, cookie: forged })
      expect(response.status).toBe(401)
    })

    it('stores a vote and reflects it in /me and /results', async () => {
      const cookie = await join('Ana')
      const vote = await call('putVote', { body: { destination: 'thailand', comment: '¡Vamos!' }, cookie })
      expect(vote.status).toBe(200)
      const me = await call('getMe', { cookie })
      expect(me.body).toMatchObject({ name: 'Ana', vote: { destination: 'thailand', comment: '¡Vamos!' } })
      const results = await call('getResults', { cookie })
      expect(results.body).toMatchObject({ totalVotes: 1, counts: { thailand: 1, malaysia: 0 }, participants: 2 })
    })

    it('updates rather than duplicates', async () => {
      const cookie = await join('Ana')
      await call('putVote', { body: { destination: 'thailand' }, cookie })
      await call('putVote', { body: { destination: 'malaysia' }, cookie })
      expect((await call('getResults', { cookie })).body).toMatchObject({ totalVotes: 1, counts: { thailand: 0, malaysia: 1 } })
    })
    it('ignores attempts to submit a total or another participant id', async () => {
      const cookie = await join('Ana')
      const response = await call('putVote', { body: { destination: 'thailand', counts: { thailand: 99 } }, cookie })
      expect(response.status).toBe(400)
    })

    it('rejects a stale expected version', async () => {
      const cookie = await join('Ana')
      const first = await call('putVote', { body: { destination: 'thailand', expectedVersion: null }, cookie })
      const version = (first.body as { vote: { version: string } }).vote.version
      await call('putVote', { body: { destination: 'malaysia', expectedVersion: version }, cookie })
      const stale = await call('putVote', { body: { destination: 'thailand', expectedVersion: version }, cookie })
      expect(stale.status).toBe(409)
      expect(stale.body).toEqual({ error: 'version_conflict' })
    })

    it('keeps one vote under concurrent submissions from the same participant', async () => {
      const cookie = await join('Ana')
      const responses = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          call('putVote', { body: { destination: i % 2 ? 'thailand' : 'malaysia' }, cookie }),
        ),
      )
      expect(responses.every((response) => response.status === 200 || response.status === 409)).toBe(true)
      expect((await repo.getSnapshot(GROUP)).votes).toHaveLength(1)
    })

    it('retries an internal conflict when no version was supplied', async () => {
      const cookie = await join('Ana')
      const original = repo.putVote.bind(repo)
      const spy = vi.spyOn(repo, 'putVote').mockRejectedValueOnce(new ConcurrencyError()).mockImplementation(original)
      const response = await call('putVote', { body: { destination: 'thailand' }, cookie })
      expect(response.status).toBe(200)
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('blocks votes when locked and after the deadline', async () => {
      const cookie = await join('Ana')
      await call('adminLock', { cookie: admin })
      expect((await call('putVote', { body: { destination: 'thailand' }, cookie })).status).toBe(403)
      await call('adminUnlock', { cookie: admin })
      await call('adminDeadline', { cookie: admin, body: { votingClosesAt: '2026-12-02T00:00:00.000Z' } })
      expect((await call('putVote', { body: { destination: 'thailand' }, cookie })).status).toBe(200)
      now = new Date('2026-12-03T00:00:00Z')
      expect((await call('putVote', { body: { destination: 'malaysia' }, cookie })).status).toBe(403)
    })

    it('declares a winner only after closing', async () => {
      const cookie = await join('Ana')
      await call('putVote', { body: { destination: 'malaysia' }, cookie })
      expect((await call('getResults', { cookie })).body).toMatchObject({ winner: null })
      await call('adminLock', { cookie: admin })
      expect((await call('getResults', { cookie })).body).toMatchObject({ winner: 'malaysia' })
    })
  })

  describe('shared budget', () => {
    const edit = { country: 'thailand', category: 'flights', low: 700, high: 850, note: 'Visto en eDreams', expectedVersion: null }

    it('requires a session to read or change prices', async () => {
      expect((await call('getBudget')).status).toBe(401)
      expect((await call('putBudgetItem', { body: edit })).status).toBe(401)
      expect((await call('resetBudgetItem', { body: { country: 'thailand', category: 'flights' } })).status).toBe(401)
    })

    it('shares an edit with everyone and records who made it', async () => {
      const ana = await join('Ana')
      const beto = await join('Beto')
      const saved = await call('putBudgetItem', { body: edit, cookie: ana })
      expect(saved.status).toBe(200)
      expect((await call('getBudget', { cookie: beto })).body).toMatchObject([
        { country: 'thailand', category: 'flights', low: 700, high: 850, note: 'Visto en eDreams', updatedBy: 'Ana' },
      ])
    })

    it('ignores any author the client tries to send', async () => {
      const cookie = await join('Ana')
      expect((await call('putBudgetItem', { body: { ...edit, updatedBy: 'Otro' }, cookie })).status).toBe(400)
    })

    it('rejects an edit based on a stale value', async () => {
      const [ana, beto] = [await join('Ana'), await join('Beto')]
      const first = await call('putBudgetItem', { body: edit, cookie: ana })
      const { version } = first.body as { version: string }
      await call('putBudgetItem', { body: { ...edit, low: 720, expectedVersion: version }, cookie: ana })
      const stale = await call('putBudgetItem', { body: { ...edit, low: 600, expectedVersion: version }, cookie: beto })
      expect(stale.status).toBe(409)
      const initial = await call('putBudgetItem', { body: edit, cookie: beto })
      expect(initial.status).toBe(409)
    })

    it('validates amounts', async () => {
      const cookie = await join('Ana')
      for (const invalid of [{ low: 900, high: 100 }, { low: -1 }, { high: 20001 }, { low: 1.5 }, { category: 'yates' }, { country: 'vietnam' }]) {
        expect((await call('putBudgetItem', { body: { ...edit, ...invalid }, cookie })).status).toBe(400)
      }
    })

    it('goes back to the initial value on reset', async () => {
      const cookie = await join('Ana')
      await call('putBudgetItem', { body: edit, cookie })
      await call('resetBudgetItem', { body: { country: 'thailand', category: 'flights' }, cookie })
      expect((await call('getBudget', { cookie })).body).toEqual([])
    })

    it('stays editable after the vote closes', async () => {
      const cookie = await join('Ana')
      await call('adminLock', { cookie: admin })
      expect((await call('putBudgetItem', { body: edit, cookie })).status).toBe(200)
    })
  })

  describe('admin', () => {
    const adminRoutes = ['adminGet', 'adminInvite', 'adminUninvite', 'adminLock', 'adminUnlock', 'adminDeadline', 'adminReset']

    it.each(adminRoutes)('%s requires a session', async (name) => {
      expect((await call(name, { body: {} })).status).toBe(401)
    })

    it.each(adminRoutes)('%s rejects an ordinary participant', async (name) => {
      const cookie = await join('Ana')
      expect((await call(name, { body: {}, cookie })).status).toBe(403)
    })

    it('reports each invitation with its status', async () => {
      const cookie = await join('Ana')
      await join('Beto')
      await invite('pendiente@example.com')
      await call('putVote', { body: { destination: 'thailand' }, cookie })
      expect((await call('adminGet', { cookie: admin })).body).toMatchObject({
        participants: 3,
        totalVotes: 1,
        invitations: [
          { email: 'ana@example.com', status: 'voted', name: 'Ana' },
          { email: 'beto@example.com', status: 'joined', name: 'Beto' },
          { email: 'pendiente@example.com', status: 'pending', name: null },
        ],
      })
    })

    it('removing an invitation revokes access at once and drops the vote', async () => {
      const cookie = await join('Ana')
      await call('putVote', { body: { destination: 'thailand' }, cookie })
      await call('adminUninvite', { cookie: admin, body: { email: 'ana@example.com' } })
      expect((await call('getMe', { cookie })).body).toBeNull()
      expect((await call('putVote', { body: { destination: 'malaysia' }, cookie })).status).toBe(401)
      expect((await repo.getSnapshot(GROUP)).votes).toHaveLength(0)
      expect((await call('login', { body: { credential: 'ana@example.com' } })).status).toBe(403)
    })

    it('deduplicates invitations and validates addresses', async () => {
      expect((await invite('a.b@gmail.com', 'ab@gmail.com')).body).toEqual({ invited: 1 })
      expect((await invite('nope')).status).toBe(400)
    })

    it('needs the group id to confirm a reset', async () => {
      const cookie = await join('Ana')
      await call('putVote', { body: { destination: 'thailand' }, cookie })
      expect((await call('adminReset', { cookie: admin, body: { confirm: 'yes' } })).status).toBe(400)
      expect((await repo.getSnapshot(GROUP)).votes).toHaveLength(1)
      const reset = await call('adminReset', { cookie: admin, body: { confirm: GROUP } })
      expect(reset.body).toEqual({ deleted: 1 })
      expect((await repo.getSnapshot(GROUP)).votes).toHaveLength(0)
      expect((await repo.getSnapshot(GROUP)).participants).toHaveLength(2)
    })

    it('clears an expired deadline on unlock so the poll truly reopens', async () => {
      await call('adminDeadline', { cookie: admin, body: { votingClosesAt: '2026-12-02T00:00:00.000Z' } })
      now = new Date('2026-12-05T00:00:00Z')
      await call('adminLock', { cookie: admin })
      const unlocked = await call('adminUnlock', { cookie: admin })
      expect(unlocked.body).toMatchObject({ closed: false, votingClosesAt: null })
    })

    it('only creates groups with the bootstrap secret', async () => {
      const options = { body: { title: 'Nuevo grupo' }, params: {} }
      expect((await call('createGroup', options)).status).toBe(403)
      expect((await call('createGroup', { ...options, headers: { 'x-group-creation-secret': 'x' } })).status).toBe(403)
      const created = await call('createGroup', { ...options, headers: { 'x-group-creation-secret': 'bootstrap' } })
      expect(created.status).toBe(201)
      const { groupId } = created.body as { groupId: string }
      expect(await repo.getGroup(groupId)).toMatchObject({ title: 'Nuevo grupo' })
    })
  })

  describe('platform protections', () => {
    it('blocks writes from a foreign origin', async () => {
      const response = await call('login', {
        body: { credential: ADMIN_EMAIL },
        headers: { origin: 'https://evil.example' },
      })
      expect(response.status).toBe(403)
      expect(response.headers['Access-Control-Allow-Origin']).toBeUndefined()
    })

    it('blocks writes without the custom client header', async () => {
      const route = routes.find((candidate) => candidate.name === 'login')!
      const response = await execute(
        route,
        { method: 'POST', params: { groupId: GROUP }, headers: new Headers(), json: async () => ({ credential: ADMIN_EMAIL }) },
        deps,
      )
      expect(response.status).toBe(403)
    })

    it('answers preflight only for allowlisted origins', async () => {
      const allowed = await call('putVote', { method: 'OPTIONS', headers: { origin: ORIGIN } })
      expect(allowed.status).toBe(204)
      expect(allowed.headers['Access-Control-Allow-Origin']).toBe(ORIGIN)
      expect(allowed.headers['Access-Control-Allow-Credentials']).toBe('true')
      const denied = await call('putVote', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } })
      expect(denied.headers['Access-Control-Allow-Origin']).toBeUndefined()
    })

    it('rate limits per client without storing raw addresses', async () => {
      const increment = vi.spyOn(repo, 'incrementRateCounter')
      let last = await call('login', { body: { credential: 'stranger@example.com' } })
      for (let i = 0; i < 30; i += 1) last = await call('login', { body: { credential: 'stranger@example.com' } })
      expect(last.status).toBe(429)
      expect(increment.mock.calls.flat().join()).not.toContain('1.2.3.4')
      const other = await call('login', { body: { credential: ADMIN_EMAIL }, headers: { 'x-forwarded-for': '9.9.9.9:1' } })
      expect(other.status).toBe(200)
    })

    it('fails open if the limiter itself is down, and logs it', async () => {
      vi.spyOn(repo, 'incrementRateCounter').mockRejectedValue(new Error('storage down'))
      expect((await call('login', { body: { credential: ADMIN_EMAIL } })).status).toBe(200)
      expect(deps.log).toHaveBeenCalled()
    })

    it('hides internal failures behind a generic error', async () => {
      vi.spyOn(repo, 'getSnapshot').mockRejectedValue(new Error('connection string leaked: AccountKey=secret'))
      const response = await call('getResults', { cookie: admin })
      expect(response.status).toBe(500)
      expect(response.body).toEqual({ error: 'internal' })
      expect(deps.log).toHaveBeenCalled()
    })

    it('marks every response as uncacheable', async () => {
      expect((await call('getMe')).headers['Cache-Control']).toBe('no-store')
    })
  })
})
