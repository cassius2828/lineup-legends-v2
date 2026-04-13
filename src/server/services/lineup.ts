import mongoose from "mongoose";
import type { SortOrder } from "mongoose";
import { endOfDay, startOfDay } from "date-fns";
import type { LineupFilterInput } from "~/server/api/schemas/lineup-filter";
import { LineupModel } from "~/server/models";
import { lineupPopulateFields } from "~/server/lib/lineup-queries";
import { populated } from "~/server/api/schemas/output";

type Filter = Record<string, unknown>;

const RATING_SORTS = new Set(["highest-rated", "most-rated"]);

function isRatingSort(sort?: string): boolean {
  return RATING_SORTS.has(sort ?? "");
}

export function buildLineupSort(sort?: string): Record<string, SortOrder> {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };
    case "highest-rated":
      return { avgRating: -1, _id: -1 };
    case "most-rated":
      return { ratingCount: -1, _id: -1 };
    default:
      return { createdAt: -1 };
  }
}

export function buildLineupFilter(
  input: Pick<
    LineupFilterInput,
    "dateFrom" | "dateTo" | "minRating" | "filterUserId"
  >,
  base: Filter = {},
): Filter {
  const filter: Filter = { ...base };

  if (input.dateFrom || input.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (input.dateFrom) createdAt.$gte = startOfDay(input.dateFrom);
    if (input.dateTo) createdAt.$lte = endOfDay(input.dateTo);
    filter.createdAt = { ...(filter.createdAt as object), ...createdAt };
  }

  if (input.minRating != null) {
    filter.avgRating = { $gte: input.minRating };
  }

  if (input.filterUserId) {
    filter.owner = new mongoose.Types.ObjectId(input.filterUserId);
  }

  return filter;
}

export function applyCursor(
  filter: Filter,
  cursor: string | undefined,
  sort: string | undefined,
): Filter {
  if (!cursor) return filter;

  if (isRatingSort(sort)) return filter;

  const id = new mongoose.Types.ObjectId(cursor);

  if (sort === "oldest") {
    return { ...filter, _id: { $gt: id } };
  }
  return { ...filter, _id: { $lt: id } };
}

/**
 * Shared paginated query: find → sort → limit → populate → slice → return.
 * For rating sorts the cursor is an offset; for date sorts it is an _id.
 */
export async function paginateLineups(
  filter: Filter,
  input: Pick<LineupFilterInput, "sort" | "limit" | "cursor">,
) {
  const limit = input.limit;
  const skip =
    isRatingSort(input.sort) && input.cursor ? parseInt(input.cursor, 10) : 0;

  let query = LineupModel.find(filter)
    .sort(buildLineupSort(input.sort))
    .limit(limit + 1)
    .populate(lineupPopulateFields)
    .lean();

  if (skip > 0) {
    query = query.skip(skip);
  }

  const data = await query;
  const hasMore = data.length > limit;
  const lineups = hasMore ? data.slice(0, limit) : data;

  let cursor: string | undefined;
  if (hasMore) {
    cursor = isRatingSort(input.sort)
      ? String(skip + limit)
      : lineups[lineups.length - 1]?._id?.toString();
  }

  return populated({ lineups, hasMore, cursor });
}
