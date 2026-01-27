"use client";

import Image from "next/image";
import type { PlayerType } from "~/lib/types";

interface PlayerCardProps {
  player: PlayerType;
  selected?: boolean;
  onSelect?: (player: PlayerType) => void;
  disabled?: boolean;
  compact?: boolean;
}

const valueColors: Record<number, string> = {
  1: "bg-gray-500",
  2: "bg-green-500",
  3: "bg-blue-500",
  4: "bg-purple-500",
  5: "bg-gold",
};

export function PlayerCard({
  player,
  selected = false,
  onSelect,
  disabled = false,
  compact = false,
}: PlayerCardProps) {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(player);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
        <Image
          width={40}
          height={40}
          src={player.imgUrl}
          alt={`${player.firstName} ${player.lastName}`}
          className="rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {player.firstName} {player.lastName}
          </p>
        </div>
        <span
          className={`${valueColors[player.value]} rounded-full px-2 py-0.5 text-xs font-bold text-white`}
        >
          ${player.value}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center rounded-xl p-4 transition-all duration-200 ${
        selected
          ? "bg-emerald-600/80 ring-2 ring-emerald-400"
          : "bg-white/10 hover:bg-white/20"
      } ${disabled && !selected ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      {/* Value Badge */}
      <span
        className={`absolute -top-2 -right-2 ${valueColors[player.value]} rounded-full px-2.5 py-1 text-sm font-bold text-white shadow-lg`}
      >
        ${player.value}
      </span>

      {/* Player Image */}
      <div className="mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-white/20">
        <img
          src={player.imgUrl}
          alt={`${player.firstName} ${player.lastName}`}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Player Name */}
      <p className="text-center text-sm font-semibold text-white">
        {player.firstName}
      </p>
      <p className="text-center text-xs text-white/70">{player.lastName}</p>

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-emerald-600/20">
          <svg
            className="h-8 w-8 text-emerald-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
}
