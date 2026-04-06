import type { SortOrder } from "mongoose";

export function buildLineupSort(
  sort?: string,
): Record<string, SortOrder> {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };
    case "highest-rated":
      return { avgRating: -1 };
    case "most-rated":
      return { ratingCount: -1 };
    default:
      return { createdAt: -1 };
  }
}
