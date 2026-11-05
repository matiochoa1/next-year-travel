import {
  aggregateResults,
  createGroupRequestSchema,
  deadlineRequestSchema,
  groupIdSchema,
  inviteRequestSchema,
  isClosed,
  loginRequestSchema,
  normalizeEmail,
  removeInviteRequestSchema,
  resetRequestSchema,
  toDisplayName,
  voteRequestSchema,
  type AdminGroupView,
  type GroupView,
  type InvitationStatus,
  type MeView,
  type ResultsView,
} from '@nsa/shared'
import type { z } from 'zod'
import type { Config } from './config'
import { anonymizeIp, createSession, newGroupId, participantIdFor, readSession, safeEqual } from './crypto'
import { clientIp, HttpError, parseCookies, type ApiRequest, type ApiResponse } from './http'
import type { VerifyIdentity } from './identity'
import {
  AlreadyExistsError,
  ConcurrencyError,
  type GroupRecord,
  type ParticipantRecord,
  type VotingRepository,
} from './repository'

export interface Deps {
  repo: VotingRepository
  config: Config
  verifyIdentity: VerifyIdentity
  now: () => Date
  log: (message: string, error?: unknown) => void
}

interface HandlerResult {
  status?: number
  body?: unknown
  setCookie?: string
}

type Handler = (req: ApiRequest, deps: Deps) => Promise<HandlerResult>

interface RateRule {
  action: string
  limit: number
  windowSeconds: number
}

export interface Route {
  name: string
  method: 'GET' | 'POST' | 'PUT'
  /** Relative to the `/api` prefix, in Azure Functions route syntax. */
  path: string
  rate?: RateRule
  handler: Handler
}

const COOKIE_PREFIX = 'nsa_s_'
const MAX_WRITE_ATTEMPTS = 3

const cookieName = (groupId: string, config: Config) =>
  `${config.cookieSecure ? '__Host-' : ''}${COOKIE_PREFIX}${groupId}`

function sessionCookie(groupId: string, value: string, maxAge: number, config: Config) {
  const attributes = [
    `${cookieName(groupId, config)}=${value}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${config.cookieSameSite}`,
    `Max-Age=${maxAge}`,
  ]
  if (config.cookieSecure) attributes.push('Secure')
  return attributes.join('; ')
}

async function body<T extends z.ZodType>(req: ApiRequest, schema: T): Promise<z.output<T>> {
  const parsed = schema.safeParse(await req.json().catch(() => undefined))
  if (!parsed.success) throw new HttpError(400, 'bad_request')
  return parsed.data
}

function groupIdOf(req: ApiRequest): string {
  const parsed = groupIdSchema.safeParse(req.params.groupId)
  if (!parsed.success) throw new HttpError(404, 'not_found')
  return parsed.data
}

async function requireGroup(req: ApiRequest, { repo }: Deps): Promise<GroupRecord> {
  const group = await repo.getGroup(groupIdOf(req))
  if (!group) throw new HttpError(404, 'not_found')
  return group
}

function toGroupView(group: GroupRecord, now: Date): GroupView {
  return {
    groupId: group.groupId,
    title: group.title,
    status: group.status,
    votingClosesAt: group.votingClosesAt,
    closed: isClosed(group, now),
  }
}

async function currentParticipant(
  req: ApiRequest,
  groupId: string,
  { repo, config, now }: Deps,
): Promise<ParticipantRecord | null> {
  const cookie = parseCookies(req.headers.get('cookie')).get(cookieName(groupId, config))
  const participantId = readSession(cookie, groupId, now(), config.sessionSecret)
  // Reading the row on every request is what makes removing a friend take effect immediately.
  return participantId ? repo.getParticipant(groupId, participantId) : null
}

const isAdminEmail = (email: string, config: Config) => config.adminEmails.includes(normalizeEmail(email))

async function requireParticipant(req: ApiRequest, group: GroupRecord, deps: Deps) {
  const participant = await currentParticipant(req, group.groupId, deps)
  if (!participant) throw new HttpError(401, 'unauthorized')
  return participant
}

async function requireAdmin(req: ApiRequest, deps: Deps): Promise<GroupRecord> {
  const group = await requireGroup(req, deps)
  const participant = await requireParticipant(req, group, deps)
  if (!isAdminEmail(participant.email, deps.config)) throw new HttpError(403, 'forbidden')
  return group
}

async function resultsFor(group: GroupRecord, { repo, now }: Deps): Promise<ResultsView> {
  const snapshot = await repo.getSnapshot(group.groupId)
  const names = new Map(snapshot.participants.map((p) => [p.participantId, p.displayName]))
  return aggregateResults(toGroupView(group, now()), snapshot.votes, names)
}

async function updateStatus(
  group: GroupRecord,
  patch: Pick<GroupRecord, 'status' | 'votingClosesAt'>,
  deps: Deps,
) {
  try {
    await deps.repo.updateGroup(group.groupId, patch, group.version)
  } catch (error) {
    if (error instanceof ConcurrencyError) throw new HttpError(409, 'version_conflict')
    throw error
  }
  const updated = await deps.repo.getGroup(group.groupId)
  if (!updated) throw new HttpError(404, 'not_found')
  return toGroupView(updated, deps.now())
}

const createGroup: Handler = async (req, deps) => {
  const expected = deps.config.groupCreationSecret
  const provided = req.headers.get('x-group-creation-secret')
  if (!expected || !provided || !safeEqual(expected, provided)) {
    throw new HttpError(403, 'forbidden')
  }
  const input = await body(req, createGroupRequestSchema)
  const groupId = newGroupId()
  try {
    await deps.repo.createGroup({
      groupId,
      title: input.title,
      createdAt: deps.now().toISOString(),
      status: 'open',
      votingClosesAt: input.votingClosesAt ?? null,
    })
  } catch (error) {
    if (error instanceof AlreadyExistsError) throw new HttpError(409, 'version_conflict')
    throw error
  }
  return { status: 201, body: { groupId } }
}

async function toMe(group: GroupRecord, participant: ParticipantRecord, { repo, config }: Deps): Promise<MeView> {
  const vote = await repo.getVote(group.groupId, participant.participantId)
  return {
    participantId: participant.participantId,
    name: participant.displayName,
    email: participant.email,
    isAdmin: isAdminEmail(participant.email, config),
    vote: vote && {
      destination: vote.destination,
      comment: vote.comment,
      updatedAt: vote.updatedAt,
      version: vote.version,
    },
  }
}

const login: Handler = async (req, deps) => {
  const group = await requireGroup(req, deps)
  const { credential } = await body(req, loginRequestSchema)
  const identity = await deps.verifyIdentity(credential)
  if (!identity) throw new HttpError(401, 'unauthorized')

  const email = normalizeEmail(identity.email)
  const invited = isAdminEmail(email, deps.config) || (await deps.repo.getInvitation(group.groupId, email))
  if (!invited) throw new HttpError(403, 'not_invited')

  const participant: ParticipantRecord = {
    groupId: group.groupId,
    participantId: participantIdFor(identity.subject),
    displayName: toDisplayName(identity.name),
    email,
    lastLoginAt: deps.now().toISOString(),
  }
  await deps.repo.saveParticipant(participant)

  const maxAge = deps.config.sessionMaxAgeSeconds
  const session = createSession(
    group.groupId,
    participant.participantId,
    deps.now().getTime() + maxAge * 1000,
    deps.config.sessionSecret,
  )
  return {
    body: await toMe(group, participant, deps),
    setCookie: sessionCookie(group.groupId, session, maxAge, deps.config),
  }
}

const logout: Handler = async (req, deps) => ({
  body: null,
  setCookie: sessionCookie(groupIdOf(req), '', 0, deps.config),
})

const getResults: Handler = async (req, deps) => {
  const group = await requireGroup(req, deps)
  await requireParticipant(req, group, deps)
  return { body: await resultsFor(group, deps) }
}

const getMe: Handler = async (req, deps) => {
  const group = await requireGroup(req, deps)
  const participant = await currentParticipant(req, group.groupId, deps)
  return { body: participant ? await toMe(group, participant, deps) : null }
}

const putVote: Handler = async (req, deps) => {
  const group = await requireGroup(req, deps)
  const participant = await requireParticipant(req, group, deps)
  if (isClosed(group, deps.now())) throw new HttpError(403, 'voting_closed')
  const input = await body(req, voteRequestSchema)

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const current = await deps.repo.getVote(group.groupId, participant.participantId)
    if (input.expectedVersion !== undefined && input.expectedVersion !== (current?.version ?? null)) {
      throw new HttpError(409, 'version_conflict')
    }
    try {
      await deps.repo.putVote(
        group.groupId,
        {
          participantId: participant.participantId,
          destination: input.destination,
          comment: input.comment,
          updatedAt: deps.now().toISOString(),
        },
        current?.version ?? null,
      )
      return { body: await toMe(group, participant, deps) }
    } catch (error) {
      if (!(error instanceof ConcurrencyError)) throw error
      // A client-supplied version makes the conflict the caller's to resolve, never ours.
      if (input.expectedVersion !== undefined) throw new HttpError(409, 'version_conflict')
    }
  }
  throw new HttpError(409, 'version_conflict')
}

const adminGet: Handler = async (req, deps) => {
  const group = await requireAdmin(req, deps)
  const [snapshot, invitations] = await Promise.all([
    deps.repo.getSnapshot(group.groupId),
    deps.repo.listInvitations(group.groupId),
  ])
  const voted = new Set(snapshot.votes.map((vote) => vote.participantId))
  const byEmail = new Map(snapshot.participants.map((p) => [p.email, p]))
  const view: AdminGroupView = {
    group: toGroupView(group, deps.now()),
    participants: snapshot.participants.length,
    totalVotes: snapshot.votes.length,
    invitations: invitations
      .map(({ email }) => {
        const participant = byEmail.get(email)
        const status: InvitationStatus = !participant
          ? 'pending'
          : voted.has(participant.participantId)
            ? 'voted'
            : 'joined'
        return { email, status, name: participant?.displayName ?? null }
      })
      .sort((a, b) => a.email.localeCompare(b.email)),
  }
  return { body: view }
}

const adminInvite: Handler = async (req, deps) => {
  const group = await requireAdmin(req, deps)
  const { emails } = await body(req, inviteRequestSchema)
  const unique = [...new Set(emails.map(normalizeEmail))]
  const invitedAt = deps.now().toISOString()
  await Promise.all(unique.map((email) => deps.repo.saveInvitation(group.groupId, { email, invitedAt })))
  return { body: { invited: unique.length } }
}

const adminUninvite: Handler = async (req, deps) => {
  const group = await requireAdmin(req, deps)
  const email = normalizeEmail((await body(req, removeInviteRequestSchema)).email)
  await deps.repo.deleteInvitation(group.groupId, email)
  const { participants } = await deps.repo.getSnapshot(group.groupId)
  const participant = participants.find((candidate) => candidate.email === email)
  if (participant) await deps.repo.removeParticipant(group.groupId, participant.participantId)
  return { body: { removed: email } }
}

const adminLock: Handler = async (req, deps) => {
  const group = await requireAdmin(req, deps)
  return { body: await updateStatus(group, { status: 'locked', votingClosesAt: group.votingClosesAt }, deps) }
}

const adminUnlock: Handler = async (req, deps) => {
  const group = await requireAdmin(req, deps)
  // An expired deadline would keep the poll closed despite the unlock, so it is cleared.
  const stillValid = group.votingClosesAt && new Date(group.votingClosesAt) > deps.now()
  return {
    body: await updateStatus(
      group,
      { status: 'open', votingClosesAt: stillValid ? group.votingClosesAt : null },
      deps,
    ),
  }
}

const adminDeadline: Handler = async (req, deps) => {
  const group = await requireAdmin(req, deps)
  const { votingClosesAt } = await body(req, deadlineRequestSchema)
  return { body: await updateStatus(group, { status: group.status, votingClosesAt }, deps) }
}

const adminReset: Handler = async (req, deps) => {
  const group = await requireAdmin(req, deps)
  const { confirm } = await body(req, resetRequestSchema)
  if (confirm !== group.groupId) throw new HttpError(400, 'bad_request')
  return { body: { deleted: await deps.repo.deleteVotes(group.groupId) } }
}

const adminRate: RateRule = { action: 'admin', limit: 30, windowSeconds: 600 }

// Admin routes live under `manage/` because the Functions host reserves every route starting with `admin`.

export const routes: Route[] = [
  { name: 'createGroup', method: 'POST', path: 'groups', handler: createGroup, rate: { action: 'create', limit: 5, windowSeconds: 3600 } },
  { name: 'login', method: 'POST', path: 'groups/{groupId}/login', handler: login, rate: { action: 'login', limit: 30, windowSeconds: 3600 } },
  { name: 'logout', method: 'POST', path: 'groups/{groupId}/logout', handler: logout },
  { name: 'getResults', method: 'GET', path: 'groups/{groupId}/results', handler: getResults },
  { name: 'getMe', method: 'GET', path: 'groups/{groupId}/me', handler: getMe },
  { name: 'putVote', method: 'PUT', path: 'groups/{groupId}/vote', handler: putVote, rate: { action: 'vote', limit: 40, windowSeconds: 600 } },
  { name: 'adminGet', method: 'GET', path: 'manage/groups/{groupId}', handler: adminGet, rate: adminRate },
  { name: 'adminInvite', method: 'POST', path: 'manage/groups/{groupId}/invitations', handler: adminInvite, rate: adminRate },
  { name: 'adminUninvite', method: 'POST', path: 'manage/groups/{groupId}/invitations/remove', handler: adminUninvite, rate: adminRate },
  { name: 'adminLock', method: 'POST', path: 'manage/groups/{groupId}/lock', handler: adminLock, rate: adminRate },
  { name: 'adminUnlock', method: 'POST', path: 'manage/groups/{groupId}/unlock', handler: adminUnlock, rate: adminRate },
  { name: 'adminDeadline', method: 'POST', path: 'manage/groups/{groupId}/deadline', handler: adminDeadline, rate: adminRate },
  { name: 'adminReset', method: 'POST', path: 'manage/groups/{groupId}/reset', handler: adminReset, rate: adminRate },
]

function corsHeaders(origin: string | null, config: Config): Record<string, string> {
  if (!origin || !config.allowedOrigins.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  }
}

async function enforceRateLimit(rule: RateRule, req: ApiRequest, deps: Deps) {
  const windowMs = rule.windowSeconds * 1000
  const windowStart = new Date(Math.floor(deps.now().getTime() / windowMs) * windowMs)
    .toISOString()
    .replace(/[^0-9]/g, '')
  const key = `${rule.action}_${anonymizeIp(clientIp(req.headers), deps.config.rateLimitSalt)}`
  try {
    const count = await deps.repo.incrementRateCounter(key, windowStart)
    if (count > rule.limit) throw new HttpError(429, 'rate_limited')
  } catch (error) {
    if (error instanceof HttpError) throw error
    // Availability of the vote matters more than the limiter for a private group poll.
    deps.log('rate limiter unavailable', error)
  }
}

/** Blocks cross-site browser writes: a foreign page can neither pass the Origin check nor preflight the header. */
function enforceCsrf(req: ApiRequest, config: Config) {
  const origin = req.headers.get('origin')
  if (origin && !config.allowedOrigins.includes(origin)) throw new HttpError(403, 'forbidden')
  if (req.headers.get('x-nsa-client') !== 'web') throw new HttpError(403, 'forbidden')
}

export async function execute(route: Route, req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...corsHeaders(req.headers.get('origin'), deps.config),
  }

  if (req.method === 'OPTIONS') {
    return {
      status: 204,
      headers: {
        ...headers,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-NSA-Client',
        'Access-Control-Max-Age': '86400',
      },
    }
  }

  try {
    if (route.method !== 'GET') enforceCsrf(req, deps.config)
    if (route.rate) await enforceRateLimit(route.rate, req, deps)
    const result = await route.handler(req, deps)
    if (result.setCookie) headers['Set-Cookie'] = result.setCookie
    return { status: result.status ?? 200, body: result.body ?? null, headers }
  } catch (error) {
    if (error instanceof HttpError) {
      return { status: error.status, body: { error: error.code }, headers }
    }
    deps.log(`unhandled error in ${route.name}`, error)
    return { status: 500, body: { error: 'internal' }, headers }
  }
}
