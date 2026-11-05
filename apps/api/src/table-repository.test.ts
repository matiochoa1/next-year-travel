import { TableClient } from '@azure/data-tables'
import { spawn, type ChildProcess } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MemoryRepository } from './memory-repository'
import { ConcurrencyError, type VotingRepository } from './repository'
import { TableRepository } from './table-repository'

const ACCOUNT_KEY =
  'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw=='

const freePort = () =>
  new Promise<number>((resolve) => {
    const server = createServer().listen(0, () => {
      const { port } = server.address() as { port: number }
      server.close(() => resolve(port))
    })
  })

let azurite: ChildProcess | undefined
let workdir: string | undefined
let tableRepo: TableRepository

/** Real Table protocol via Azurite (local emulator): covers ETags and transactions with no cloud. */
beforeAll(async () => {
  const port = await freePort()
  workdir = mkdtempSync(path.join(tmpdir(), 'nsa-azurite-'))
  const bin = createRequire(import.meta.url).resolve('azurite/dist/src/azurite.js')
  const tableBin = path.join(path.dirname(bin), 'table', 'main.js')
  azurite = spawn(process.execPath, [tableBin, '--tablePort', String(port), '--location', workdir, '--silent', '--skipApiVersionCheck'], {
    stdio: 'ignore',
  })
  const connection = `DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=${ACCOUNT_KEY};TableEndpoint=http://127.0.0.1:${port}/devstoreaccount1;`
  const client = TableClient.fromConnectionString(connection, 'nsatest', { allowInsecureConnection: true })
  for (let attempt = 0; ; attempt += 1) {
    try {
      await client.createTable()
      break
    } catch (error) {
      if (attempt > 40) throw error
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
  }
  tableRepo = new TableRepository(client)
}, 20_000)

afterAll(() => {
  azurite?.kill()
  if (workdir) rmSync(workdir, { recursive: true, force: true })
})

const participant = (groupId: string, participantId: string, displayName: string) => ({
  groupId,
  participantId,
  displayName,
  email: `${displayName.toLowerCase()}@example.com`,
  lastLoginAt: '2026-01-01T00:00:00.000Z',
})
const vote = (participantId: string, destination: 'thailand' | 'malaysia', comment = '') => ({
  participantId,
  destination,
  comment,
  updatedAt: '2026-01-01T00:00:00.000Z',
})

let counter = 0
async function seededGroup(repo: VotingRepository) {
  const groupId = `grp${(counter += 1)}abc`
  await repo.createGroup({
    groupId,
    title: 'Grupo',
    createdAt: '2026-01-01T00:00:00.000Z',
    status: 'open',
    votingClosesAt: null,
  })
  return groupId
}

// The memory adapter backs the API tests, so it must behave exactly like Table Storage.
describe.each([
  ['TableRepository (Azurite)', () => tableRepo as VotingRepository],
  ['MemoryRepository', () => new MemoryRepository() as VotingRepository],
])('%s', (_name, getRepo) => {
  it('round-trips a group and survives nullable fields', async () => {
    const repo = getRepo()
    const groupId = await seededGroup(repo)
    expect(await repo.getGroup(groupId)).toMatchObject({ groupId, status: 'open', votingClosesAt: null })
    expect(await repo.getGroup('missing1')).toBeNull()
  })

  it('rejects a stale group update', async () => {
    const repo = getRepo()
    const groupId = await seededGroup(repo)
    const group = await repo.getGroup(groupId)
    await repo.updateGroup(groupId, { status: 'locked', votingClosesAt: '2027-01-01T00:00:00.000Z' }, group!.version)
    expect(await repo.getGroup(groupId)).toMatchObject({ status: 'locked', votingClosesAt: '2027-01-01T00:00:00.000Z' })
    await expect(
      repo.updateGroup(groupId, { status: 'open', votingClosesAt: null }, group!.version),
    ).rejects.toBeInstanceOf(ConcurrencyError)
  })

  it('saves participants idempotently and refreshes their details', async () => {
    const repo = getRepo()
    const groupId = await seededGroup(repo)
    await repo.saveParticipant(participant(groupId, 'a'.repeat(32), 'Ana'))
    await repo.saveParticipant({ ...participant(groupId, 'a'.repeat(32), 'Ana'), displayName: 'Ana María' })
    expect((await repo.getSnapshot(groupId)).participants).toEqual([
      { participantId: 'a'.repeat(32), displayName: 'Ana María', email: 'ana@example.com' },
    ])
    expect(await repo.getParticipant(groupId, 'a'.repeat(32))).toMatchObject({ displayName: 'Ana María' })
  })

  it('stores, lists and deletes invitations', async () => {
    const repo = getRepo()
    const groupId = await seededGroup(repo)
    const invitation = { email: 'ana@example.com', invitedAt: '2026-01-01T00:00:00.000Z' }
    expect(await repo.getInvitation(groupId, invitation.email)).toBeNull()
    await repo.saveInvitation(groupId, invitation)
    await repo.saveInvitation(groupId, invitation)
    expect(await repo.getInvitation(groupId, invitation.email)).toEqual(invitation)
    expect(await repo.listInvitations(groupId)).toEqual([invitation])
    await repo.deleteInvitation(groupId, invitation.email)
    await repo.deleteInvitation(groupId, invitation.email)
    expect(await repo.listInvitations(groupId)).toEqual([])
  })

  it('removes a participant with their vote, even if already gone', async () => {
    const repo = getRepo()
    const groupId = await seededGroup(repo)
    const id = 'e'.repeat(32)
    await repo.saveParticipant(participant(groupId, id, 'Eva'))
    await repo.putVote(groupId, vote(id, 'thailand'), null)
    await repo.removeParticipant(groupId, id)
    await repo.removeParticipant(groupId, id)
    expect(await repo.getParticipant(groupId, id)).toBeNull()
    expect((await repo.getSnapshot(groupId)).votes).toHaveLength(0)
  })

  it('creates once and updates only with the current version', async () => {
    const repo = getRepo()
    const groupId = await seededGroup(repo)
    const created = await repo.putVote(groupId, vote('p1', 'thailand', 'Hola'), null)
    await expect(repo.putVote(groupId, vote('p1', 'malaysia'), null)).rejects.toBeInstanceOf(ConcurrencyError)
    const updated = await repo.putVote(groupId, vote('p1', 'malaysia'), created.version)
    expect(updated.version).not.toBe(created.version)
    await expect(repo.putVote(groupId, vote('p1', 'thailand'), created.version)).rejects.toBeInstanceOf(ConcurrencyError)
    expect(await repo.getVote(groupId, 'p1')).toMatchObject({ destination: 'malaysia', version: updated.version })
  })

  it('lets exactly one of several conflicting updates win', async () => {
    const repo = getRepo()
    const groupId = await seededGroup(repo)
    const { version } = await repo.putVote(groupId, vote('p1', 'thailand'), null)
    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, () => repo.putVote(groupId, vote('p1', 'malaysia'), version)),
    )
    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1)
  })

  it('keeps groups isolated and deletes only votes on reset', async () => {
    const repo = getRepo()
    const [one, two] = [await seededGroup(repo), await seededGroup(repo)]
    await repo.saveParticipant(participant(one, 'c'.repeat(32), 'Cris'))
    await repo.putVote(one, vote('c'.repeat(32), 'thailand'), null)
    await repo.putVote(two, vote('p9', 'malaysia'), null)
    expect(await repo.deleteVotes(one)).toBe(1)
    expect((await repo.getSnapshot(one)).votes).toHaveLength(0)
    expect((await repo.getSnapshot(one)).participants).toHaveLength(1)
    expect((await repo.getSnapshot(two)).votes).toHaveLength(1)
  })

  it('handles more votes than a single transaction allows', async () => {
    const repo = getRepo()
    const groupId = await seededGroup(repo)
    await Promise.all(Array.from({ length: 105 }, (_, i) => repo.putVote(groupId, vote(`p${i}`, 'thailand'), null)))
    expect(await repo.deleteVotes(groupId)).toBe(105)
  })

  it('counts rate-limit hits per window', async () => {
    const repo = getRepo()
    const key = `vote_${groupKey()}`
    expect(await repo.incrementRateCounter(key, '20260101000000000')).toBe(1)
    expect(await repo.incrementRateCounter(key, '20260101000000000')).toBe(2)
    expect(await repo.incrementRateCounter(key, '20260101001000000')).toBe(1)
  })

})

function groupKey() {
  return Math.random().toString(36).slice(2)
}
