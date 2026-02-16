"use client";

import Link from "next/link";
import type { LineupType } from "~/lib/types";

export function LineupCardStatsBar({
  lineup,
  isOwner,
}: {
  lineup: LineupType;
  isOwner: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-4 text-sm">
      <Link
        href={`/lineups/${lineup._id?.toString() ?? ""}/rate`}
        className={`flex gap-2 text-xs text-white/50 hover:text-white/80 ${isOwner ? "cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-1">
          <svg
            className="text-gold h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-medium">
            {lineup.avgRating > 0 ? lineup.avgRating.toFixed(1) : "-"}
          </span>
        </div>

        {/* Rate Link (for non-owners) */}

        {lineup.ratingCount > 0 ? (
          <span>
            Rated {lineup.ratingCount} time{lineup.ratingCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span>Not rated yet</span>
        )}
      </Link>

      {/* Gambled count */}
      {lineup.timesGambled > 0 && (
        <div className="flex items-center gap-1 text-white/40">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-xs">{lineup.timesGambled}x</span>
        </div>
      )}
    </div>
  );
}
