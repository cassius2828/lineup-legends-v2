"use client";

import type { LineupOutput } from "~/server/api/schemas/output";
import { POSITIONS_LOWER, POSITION_LABELS } from "~/lib/constants";
import { PlayerCard } from "../PlayerCard";

interface LineupCardPlayersGridProps {
  players: LineupOutput["players"];
}

export function LineupCardPlayersGrid({ players }: LineupCardPlayersGridProps) {
  return (
    <div className="flex gap-12 overflow-x-auto px-6">
      {POSITIONS_LOWER.map((position) => (
        <div
          key={position}
          className="flex min-w-[5rem] shrink-0 grow basis-0 flex-col items-center"
        >
          <span className="mb-1 text-xs font-bold text-foreground/50 uppercase">
            {POSITION_LABELS[position]}
          </span>
          <PlayerCard player={players[position]} compact />
        </div>
      ))}
    </div>
  );
}
