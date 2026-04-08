import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates that a string is a well-formed HTTP(S) URL.
 * Blocks javascript:, data:, vbscript:, and other non-HTTP protocols
 * to prevent XSS when the value is used in an <img src> or similar attribute.
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
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
    return newType === "upvote" ? 1 : -1;
  }
  if (existingType === newType) {
    return newType === "upvote" ? -1 : 1;
  }
  return newType === "upvote" ? 2 : -2;
}
