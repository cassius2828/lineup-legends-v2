"use client";

import Link from "next/link";
import type { Player, Lineup, User } from "~/generated/prisma";
import { PlayerCard } from "./PlayerCard";
import { formatDistanceToNow } from "date-fns";

type LineupWithRelations = Lineup & {
  pg: Player;
  sg: Player;
  sf: Player;
  pf: Player;
  c: Player;
  owner: User;
};

interface LineupCardProps {
  lineup: LineupWithRelations;
  showOwner?: boolean;
  onDelete?: (id: string) => void;
  onToggleFeatured?: (id: string) => void;
  isOwner?: boolean;
}

const positionLabels = {
  pg: "PG",
  sg: "SG",
  sf: "SF",
  pf: "PF",
  c: "C",
};

export function LineupCard({
  lineup,
  showOwner = true,
  onDelete,
  onToggleFeatured,
  isOwner = false,
}: LineupCardProps) {
  const totalValue =
    lineup.pg.value +
    lineup.sg.value +
    lineup.sf.value +
    lineup.pf.value +
    lineup.c.value;

  const relativeTime = formatDistanceToNow(new Date(lineup.createdAt), {
    addSuffix: true,
  });

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showOwner && lineup.owner && (
            <>
              {lineup.owner.image && (
                <img
                  src={lineup.owner.image}
                  alt={lineup.owner.name ?? "User"}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="font-medium text-white/90">
                {lineup.owner.name ?? lineup.owner.username ?? "Anonymous"}
              </span>
            </>
          )}
          {lineup.featured && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
              Featured
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span>{relativeTime}</span>
          <span className="rounded-full bg-white/10 px-2 py-1 font-semibold text-white">
            ${totalValue}
          </span>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-5 gap-2">
        {(["pg", "sg", "sf", "pf", "c"] as const).map((position) => (
          <div key={position} className="flex flex-col items-center">
            <span className="mb-1 text-xs font-bold uppercase text-white/50">
              {positionLabels[position]}
            </span>
            <PlayerCard player={lineup[position]} compact />
          </div>
        ))}
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="mt-4 flex justify-end gap-2">
          {onToggleFeatured && (
            <button
              onClick={() => onToggleFeatured(lineup.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                lineup.featured
                  ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {lineup.featured ? "Unfeature" : "Feature"}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(lineup.id)}
              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

