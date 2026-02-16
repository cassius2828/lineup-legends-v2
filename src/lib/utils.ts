// Population fields for lineup queries
export const lineupPopulateFields = [
  { path: "players.pg", model: "Player" },
  { path: "players.sg", model: "Player" },
  { path: "players.sf", model: "Player" },
  { path: "players.pf", model: "Player" },
  { path: "players.c", model: "Player" },
  { path: "owner", model: "User" },
];

/**
 * Shared vote delta calculator - O(1) operation
 * Used by both lineup votes and comment votes
 *
 * @param newType - The vote type being cast
 * @param existingType - The user's current vote type (null if no existing vote)
 * @returns Delta to apply: +1/-1 for new votes, +2/-2 for switches, +1/-1 for removals
 */
export function getVoteDelta(
  newType: "upvote" | "downvote",
  existingType: "upvote" | "downvote" | null,
): number {
  if (!existingType) {
    // New vote
    return newType === "upvote" ? 1 : -1;
  }
  if (existingType === newType) {
    // Same vote type - removing vote (toggle off)
    return newType === "upvote" ? -1 : 1;
  }
  // Switching vote type (upvote -> downvote = -2, downvote -> upvote = +2)
  return newType === "upvote" ? 2 : -2;
}

// Helper to calculate total votes for lineup votes (uses IVote with type field)
export function incrementTotalVotes(
  type: "upvote" | "downvote",
  existingType: "upvote" | "downvote" | null,
): number {
  console.log("[incrementTotalVotes] type", type);
  console.log("[incrementTotalVotes] existingType", existingType);
  return getVoteDelta(type, existingType ?? null);
}
