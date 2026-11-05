import { describe, expect, it } from 'vitest'
import { aggregateResults, isClosed, percentages, type VoteRecord } from './results'
import { inviteRequestSchema, normalizeEmail, toDisplayName, voteRequestSchema, type GroupView } from './voting'

const open: GroupView = { groupId: 'abc123', title: 't', status: 'open', votingClosesAt: null, closed: false }
const closed: GroupView = { ...open, status: 'locked', closed: true }
const vote = (participantId: string, destination: VoteRecord['destination'], comment = ''): VoteRecord => ({
  participantId, destination, comment, updatedAt: '2026-01-01T00:00:00.000Z',
})
const names = new Map([['a', 'Ana'], ['b', 'Beto'], ['c', 'Cris']])

describe('percentages', () => {
  it('always sums to 100', () => {
    for (let t = 0; t <= 30; t += 1) {
      for (let m = 0; m <= 30; m += 1) {
        if (t + m === 0) continue
        const p = percentages({ thailand: t, malaysia: m })
        expect(p.thailand + p.malaysia).toBe(100)
      }
    }
  })
  it('is zero with no votes', () => {
    expect(percentages({ thailand: 0, malaysia: 0 })).toEqual({ thailand: 0, malaysia: 0 })
  })
})

describe('aggregateResults', () => {
  it('counts votes and hides the winner while open', () => {
    const result = aggregateResults(open, [vote('a', 'thailand'), vote('b', 'thailand'), vote('c', 'malaysia')], names)
    expect(result.counts).toEqual({ thailand: 2, malaysia: 1 })
    expect(result.percentages).toEqual({ thailand: 67, malaysia: 33 })
    expect(result.winner).toBeNull()
    expect(result.participants).toBe(3)
  })
  it('declares a winner once closed', () => {
    expect(aggregateResults(closed, [vote('a', 'malaysia')], names).winner).toBe('malaysia')
  })
  it('reports a tie without a winner', () => {
    const result = aggregateResults(closed, [vote('a', 'thailand'), vote('b', 'malaysia')], names)
    expect(result.tie).toBe(true)
    expect(result.winner).toBeNull()
  })
  it('ignores orphaned votes', () => {
    expect(aggregateResults(open, [vote('ghost', 'thailand')], names).totalVotes).toBe(0)
  })
  it('only exposes non-empty comments', () => {
    const result = aggregateResults(open, [vote('a', 'thailand', '¡Vamos!'), vote('b', 'malaysia')], names)
    expect(result.comments).toHaveLength(1)
    expect(result.comments[0]?.name).toBe('Ana')
  })
})

describe('isClosed', () => {
  const now = new Date('2027-01-10T00:00:00Z')
  it('respects lock and deadline', () => {
    expect(isClosed({ status: 'locked', votingClosesAt: null }, now)).toBe(true)
    expect(isClosed({ status: 'open', votingClosesAt: null }, now)).toBe(false)
    expect(isClosed({ status: 'open', votingClosesAt: '2027-01-09T00:00:00Z' }, now)).toBe(true)
    expect(isClosed({ status: 'open', votingClosesAt: '2027-01-11T00:00:00Z' }, now)).toBe(false)
  })
})

describe('validation', () => {
  it('treats Gmail variants as one mailbox', () => {
    expect(normalizeEmail(' Ana.Perez+viajes@GMAIL.com ')).toBe('anaperez@gmail.com')
    expect(normalizeEmail('anaperez@googlemail.com')).toBe('anaperez@gmail.com')
  })
  it('keeps other domains intact apart from case', () => {
    expect(normalizeEmail('Ana.Perez+x@Empresa.es')).toBe('ana.perez+x@empresa.es')
  })
  it('cleans display names from external accounts', () => {
    expect(toDisplayName('An\u0000a\nB')).toBe('An a B')
    expect(toDisplayName('x'.repeat(60))).toHaveLength(40)
    expect(toDisplayName('   ')).toBe('Viajero')
    expect(toDisplayName(undefined)).toBe('Viajero')
  })
  it('validates and limits invitations', () => {
    expect(inviteRequestSchema.safeParse({ emails: ['ana@example.com'] }).success).toBe(true)
    expect(inviteRequestSchema.safeParse({ emails: ['nope'] }).success).toBe(false)
    expect(inviteRequestSchema.safeParse({ emails: [] }).success).toBe(false)
    expect(inviteRequestSchema.safeParse({ emails: Array(51).fill('a@b.co') }).success).toBe(false)
  })
  it('rejects unknown destinations, long comments and extra fields', () => {
    expect(voteRequestSchema.safeParse({ destination: 'vietnam' }).success).toBe(false)
    expect(voteRequestSchema.safeParse({ destination: 'malaysia', comment: 'x'.repeat(281) }).success).toBe(false)
    expect(voteRequestSchema.safeParse({ destination: 'malaysia', participantId: 'x' }).success).toBe(false)
  })
  it('defaults the comment to empty', () => {
    expect(voteRequestSchema.parse({ destination: 'thailand' }).comment).toBe('')
  })
})
