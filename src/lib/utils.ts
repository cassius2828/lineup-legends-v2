import type { Types } from "mongoose";
import mongoose from "mongoose";
import {
  type LineupDoc,
  LineupModel,
  RatingModel
} from "~/server/models";

// Legacy type aliases for backwards compatibility
// TODO: These should be migrated to use the proper model types
type ILineup = LineupDoc;
interface ICommentVote {
  userId: Types.ObjectId;
  type: "upvote" | "downvote";
}

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
  return getVoteDelta(type, existingType ?? null);
}

// Helper to calculate average rating
export async function recalculateAvgRating(lineup: LineupDoc) {
  const ratings = await RatingModel.aggregate<{
    id: string;
    avgRating: number;
  }>([
    {
      $match: { lineup: lineup._id.toString() },
    },
    {
      $group: {
        _id: "$lineup",
        avgRating: {
          $avg: "$value",
        },
      },
    },
  ]);

  const avgRating = ratings[0]?.avgRating ?? 0;
  await LineupModel.findByIdAndUpdate(lineup._id, { avgRating });
  return avgRating;
}

/**
 * Helper to process comment/thread votes
 * Uses O(1) delta calculation instead of O(n) recalculation
 *
 * @param votes - The votes array to modify
 * @param userId - The user casting the vote
 * @param type - The vote type being cast
 * @param currentTotalVotes - Current total votes (avoids recalculating)
 * @returns Updated votes array and new total votes
 */
export function processCommentVote(
  votes: ICommentVote[],
  userId: string,
  type: "upvote" | "downvote",
  currentTotalVotes: number,
): { votes: ICommentVote[]; totalVotes: number } {
  const existingVoteIndex = votes.findIndex(
    (v) => v.userId.toString() === userId,
  );
  const existingVote =
    existingVoteIndex !== -1 ? votes[existingVoteIndex] : undefined;

  // Calculate delta using shared O(1) helper
  const voteDelta = getVoteDelta(type, existingVote?.type ?? null);

  // Update votes array
  if (existingVoteIndex !== -1 && existingVote) {
    if (existingVote.type === type) {
      // Same vote type - remove the vote (toggle off)
      votes.splice(existingVoteIndex, 1);
    } else {
      // Different vote type - switch
      existingVote.type = type;
    }
  } else {
    // No existing vote - create new
    votes.push({
      userId: new mongoose.Types.ObjectId(userId),
      type,
    } as unknown as ICommentVote);
  }

  return { votes, totalVotes: currentTotalVotes + voteDelta };
}
