"use client";

import { useDroppable } from "@dnd-kit/core";
import type { PlayerType } from "~/lib/types";
import { PlayerImage } from "./PlayerImage";

type Position = "PG" | "SG" | "SF" | "PF" | "C";

interface DroppablePositionSlotProps {
  position: Position;
  player: PlayerType | null;
  onRemove: (player: PlayerType) => void;
  isAnyDragging?: boolean;
}

export function DroppablePositionSlot({
  position,
  player,
  onRemove,
  isAnyDragging = false,
}: DroppablePositionSlotProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: position,
    data: { position },
  });

  // Determine visual states
  const isDraggedOver = isOver && active;
  const isValidDropTarget = isAnyDragging && !player;
  const showSwapIndicator = isOver && player;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Position Label */}
      <span
        className={`text-sm font-bold transition-colors duration-200 ${
          isDraggedOver ? "text-gold" : "text-foreground/70"
        }`}
      >
        {position}
      </span>

      {/* Player Slot */}
      <div
        ref={setNodeRef}
        className={`relative flex h-16 w-16 items-center justify-center rounded-lg transition-all duration-200 ${
          isDraggedOver
            ? "border-gold bg-gold/20 scale-110 border-2 border-solid shadow-[0_0_20px_rgba(227,185,32,0.5)]"
            : isValidDropTarget
              ? "border-gold/60 bg-gold/10 scale-105 animate-pulse border-2 border-dashed"
              : player
                ? "border-2 border-solid border-foreground/40 bg-foreground/10"
                : "border-2 border-dashed border-foreground/30 bg-foreground/5"
        } ${showSwapIndicator ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-surface-950" : ""}`}
      >
        {player ? (
          <>
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <PlayerImage
                imgUrl={player.imgUrl}
                alt={player.firstName}
                className={`absolute inset-0 h-full w-full rounded-lg object-cover ${
                  showSwapIndicator ? "opacity-50" : ""
                }`}
              />
            </div>
            {/* Remove Button */}
            <button
              onClick={() => onRemove(player)}
              className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-foreground transition-colors hover:bg-red-500"
            >
              ×
            </button>
            {/* Swap Indicator */}
            {showSwapIndicator && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-amber-500 p-1">
                  <svg
                    className="h-4 w-4 text-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </div>
              </div>
            )}
          </>
        ) : (
          // Empty slot indicator
          <div
            className={`transition-opacity duration-200 ${
              isDraggedOver ? "opacity-100" : "opacity-40"
            }`}
          >
            {isDraggedOver ? (
              <svg
                className="text-gold h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6 text-foreground/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
