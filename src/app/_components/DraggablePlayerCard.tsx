"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { PlayerOutput } from "~/server/api/schemas/output";
import { getId } from "~/lib/types";
import { VALUE_SHADOWS } from "~/lib/constants";
import { PlayerImage } from "./PlayerImage";

interface DraggablePlayerCardProps {
  player: PlayerOutput;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: (player: PlayerOutput) => void;
}

export function DraggablePlayerCard({
  player,
  selected = false,
  disabled = false,
  onSelect,
}: DraggablePlayerCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: getId(player),
      data: { player },
      disabled: disabled && !selected,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(player);
    } else if (selected && onSelect) {
      // Allow deselecting even when disabled
      onSelect(player);
    }
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={handleClick}
      style={style}
      {...listeners}
      {...attributes}
      disabled={disabled && !selected}
      className={`group relative flex w-[4.5rem] touch-none flex-col items-center ${
        isDragging ? "z-50" : ""
      }`}
    >
      {/* Player Cell - Square with off-white background and value-based glow */}
      <div
        className={`relative h-[4.5rem] w-[4.5rem] overflow-hidden bg-[#f2f2f2] transition-all duration-200 rounded-md ${
          VALUE_SHADOWS[player.value]
        } ${selected ? "ring-2 ring-gold-300" : ""} ${
          isDragging
            ? "scale-105 opacity-50 shadow-2xl"
            : disabled && !selected
              ? "cursor-not-allowed opacity-50 grayscale"
              : "cursor-grab hover:scale-105 active:cursor-grabbing"
        }`}
      >
        <PlayerImage
          imgUrl={player.imgUrl}
          alt={`${player.firstName} ${player.lastName}`}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        {/* Selected Indicator Overlay */}
        {selected && !isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-gold-600/30">
            <svg
              className="h-6 w-6 text-gold-300"
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
        <p className="text-xs font-medium text-foreground">
          {player.firstName.length < 9 ? player.firstName : ""}
        </p>
        <p className="text-xs text-foreground/80">
          {player.lastName.length < 9 ? player.lastName : ""}
        </p>
      </div>
    </button>
  );
}
