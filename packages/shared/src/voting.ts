import { z } from 'zod'

export const DESTINATIONS = ['thailand', 'malaysia'] as const
export const destinationSchema = z.enum(DESTINATIONS)
export type Destination = z.infer<typeof destinationSchema>

export const NAME_MAX = 40
export const COMMENT_MAX = 280
export const MAX_INVITES_PER_REQUEST = 50

/** Control characters are removed so stored text can never break out of a single line. */
const CONTROL_CHARS = /\p{Cc}/gu
const collapse = (value: string) => value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim()

export const groupIdSchema = z.string().regex(/^[a-z0-9]{6,32}$/, 'invalid_group')

/** Names come from Google accounts, so they are cleaned and shortened rather than rejected. */
export const toDisplayName = (name: string | undefined) =>
  collapse(name ?? '').slice(0, NAME_MAX) || 'Viajero'

export const commentSchema = z
  .string()
  .transform(collapse)
  .pipe(z.string().max(COMMENT_MAX))

export const loginRequestSchema = z.strictObject({ credential: z.string().min(1).max(8192) })

const emailSchema = z.string().trim().pipe(z.email()).pipe(z.string().max(254))

export const inviteRequestSchema = z.strictObject({
  emails: z.array(emailSchema).min(1).max(MAX_INVITES_PER_REQUEST),
})

export const removeInviteRequestSchema = z.strictObject({ email: emailSchema })

export const voteRequestSchema = z.strictObject({
  destination: destinationSchema,
  comment: commentSchema.optional().default(''),
  /** Version last seen by this client; a stale value yields 409 instead of a silent overwrite. */
  expectedVersion: z.string().max(256).nullable().optional(),
})
export type VoteRequest = z.infer<typeof voteRequestSchema>

export const createGroupRequestSchema = z.strictObject({
  title: z.string().transform(collapse).pipe(z.string().min(3).max(80)),
  votingClosesAt: z.iso.datetime().nullable().optional(),
})
export type CreateGroupRequest = z.infer<typeof createGroupRequestSchema>

export const deadlineRequestSchema = z.strictObject({
  votingClosesAt: z.iso.datetime().nullable(),
})

export const resetRequestSchema = z.strictObject({
  /** Must literally be the group id: prevents accidental resets from a mistyped request. */
  confirm: z.string(),
})

/**
 * Canonical form used to match an invitation with a Google account. Gmail ignores dots and
 * "+tags", so "Ana.Perez+viajes@gmail.com" and "anaperez@gmail.com" are one mailbox.
 */
export function normalizeEmail(email: string): string {
  const [local = '', domain = ''] = email.trim().toLowerCase().split('@')
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${(local.split('+')[0] ?? '').replaceAll('.', '')}@gmail.com`
  }
  return `${local}@${domain}`
}

export type GroupStatus = 'open' | 'locked'

export interface GroupView {
  groupId: string
  title: string
  status: GroupStatus
  votingClosesAt: string | null
  /** True when locked by the admin or the deadline has passed. */
  closed: boolean
}

export interface PublicComment {
  name: string
  destination: Destination
  comment: string
  updatedAt: string
}

export interface ResultsView {
  group: GroupView
  counts: Record<Destination, number>
  percentages: Record<Destination, number>
  totalVotes: number
  participants: number
  comments: PublicComment[]
  /** Only populated once voting is closed; null means a tie or no votes. */
  winner: Destination | null
  tie: boolean
}

export interface MeView {
  participantId: string
  name: string
  email: string
  isAdmin: boolean
  vote: { destination: Destination; comment: string; updatedAt: string; version: string } | null
}

export type InvitationStatus = 'pending' | 'joined' | 'voted'

export interface InvitationView {
  email: string
  status: InvitationStatus
  name: string | null
}

export interface AdminGroupView {
  group: GroupView
  invitations: InvitationView[]
  participants: number
  totalVotes: number
}

export const BUDGET_CATEGORIES = [
  'flights', 'domestic', 'ferries', 'lodging', 'food', 'tours', 'insurance', 'contingency',
] as const
export const budgetCategorySchema = z.enum(BUDGET_CATEGORIES)
export type BudgetCategory = z.infer<typeof budgetCategorySchema>

export const BUDGET_NOTE_MAX = 140
export const BUDGET_AMOUNT_MAX = 20000

const budgetAmountSchema = z.number().int().min(0).max(BUDGET_AMOUNT_MAX)

const budgetItemKey = { country: destinationSchema, category: budgetCategorySchema }

export const budgetItemRequestSchema = z
  .strictObject({
    ...budgetItemKey,
    low: budgetAmountSchema,
    high: budgetAmountSchema,
    note: commentSchema.pipe(z.string().max(BUDGET_NOTE_MAX)).optional().default(''),
    /** Version this edit started from; null when the item still has its initial value. */
    expectedVersion: z.string().max(256).nullable(),
  })
  .refine(({ low, high }) => low <= high)

export const budgetResetRequestSchema = z.strictObject(budgetItemKey)

/** A price the group has replaced with real data. Untouched items keep the editorial default. */
export interface BudgetItemView {
  country: Destination
  category: BudgetCategory
  low: number
  high: number
  note: string
  updatedBy: string
  updatedAt: string
  version: string
}

export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'not_invited'
  | 'voting_closed'
  | 'version_conflict'
  | 'rate_limited'
  | 'internal'

export interface ApiError {
  error: ApiErrorCode
}
