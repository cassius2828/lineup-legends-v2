import { Lineup, Rating, Vote, type ILineup } from "~/server/models";
import type { LineupType, PopulatableField } from "./types";
import mongoose from "mongoose";

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
export async function recalculateTotalVotes(lineupId: string) {
  const votes = await Vote.aggregate<{ _id: null; total: number }>([
    { $match: { lineupId: new mongoose.Types.ObjectId(lineupId) } },
    {
      $group: {
        _id: null,
        total: {
          $sum: { $cond: [{ $eq: ["$type", "upvote"] }, 1, -1] },
        },
      },
    },
  ]);

  const total = votes[0]?.total ?? 0;
  await Lineup.findByIdAndUpdate(lineupId, { totalVotes: total });
  return total;
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
