"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type { LineupOutput } from "~/server/api/schemas/output";
import { StarFilledIcon, DiceIcon } from "~/app/_components/common/icons";

export function LineupCardStatsBar({
  lineup,
  isOwner,
}: {
  lineup: LineupOutput;
  isOwner: boolean;
}) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const canRate = isAuthenticated && !isOwner;

  const handleRateClick = (e: React.MouseEvent) => {
    if (isOwner) {
      e.preventDefault();
      return;
    }
    if (!isAuthenticated) {
      e.preventDefault();
      toast.info("Sign in to rate lineups");
    }
  };

  return (
    <div className="mb-4 flex items-center gap-4 text-sm">
      <Link
        href={`/lineups/${lineup._id?.toString() ?? ""}/rate`}
        onClick={handleRateClick}
        className={`text-foreground/50 hover:text-foreground/80 flex gap-2 text-xs ${!canRate ? "cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-1">
          <StarFilledIcon className="text-gold h-4 w-4" />
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
        <div className="text-foreground/40 flex items-center gap-1">
          <DiceIcon className="h-4 w-4" />
          <span className="text-xs">
            {lineup.timesGambled} player{lineup.timesGambled !== 1 ? "s" : ""}{" "}
            gambled
          </span>
        </div>
      )}
    </div>
  );
}
