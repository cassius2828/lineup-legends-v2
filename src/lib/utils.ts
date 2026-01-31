import {
  Lineup,
  Rating,
  type ILineup,
  type IVote,
  type ICommentVote,
} from "~/server/models";
import type { LineupType, PopulatableField } from "./types";
import mongoose from "mongoose";

// Population fields for lineup queries
export const lineupPopulateFields = [
  { path: "pg", model: "Player" },
  { path: "sg", model: "Player" },
  { path: "sf", model: "Player" },
  { path: "pf", model: "Player" },
  { path: "c", model: "Player" },
  { path: "owner", model: "User" },
];

export const getIdString = (field: PopulatableField) => {
  switch (typeof field) {
    case "string":
      return field;
    case "object":
      if (field instanceof mongoose.Types.ObjectId) return field.toString();
      return field?._id?.toString();
    default:
      return null;
  }
};

// Helper to transform lineup for API response (rename populated fields)
// * we may not need this
export function transformLineup(lineup: ILineup | null) {
  if (!lineup) return null;

  // const obj = lineup.toObject() as LineupType;
  // this is stringifying everything. Is that what i want to do?
  // return {
  //   ...obj,
  //   id: obj._id?.toString(),
  //   pg: obj.pg?.toString(),
  //   sg: obj.sg?.toString(),
  //   sf: obj.sf?.toString(),
  //   pf: obj.pf?.toString(),
  //   c: obj.c?.toString(),
  //   owner: obj.owner?.toString(),
  //   // pg, sg, sf, pf, c, owner are already correct from virtuals
  // };
  return lineup;
}

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
  existingVote?: IVote | null,
): number {
  return getVoteDelta(type, existingVote?.type ?? null);
}

// Helper to calculate average rating
export async function recalculateAvgRating(lineupId: string) {
  const ratings = await Rating.aggregate<{
    _id: mongoose.Types.ObjectId;
    avgRating: number;
  }>([
    {
      $match: { lineupId: new mongoose.Types.ObjectId(lineupId) },
    },
    {
      $group: {
        _id: "$lineupId",
        avgRating: {
          $avg: "$value",
        },
      },
    },
  ]);

  const avgRating = ratings[0]?.avgRating ?? 0;
  await Lineup.findByIdAndUpdate(lineupId, { avgRating });
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
