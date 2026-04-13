import mongoose from "mongoose";
import type { SortOrder } from "mongoose";
import { endOfDay, startOfDay } from "date-fns";
import type { LineupFilterInput } from "~/server/api/schemas/lineup-filter";

type Filter = Record<string, unknown>;

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

  const id = new mongoose.Types.ObjectId(cursor);

  if (sort === "oldest") {
    return { ...filter, _id: { $gt: id } };
  }
  return { ...filter, _id: { $lt: id } };
}
