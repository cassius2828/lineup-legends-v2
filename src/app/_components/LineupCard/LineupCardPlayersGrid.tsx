"use client";

import type { LineupType } from "~/lib/types";
import { PlayerCard } from "../PlayerCard";

const POSITION_LABELS = {
  pg: "PG",
  sg: "SG",
  sf: "SF",
  pf: "PF",
  c: "C",
} as const;

interface LineupCardPlayersGridProps {
  players: LineupType["players"];
}

export function LineupCardPlayersGrid({ players }: LineupCardPlayersGridProps) {
  return (
    <div className="flex gap-12 overflow-x-auto px-6">
      {(["pg", "sg", "sf", "pf", "c"] as const).map((position) => (
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
