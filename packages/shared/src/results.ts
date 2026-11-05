import type { Destination, GroupView, PublicComment, ResultsView } from './voting'

export interface VoteRecord {
  participantId: string
  destination: Destination
  comment: string
  updatedAt: string
}

/** Malaysia takes the complement so the two displayed percentages always add up to 100. */
export function percentages(counts: Record<Destination, number>): Record<Destination, number> {
  const total = counts.thailand + counts.malaysia
  if (total === 0) return { thailand: 0, malaysia: 0 }
  const thailand = Math.round((counts.thailand / total) * 100)
  return { thailand, malaysia: 100 - thailand }
}

export function isClosed(
  group: { status: GroupView['status']; votingClosesAt: string | null },
  now: Date,
): boolean {
  if (group.status === 'locked') return true
  return group.votingClosesAt !== null && new Date(group.votingClosesAt) <= now
}

export function aggregateResults(
  group: GroupView,
  votes: VoteRecord[],
  names: ReadonlyMap<string, string>,
): ResultsView {
  const counts: Record<Destination, number> = { thailand: 0, malaysia: 0 }
  const comments: PublicComment[] = []

  for (const vote of votes) {
    // A vote without a participant can only come from a partially failed write: never count it.
    const name = names.get(vote.participantId)
    if (!name) continue
    counts[vote.destination] += 1
    if (vote.comment) {
      comments.push({
        name,
        destination: vote.destination,
        comment: vote.comment,
        updatedAt: vote.updatedAt,
      })
    }
  }

  comments.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const totalVotes = counts.thailand + counts.malaysia
  const tie = totalVotes > 0 && counts.thailand === counts.malaysia
  const winner: Destination | null =
    !group.closed || totalVotes === 0 || tie
      ? null
      : counts.thailand > counts.malaysia
        ? 'thailand'
        : 'malaysia'

  return {
    group,
    counts,
    percentages: percentages(counts),
    totalVotes,
    participants: names.size,
    comments,
    winner,
    tie,
  }
}
