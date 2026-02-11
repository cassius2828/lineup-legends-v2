import mongoose from "mongoose";
import { type LineupDoc, LineupModel, RatingModel } from "~/server/models";
import { getVoteDelta } from "./utils";

// Legacy type aliases for backwards compatibility

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
