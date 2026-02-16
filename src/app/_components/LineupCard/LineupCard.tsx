"use client";

import { formatDistanceToNow } from "date-fns";
import { type LineupType } from "~/lib/types";
import { LineupCardHeader } from "./LineupCardHeader";
import { LineupCardStatsBar } from "./LineupCardStatsBar";
import { LineupCardPlayersGrid } from "./LineupCardPlayersGrid";
import { LineupCardOwnerActions } from "./LineupCardOwnerActions";

interface LineupCardProps {
  lineup: LineupType;
  showOwner?: boolean;
  onDelete?: (id: string) => void;
  onToggleFeatured?: (id: string) => void;
  onVote?: (lineupId: string, type: "upvote" | "downvote") => void;
  isOwner?: boolean;
  currentUserId?: string;
  userVote?: "upvote" | "downvote" | null;
}

export function LineupCard({
  lineup,
  showOwner = true,
  onDelete,
  onToggleFeatured,
  isOwner = false,
}: LineupCardProps) {
  const totalValue =
    lineup.players.pg?.value +
    lineup.players.sg?.value +
    lineup.players.sf?.value +
    lineup.players.pf?.value +
    lineup.players.c?.value;

  const relativeTime = formatDistanceToNow(new Date(lineup.createdAt), {
    addSuffix: true,
  });

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
      <LineupCardHeader
        lineup={lineup}
        showOwner={showOwner}
        totalValue={totalValue}
        relativeTime={relativeTime}
      />

      <LineupCardStatsBar lineup={lineup} isOwner={isOwner} />

      <LineupCardPlayersGrid players={lineup.players} />

      {isOwner && (
        <LineupCardOwnerActions
          lineup={lineup}
          onToggleFeatured={onToggleFeatured}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
