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
  { path: "pgId", model: "Player" },
  { path: "sgId", model: "Player" },
  { path: "sfId", model: "Player" },
  { path: "pfId", model: "Player" },
  { path: "cId", model: "Player" },
  { path: "ownerId", model: "User" },
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
export function transformLineup(lineup: ILineup | null) {
  if (!lineup) return null;

  const obj = lineup.toObject() as LineupType;

  return {
    ...obj,
    id: obj._id?.toString(),
    pgId: obj.pgId?.toString(),
    sgId: obj.sgId?.toString(),
    sfId: obj.sfId?.toString(),
    pfId: obj.pfId?.toString(),
    cId: obj.cId?.toString(),
    ownerId: obj.ownerId?.toString(),
    // pg, sg, sf, pf, c, owner are already correct from virtuals
  };
}

// Helper to calculate total votes
export async function incrementTotalVotes(
  type: "upvote" | "downvote",
  existingVote?: IVote | null,
) {
  let voteDelta = 0;
  if (!existingVote) {
    voteDelta = type === "upvote" ? 1 : -1;
  } else if (existingVote.type === type) {
    voteDelta = type === "upvote" ? -1 : 1;
  } else {
    voteDelta = type === "upvote" ? 2 : -2;
  }
  return voteDelta;
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
 * Handles voting logic: adding new votes, toggling existing votes, and recalculating totals
 */
export function processCommentVote(
  votes: ICommentVote[],
  userId: string,
  type: "upvote" | "downvote",
): { votes: ICommentVote[]; totalVotes: number } {
  const existingVoteIndex = votes.findIndex(
    (v) => v.userId.toString() === userId,
  );

  if (existingVoteIndex !== -1) {
    const existingVote = votes[existingVoteIndex]!;
    const isUpvote = type === "upvote";
    const wasUpvote = existingVote.upvote;

    if ((isUpvote && wasUpvote) || (!isUpvote && existingVote.downvote)) {
      // Same vote type - remove the vote
      votes.splice(existingVoteIndex, 1);
    } else {
      // Different vote type - toggle
      existingVote.upvote = isUpvote;
      existingVote.downvote = !isUpvote;
    }
  } else {
    // No existing vote - create new
    votes.push({
      userId: new mongoose.Types.ObjectId(userId),
      upvote: type === "upvote",
      downvote: type === "downvote",
    } as unknown as ICommentVote);
  }

  // Recalculate total votes
  let totalVotes = 0;
  for (const vote of votes) {
    if (vote.upvote) totalVotes += 1;
    if (vote.downvote) totalVotes -= 1;
  }

  return { votes, totalVotes };
}
