"use client";

import { Check } from "lucide-react";
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
      className={`group relative flex w-12 touch-none flex-col items-center sm:w-[4.5rem] ${
        isDragging ? "z-50" : ""
      }`}
    >
      {/* Player Cell - Square with off-white background and value-based glow */}
      <div
        className={`relative h-12 w-12 overflow-hidden rounded-md bg-[#f2f2f2] transition-all duration-200 sm:h-[4.5rem] sm:w-[4.5rem] ${
          VALUE_SHADOWS[player.value]
        } ${selected ? "ring-gold-300 ring-2" : ""} ${
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
          <div className="bg-gold-600/30 absolute inset-0 flex items-center justify-center">
            <Check className="text-gold-300 h-4 w-4 sm:h-6 sm:w-6" />
          </div>
        )}
      </div>

      {/* Player Name - Below the cell */}
      <div className="mt-1 h-10 text-center">
        <p className="text-foreground text-xs font-medium">
          {player.firstName.length > 8
            ? player.firstName.slice(0, 7) + "…"
            : player.firstName}
        </p>
        <p className="text-foreground/80 text-xs">
          {player.lastName.length > 8
            ? player.lastName.slice(0, 7) + "…"
            : player.lastName}
        </p>
      </div>
    </button>
  );
}
