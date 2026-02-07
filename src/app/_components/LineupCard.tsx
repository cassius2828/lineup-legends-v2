"use client";

import Link from "next/link";

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { type LineupType } from "~/lib/types";
import { PlayerCard } from "./PlayerCard";

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
  onVote,
  isOwner = false,
  currentUserId,
  userVote,
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

  const canVote =
    currentUserId && currentUserId !== lineup.owner._id?.toString();

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showOwner && lineup.owner && (
            <Link
              href={`/profile/${lineup.owner._id?.toString() ?? ""}`}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              {lineup.owner.image && (
                <Image
                  width={32}
                  height={32}
                  src={lineup.owner?.image ?? lineup.owner?.profileImg ?? ""}
                  alt={lineup.owner?.name ?? "User"}
                  className="rounded-full"
                />
              )}
              <span className="font-medium text-white/90 hover:text-white">
                {lineup.owner?.name ?? lineup.owner?.username ?? "Anonymous"}
              </span>
            </Link>
          )}
          {lineup.featured && (
            <span className="bg-gold/20 text-gold rounded-full px-2 py-0.5 text-xs font-semibold">
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

      {/* Stats Bar */}
      <div className="mb-4 flex items-center gap-4 text-sm">
        {/* Voting */}
        {onVote && canVote ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onVote(lineup._id?.toString() ?? "", "upvote")}
              className={`rounded p-1 transition-colors ${
                userVote === "upvote"
                  ? "bg-emerald-500/30 text-emerald-400"
                  : "text-white/50 hover:bg-white/10 hover:text-emerald-400"
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span
              className={`min-w-[2rem] text-center font-semibold ${
                lineup.totalVotes > 0
                  ? "text-emerald-400"
                  : lineup.totalVotes < 0
                    ? "text-red-400"
                    : "text-white/60"
              }`}
            >
              {lineup.totalVotes}
            </span>
            <button
              onClick={() => onVote(lineup._id?.toString() ?? "", "downvote")}
              className={`rounded p-1 transition-colors ${
                userVote === "downvote"
                  ? "bg-red-500/30 text-red-400"
                  : "text-white/50 hover:bg-white/10 hover:text-red-400"
              }`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-white/50">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{lineup.totalVotes}</span>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 text-white/50">
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
        {canVote && (
          <Link
            href={`/lineups/${lineup._id?.toString() ?? ""}/rate`}
            className="text-xs text-white/50 hover:text-white/80"
          >
            Rate
          </Link>
        )}

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

      {/* Players Grid */}
      <div className="grid grid-cols-5 gap-2">
        {(["pg", "sg", "sf", "pf", "c"] as const).map((position) => (
          <div key={position} className="flex flex-col items-center">
            <span className="mb-1 text-xs font-bold text-white/50 uppercase">
              {positionLabels[position]}
            </span>
            <PlayerCard player={lineup.players[position]} compact />
          </div>
        ))}
      </div>

      {/* Owner Actions */}
      {isOwner && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Link
            href={`/lineups/${lineup._id?.toString() ?? ""}/edit`}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/20"
          >
            Reorder
          </Link>
          <Link
            href={`/lineups/${lineup._id?.toString() ?? ""}/gamble`}
            className="rounded-lg bg-green-500/20 px-3 py-1.5 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/30"
          >
            Gamble
          </Link>
          {onToggleFeatured && (
            <button
              onClick={() => onToggleFeatured(lineup._id?.toString() ?? "")}
              className="bg-gold/20 text-gold hover:bg-gold/30 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {lineup.featured ? "Unfeature" : "Feature"}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(lineup._id?.toString() ?? "")}
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
