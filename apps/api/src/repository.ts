import type { BudgetCategory, BudgetItemView, Destination, GroupStatus } from '@nsa/shared'

export class ConcurrencyError extends Error {}
export class AlreadyExistsError extends Error {}

export interface GroupRecord {
  groupId: string
  title: string
  createdAt: string
  status: GroupStatus
  votingClosesAt: string | null
  version: string
}

export interface ParticipantRecord {
  groupId: string
  participantId: string
  displayName: string
  email: string
  lastLoginAt: string
}

export interface InvitationRecord {
  /** Normalised address: the key that a Google account is matched against. */
  email: string
  invitedAt: string
}

export interface StoredVote {
  participantId: string
  destination: Destination
  comment: string
  updatedAt: string
  version: string
}

export type NewVote = Omit<StoredVote, 'version'>
export type NewBudgetItem = Omit<BudgetItemView, 'version'>

export interface GroupSnapshot {
  participants: Array<Pick<ParticipantRecord, 'participantId' | 'displayName' | 'email'>>
  votes: StoredVote[]
}

export interface VotingRepository {
  createGroup(group: Omit<GroupRecord, 'version'>): Promise<void>
  getGroup(groupId: string): Promise<GroupRecord | null>
  /** Conditional on `expectedVersion`; throws ConcurrencyError when stale. */
  updateGroup(
    groupId: string,
    patch: Pick<GroupRecord, 'status' | 'votingClosesAt'>,
    expectedVersion: string,
  ): Promise<void>
  /** Creates the participant or refreshes their details: logging in again is idempotent. */
  saveParticipant(participant: ParticipantRecord): Promise<void>
  getParticipant(groupId: string, participantId: string): Promise<ParticipantRecord | null>
  /** Deletes the participant together with their vote. */
  removeParticipant(groupId: string, participantId: string): Promise<void>
  getInvitation(groupId: string, email: string): Promise<InvitationRecord | null>
  listInvitations(groupId: string): Promise<InvitationRecord[]>
  saveInvitation(groupId: string, invitation: InvitationRecord): Promise<void>
  deleteInvitation(groupId: string, email: string): Promise<void>
  getSnapshot(groupId: string): Promise<GroupSnapshot>
  getVote(groupId: string, participantId: string): Promise<StoredVote | null>
  /**
   * `expectedVersion === null` means the vote must not exist yet. Throws ConcurrencyError when
   * another write won the race, which is what guarantees one active vote per participant.
   */
  putVote(groupId: string, vote: NewVote, expectedVersion: string | null): Promise<StoredVote>
  deleteVotes(groupId: string): Promise<number>
  listBudgetItems(groupId: string): Promise<BudgetItemView[]>
  /** Same conditional semantics as putVote, so two friends cannot silently overwrite each other. */
  putBudgetItem(groupId: string, item: NewBudgetItem, expectedVersion: string | null): Promise<BudgetItemView>
  deleteBudgetItem(groupId: string, country: Destination, category: BudgetCategory): Promise<void>
  /** Increments a counter for the window and returns the new count. Best-effort by design. */
  incrementRateCounter(key: string, windowStart: string): Promise<number>
}
