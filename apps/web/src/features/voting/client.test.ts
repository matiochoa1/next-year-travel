import { beforeEach, describe, expect, it } from 'vitest'
import { createDemoClient, resolveClient, VotingError } from './client'
import { shareText } from './FinalReveal'
import { pollDelay, POLL_OFFSCREEN_MS, POLL_VISIBLE_MS } from './useVoting'

describe('pollDelay', () => {
  it('polls faster while the section is on screen', () => {
    expect(pollDelay(true, true)).toBe(POLL_VISIBLE_MS)
    expect(pollDelay(true, false)).toBe(POLL_OFFSCREEN_MS)
  })
  it('stops entirely in hidden tabs', () => {
    expect(pollDelay(false, true)).toBeNull()
  })
})

describe('demo client', () => {
  beforeEach(() => localStorage.clear())

  it('is what runs without backend configuration', () => {
    expect(resolveClient().mode).toBe('demo')
  })

  it('signs in and out', async () => {
    const client = createDemoClient()
    expect(await client.getMe()).toBeNull()
    expect((await client.signIn('Ana')).name).toBe('Ana')
    await client.signOut()
    expect(await client.getMe()).toBeNull()
  })

  it('stores, updates and aggregates a vote', async () => {
    const client = createDemoClient()
    await client.signIn('Ana')
    await client.vote({ destination: 'thailand', comment: '', expectedVersion: null })
    await client.vote({ destination: 'malaysia', comment: 'Mejor', expectedVersion: null })
    const results = await client.getResults()
    expect(results.counts).toEqual({ thailand: 0, malaysia: 1 })
    expect(results.percentages.malaysia).toBe(100)
    expect((await client.getMe())?.vote?.comment).toBe('Mejor')
  })

  it('refuses votes after the simulated close and reveals the winner', async () => {
    const client = createDemoClient()
    await client.signIn('Ana')
    await client.vote({ destination: 'thailand', comment: '', expectedVersion: null })
    client.setLocked(true)
    await expect(client.vote({ destination: 'malaysia', comment: '', expectedVersion: null })).rejects.toBeInstanceOf(VotingError)
    expect((await client.getResults()).winner).toBe('thailand')
  })
})

describe('shareText', () => {
  const base = { group: { groupId: 'x', title: '', status: 'locked', votingClosesAt: null, closed: true }, comments: [] } as const

  it('announces a winner', () => {
    const text = shareText({ ...base, comments: [], counts: { thailand: 3, malaysia: 1 }, percentages: { thailand: 75, malaysia: 25 }, totalVotes: 4, participants: 4, winner: 'thailand', tie: false })
    expect(text).toContain('Tailandia')
    expect(text).toContain('75%')
  })

  it('announces a tie', () => {
    const text = shareText({ ...base, comments: [], counts: { thailand: 2, malaysia: 2 }, percentages: { thailand: 50, malaysia: 50 }, totalVotes: 4, participants: 4, winner: null, tie: true })
    expect(text).toContain('empate')
  })
})
