import { odata, RestError, TableClient } from '@azure/data-tables'
import {
  budgetCategorySchema,
  destinationSchema,
  type BudgetCategory,
  type BudgetItemView,
  type Destination,
  type GroupStatus,
} from '@nsa/shared'
import { hashToken } from './crypto'
import {
  AlreadyExistsError,
  ConcurrencyError,
  type GroupRecord,
  type GroupSnapshot,
  type InvitationRecord,
  type NewBudgetItem,
  type NewVote,
  type ParticipantRecord,
  type StoredVote,
  type VotingRepository,
} from './repository'

/*
 * Single-table design. Each group is one partition, so a results read is one partition query.
 *
 *   PartitionKey   RowKey              Entity
 *   <groupId>      group               TravelGroup
 *   <groupId>      p_<participantId>   Participant
 *   <groupId>      i_<sha256(email)>   Invitation
 *   <groupId>      v_<participantId>   Vote (one row per participant = one active vote)
 *   <groupId>      b_<country>_<cat>   Budget item edited by the group
 *   rl_<window>    <key>               Rate-limit counter
 */
const GROUP_ROW = 'group'
const participantRow = (id: string) => `p_${id}`
const invitationRow = (email: string) => `i_${hashToken(email)}`
const voteRow = (id: string) => `v_${id}`
const budgetRow = (country: string, category: string) => `b_${country}_${category}`

interface GroupEntity {
  title: string
  createdAt: string
  status: string
  votingClosesAt?: string
}

interface ParticipantEntity {
  displayName: string
  email: string
  lastLoginAt: string
}

interface InvitationEntity {
  email: string
  invitedAt: string
}

interface VoteEntity {
  destination: string
  comment?: string
  updatedAt: string
}

interface BudgetEntity {
  country: string
  category: string
  low: number
  high: number
  note?: string
  updatedBy: string
  updatedAt: string
}

const statusOf = (error: unknown) => (error instanceof RestError ? error.statusCode : undefined)
const requireEtag = (etag: string | undefined) => {
  if (!etag) throw new Error('Table response did not include an ETag')
  return etag
}

export class TableRepository implements VotingRepository {
  constructor(private readonly client: TableClient) {}

  private async read<T extends object>(partition: string, row: string) {
    try {
      return await this.client.getEntity<T>(partition, row)
    } catch (error) {
      if (statusOf(error) === 404) return null
      throw error
    }
  }

  async createGroup(group: Omit<GroupRecord, 'version'>) {
    try {
      await this.client.createEntity({
        partitionKey: group.groupId,
        rowKey: GROUP_ROW,
        title: group.title,
        createdAt: group.createdAt,
        status: group.status,
        votingClosesAt: group.votingClosesAt ?? undefined,
      })
    } catch (error) {
      if (statusOf(error) === 409) throw new AlreadyExistsError()
      throw error
    }
  }

  async getGroup(groupId: string): Promise<GroupRecord | null> {
    const entity = await this.read<GroupEntity>(groupId, GROUP_ROW)
    if (!entity) return null
    return {
      groupId,
      title: entity.title,
      createdAt: entity.createdAt,
      status: entity.status as GroupStatus,
      votingClosesAt: entity.votingClosesAt ?? null,
      version: requireEtag(entity.etag),
    }
  }

  async updateGroup(
    groupId: string,
    patch: Pick<GroupRecord, 'status' | 'votingClosesAt'>,
    expectedVersion: string,
  ) {
    const current = await this.getGroup(groupId)
    if (!current) throw new ConcurrencyError()
    try {
      await this.client.updateEntity(
        {
          partitionKey: groupId,
          rowKey: GROUP_ROW,
          title: current.title,
          createdAt: current.createdAt,
          status: patch.status,
          votingClosesAt: patch.votingClosesAt ?? undefined,
        },
        'Replace',
        { etag: expectedVersion },
      )
    } catch (error) {
      if (statusOf(error) === 412) throw new ConcurrencyError()
      throw error
    }
  }

  async saveParticipant(participant: ParticipantRecord) {
    await this.client.upsertEntity(
      {
        partitionKey: participant.groupId,
        rowKey: participantRow(participant.participantId),
        displayName: participant.displayName,
        email: participant.email,
        lastLoginAt: participant.lastLoginAt,
      },
      'Replace',
    )
  }

  async getParticipant(groupId: string, participantId: string): Promise<ParticipantRecord | null> {
    const entity = await this.read<ParticipantEntity>(groupId, participantRow(participantId))
    if (!entity) return null
    return {
      groupId,
      participantId,
      displayName: entity.displayName,
      email: entity.email,
      lastLoginAt: entity.lastLoginAt,
    }
  }

  private async deleteIfPresent(partition: string, row: string) {
    try {
      await this.client.deleteEntity(partition, row)
    } catch (error) {
      if (statusOf(error) !== 404) throw error
    }
  }

  async removeParticipant(groupId: string, participantId: string) {
    await this.deleteIfPresent(groupId, voteRow(participantId))
    await this.deleteIfPresent(groupId, participantRow(participantId))
  }

  async getInvitation(groupId: string, email: string): Promise<InvitationRecord | null> {
    const entity = await this.read<InvitationEntity>(groupId, invitationRow(email))
    return entity && { email: entity.email, invitedAt: entity.invitedAt }
  }

  async listInvitations(groupId: string) {
    const invitations: InvitationRecord[] = []
    const entities = this.client.listEntities<InvitationEntity>({
      queryOptions: { filter: odata`PartitionKey eq ${groupId} and RowKey ge 'i_' and RowKey lt 'i~'` },
    })
    for await (const entity of entities) invitations.push({ email: entity.email, invitedAt: entity.invitedAt })
    return invitations
  }

  async saveInvitation(groupId: string, invitation: InvitationRecord) {
    await this.client.upsertEntity(
      { partitionKey: groupId, rowKey: invitationRow(invitation.email), ...invitation },
      'Replace',
    )
  }

  async deleteInvitation(groupId: string, email: string) {
    await this.deleteIfPresent(groupId, invitationRow(email))
  }

  async getSnapshot(groupId: string): Promise<GroupSnapshot> {
    const snapshot: GroupSnapshot = { participants: [], votes: [] }
    const entities = this.client.listEntities<ParticipantEntity & VoteEntity>({
      queryOptions: {
        filter: odata`PartitionKey eq ${groupId}`,
        select: ['RowKey', 'displayName', 'email', 'destination', 'comment', 'updatedAt'],
      },
    })
    for await (const entity of entities) {
      const rowKey = entity.rowKey ?? ''
      if (rowKey.startsWith('p_')) {
        snapshot.participants.push({ participantId: rowKey.slice(2), displayName: entity.displayName, email: entity.email })
      } else if (rowKey.startsWith('v_')) {
        snapshot.votes.push(toVote(rowKey.slice(2), entity))
      }
    }
    return snapshot
  }

  async getVote(groupId: string, participantId: string) {
    const entity = await this.read<VoteEntity>(groupId, voteRow(participantId))
    return entity ? toVote(participantId, entity) : null
  }

  async putVote(groupId: string, vote: NewVote, expectedVersion: string | null): Promise<StoredVote> {
    const entity = {
      partitionKey: groupId,
      rowKey: voteRow(vote.participantId),
      destination: vote.destination,
      comment: vote.comment,
      updatedAt: vote.updatedAt,
    }
    try {
      const response =
        expectedVersion === null
          ? await this.client.createEntity(entity)
          : await this.client.updateEntity(entity, 'Replace', { etag: expectedVersion })
      return { ...vote, version: requireEtag(response.etag) }
    } catch (error) {
      const status = statusOf(error)
      if (status === 409 || status === 412 || (status === 404 && expectedVersion !== null)) {
        throw new ConcurrencyError()
      }
      throw error
    }
  }

  async deleteVotes(groupId: string) {
    const rowKeys: string[] = []
    const entities = this.client.listEntities({
      queryOptions: {
        filter: odata`PartitionKey eq ${groupId} and RowKey ge 'v_' and RowKey lt 'v~'`,
        select: ['RowKey'],
      },
    })
    for await (const entity of entities) if (entity.rowKey) rowKeys.push(entity.rowKey)
    // Entity-group transactions are capped at 100 operations.
    for (let i = 0; i < rowKeys.length; i += 100) {
      await this.client.submitTransaction(
        rowKeys.slice(i, i + 100).map((rowKey) => ['delete', { partitionKey: groupId, rowKey }]),
      )
    }
    return rowKeys.length
  }

  async listBudgetItems(groupId: string) {
    const items: BudgetItemView[] = []
    const entities = this.client.listEntities<BudgetEntity>({
      queryOptions: { filter: odata`PartitionKey eq ${groupId} and RowKey ge 'b_' and RowKey lt 'b~'` },
    })
    for await (const entity of entities) {
      items.push({
        country: destinationSchema.parse(entity.country),
        category: budgetCategorySchema.parse(entity.category),
        low: entity.low,
        high: entity.high,
        note: entity.note ?? '',
        updatedBy: entity.updatedBy,
        updatedAt: entity.updatedAt,
        version: requireEtag(entity.etag),
      })
    }
    return items
  }

  async putBudgetItem(groupId: string, item: NewBudgetItem, expectedVersion: string | null) {
    const entity = { partitionKey: groupId, rowKey: budgetRow(item.country, item.category), ...item }
    try {
      const response =
        expectedVersion === null
          ? await this.client.createEntity(entity)
          : await this.client.updateEntity(entity, 'Replace', { etag: expectedVersion })
      return { ...item, version: requireEtag(response.etag) }
    } catch (error) {
      const status = statusOf(error)
      if (status === 409 || status === 412 || (status === 404 && expectedVersion !== null)) {
        throw new ConcurrencyError()
      }
      throw error
    }
  }

  async deleteBudgetItem(groupId: string, country: Destination, category: BudgetCategory) {
    await this.deleteIfPresent(groupId, budgetRow(country, category))
  }

  async incrementRateCounter(key: string, windowStart: string) {
    const partitionKey = `rl_${windowStart}`
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await this.read<{ count: number }>(partitionKey, key)
      try {
        if (!current) {
          await this.client.createEntity({ partitionKey, rowKey: key, count: 1 })
          return 1
        }
        const count = current.count + 1
        await this.client.updateEntity({ partitionKey, rowKey: key, count }, 'Replace', {
          etag: requireEtag(current.etag),
        })
        return count
      } catch (error) {
        const status = statusOf(error)
        if (status !== 409 && status !== 412) throw error
      }
    }
    // Sustained contention on one counter is itself a signal of abuse: treat it as exhausted.
    return Number.MAX_SAFE_INTEGER
  }
}

function toVote(participantId: string, entity: VoteEntity & { etag?: string }): StoredVote {
  return {
    participantId,
    destination: destinationSchema.parse(entity.destination),
    comment: entity.comment ?? '',
    updatedAt: entity.updatedAt,
    version: requireEtag(entity.etag),
  }
}
