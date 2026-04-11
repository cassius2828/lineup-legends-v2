"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { LineupOutput } from "~/server/api/schemas/output";
import { POSITIONS_LOWER } from "~/lib/constants";
import { VALUE_SHADOWS } from "~/lib/constants";
import { PlayerImage } from "../PlayerImage";

interface LineupCardCompactProps {
  lineup: LineupOutput;
  featured?: boolean;
}

export function LineupCardCompact({
  lineup,
  featured = false,
}: LineupCardCompactProps) {
  const totalValue =
    lineup.players.pg?.value +
    lineup.players.sg?.value +
    lineup.players.sf?.value +
    lineup.players.pf?.value +
    lineup.players.c?.value;

  const lineupId = lineup._id?.toString() ?? "";

  const relativeTime = formatDistanceToNow(new Date(lineup.createdAt), {
    addSuffix: false,
  });

  return (
    <Link
      href={`/lineups/${lineupId}`}
      className={`from-surface-800/90 to-surface-950/90 group block rounded-xl bg-gradient-to-br p-3 shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.02] ${featured ? "glow-gold" : ""}`}
    >
      {/* Top row: value + rating */}
      <div className="mb-2 flex items-center justify-between">
        <span className="bg-foreground/10 text-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
          ${totalValue}
        </span>
        <div className="flex items-center gap-0.5">
          <svg
            className="text-gold h-3 w-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-foreground/60 text-[10px] font-medium">
            {lineup.avgRating > 0 ? lineup.avgRating.toFixed(1) : "-"}
          </span>
        </div>
      </div>

      {/* Player avatars */}
      <div className="mb-2 flex justify-center -space-x-1.5">
        {POSITIONS_LOWER.map((pos) => {
          const player = lineup.players[pos];
          return (
            <div
              key={pos}
              className={`border-surface-950 relative h-7 w-7 overflow-hidden rounded-full border sm:h-8 sm:w-8 ${VALUE_SHADOWS[player?.value ?? 0] ?? ""}`}
            >
              <PlayerImage
                imgUrl={player?.imgUrl}
                alt={player ? `${player.firstName} ${player.lastName}` : ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          );
        })}
      </div>

      {/* Time */}
      <p className="text-foreground/40 truncate text-center text-[10px]">
        {relativeTime}
      </p>
    </Link>
  );
}
