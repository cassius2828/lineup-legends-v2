"use client";

import type { PlayerOutput } from "~/server/api/schemas/output";
import { VALUE_SHADOWS } from "~/lib/constants";
import { PlayerImage } from "./PlayerImage";
import { useRouter } from "next/navigation";

interface PlayerCardProps {
  player: PlayerOutput;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export function PlayerCard({
  player,
  selected = false,
  disabled = false,
  compact = false,
}: PlayerCardProps) {
  const router = useRouter();
  const handleClick = () => {
    router.push(`/players/${player._id?.toString() ?? ""}`);
  };
  if (compact) {
    return (
      <div className="flex w-full flex-col items-center gap-2 p-2">
        <div
          className={`relative h-16 w-16 overflow-hidden rounded-full md:h-24 md:w-24 ${VALUE_SHADOWS[player?.value ?? 0]}`}
        >
          <PlayerImage
            onClick={handleClick}
            imgUrl={player?.imgUrl}
            alt={player ? `${player.firstName} ${player.lastName}` : ""}
            className="absolute inset-0 h-full w-full cursor-pointer rounded-full object-cover"
          />
        </div>
        <div className="w-full min-w-0">
          <p className="text-foreground truncate text-center text-sm font-medium">
            {player?.firstName} {player?.lastName}
          </p>
        </div>
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
          VALUE_SHADOWS[player.value]
        } ${
          selected ? "ring-gold-300 ring-2" : ""
        } ${disabled && !selected ? "cursor-not-allowed opacity-50 grayscale" : "cursor-pointer hover:scale-105"}`}
      >
        <PlayerImage
          imgUrl={player.imgUrl}
          alt={`${player.firstName} ${player.lastName}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Selected Indicator Overlay */}
        {selected && (
          <div className="bg-gold-600/30 absolute inset-0 flex items-center justify-center">
            <svg
              className="text-gold-300 h-6 w-6"
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
        <p className="text-foreground text-xs font-medium">
          {player.firstName.length < 9 ? player.firstName : ""}
        </p>
        <p className="text-foreground/80 text-xs">
          {player.lastName.length < 9 ? player.lastName : ""}
        </p>
      </div>
    </button>
  );
}
