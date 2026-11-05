import type {
  GroupRecord,
  GroupSnapshot,
  InvitationRecord,
  NewVote,
  ParticipantRecord,
  StoredVote,
  VotingRepository,
} from './repository'
import { AlreadyExistsError, ConcurrencyError } from './repository'

/** Used by unit/integration tests and the local dev server. Mirrors the Table Storage semantics. */
export class MemoryRepository implements VotingRepository {
  private groups = new Map<string, GroupRecord>()
  private participants = new Map<string, ParticipantRecord>()
  private invitations = new Map<string, InvitationRecord>()
  private votes = new Map<string, StoredVote>()
  private counters = new Map<string, number>()
  private sequence = 0

  private nextVersion = () => `v${(this.sequence += 1)}`

  async createGroup(group: Omit<GroupRecord, 'version'>) {
    if (this.groups.has(group.groupId)) throw new AlreadyExistsError()
    this.groups.set(group.groupId, { ...group, version: this.nextVersion() })
  }

  async getGroup(groupId: string) {
    return this.groups.get(groupId) ?? null
  }

  async updateGroup(
    groupId: string,
    patch: Pick<GroupRecord, 'status' | 'votingClosesAt'>,
    expectedVersion: string,
  ) {
    const group = this.groups.get(groupId)
    if (!group || group.version !== expectedVersion) throw new ConcurrencyError()
    this.groups.set(groupId, { ...group, ...patch, version: this.nextVersion() })
  }

  async saveParticipant(participant: ParticipantRecord) {
    this.participants.set(`${participant.groupId}|${participant.participantId}`, participant)
  }

  async getParticipant(groupId: string, participantId: string) {
    return this.participants.get(`${groupId}|${participantId}`) ?? null
  }

  async removeParticipant(groupId: string, participantId: string) {
    this.participants.delete(`${groupId}|${participantId}`)
    this.votes.delete(`${groupId}|${participantId}`)
  }

  async getInvitation(groupId: string, email: string) {
    return this.invitations.get(`${groupId}|${email}`) ?? null
  }

  async listInvitations(groupId: string) {
    return [...this.invitations.entries()]
      .filter(([key]) => key.startsWith(`${groupId}|`))
      .map(([, invitation]) => invitation)
  }

  async saveInvitation(groupId: string, invitation: InvitationRecord) {
    this.invitations.set(`${groupId}|${invitation.email}`, invitation)
  }

  async deleteInvitation(groupId: string, email: string) {
    this.invitations.delete(`${groupId}|${email}`)
  }

  async getSnapshot(groupId: string): Promise<GroupSnapshot> {
    const prefix = `${groupId}|`
    return {
      participants: [...this.participants.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([, { participantId, displayName, email }]) => ({ participantId, displayName, email })),
      votes: [...this.votes.entries()].filter(([key]) => key.startsWith(prefix)).map(([, v]) => v),
    }
  }

  async getVote(groupId: string, participantId: string) {
    return this.votes.get(`${groupId}|${participantId}`) ?? null
  }

  async putVote(groupId: string, vote: NewVote, expectedVersion: string | null) {
    const key = `${groupId}|${vote.participantId}`
    const current = this.votes.get(key)
    if ((current?.version ?? null) !== expectedVersion) throw new ConcurrencyError()
    const stored = { ...vote, version: this.nextVersion() }
    this.votes.set(key, stored)
    return stored
  }

  async deleteVotes(groupId: string) {
    let deleted = 0
    for (const key of [...this.votes.keys()]) {
      if (key.startsWith(`${groupId}|`)) {
        this.votes.delete(key)
        deleted += 1
      }
    }
    return deleted
  }

  async incrementRateCounter(key: string, windowStart: string) {
    const id = `${windowStart}|${key}`
    const count = (this.counters.get(id) ?? 0) + 1
    this.counters.set(id, count)
    return count
  }
}
