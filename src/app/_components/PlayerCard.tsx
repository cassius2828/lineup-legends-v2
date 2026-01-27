"use client";

import type { Player } from "~/lib/types";

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  onSelect?: (player: Player) => void;
  disabled?: boolean;
  compact?: boolean;
}

// Value-based box-shadow glow colors matching original design
const valueShadows: Record<number, string> = {
  5: "shadow-[0px_0px_10px_3px_#99fcff]", // Light blue diamond
  4: "shadow-[0px_0px_10px_3px_#8317e8]", // Purple
  3: "shadow-[0px_0px_10px_3px_#e3b920]", // Gold
  2: "shadow-[0px_0px_10px_3px_#c0c0c0]", // Silver
  1: "shadow-[0px_0px_10px_3px_#804a14]", // Bronze
};

// Keep valueColors for compact mode badge
const valueColors: Record<number, string> = {
  1: "bg-amber-700",
  2: "bg-gray-400",
  3: "bg-yellow-500",
  4: "bg-purple-600",
  5: "bg-cyan-400",
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
        <img
          src={player.imgUrl}
          alt={`${player.firstName} ${player.lastName}`}
          className="h-10 w-10 rounded-full object-cover"
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
      className="group relative flex w-[4.5rem] flex-col items-center"
    >
      {/* Player Cell - Square with off-white background and value-based glow */}
      <div
        className={`relative h-[4.5rem] w-[4.5rem] overflow-hidden bg-[#f2f2f2] transition-all duration-200 ${
          valueShadows[player.value]
        } ${
          selected ? "ring-2 ring-emerald-400" : ""
        } ${disabled && !selected ? "cursor-not-allowed opacity-50 grayscale" : "cursor-pointer hover:scale-105"}`}
      >
        <img
          src={player.imgUrl}
          alt={`${player.firstName} ${player.lastName}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Selected Indicator Overlay */}
        {selected && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/30">
            <svg
              className="h-6 w-6 text-emerald-400"
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
      </div>

      {/* Player Name - Below the cell */}
      <div className="mt-1 h-10 text-center">
        <p className="text-xs font-medium text-white">
          {player.firstName.length < 9 ? player.firstName : ""}
        </p>
        <p className="text-xs text-white/80">
          {player.lastName.length < 9 ? player.lastName : ""}
        </p>
      </div>
    </button>
  );
}
