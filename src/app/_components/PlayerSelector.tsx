"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { type PlayerType, getId } from "~/lib/types";
import { DraggablePlayerCard } from "./DraggablePlayerCard";
import { DroppablePositionSlot } from "./DroppablePositionSlot";

interface PlayersByValue {
  value1Players: PlayerType[];
  value2Players: PlayerType[];
  value3Players: PlayerType[];
  value4Players: PlayerType[];
  value5Players: PlayerType[];
}

interface PlayerSelectorProps {
  playersByValue: PlayersByValue;
  onSubmit: (selectedPlayers: PlayerType[]) => void;
  isSubmitting?: boolean;
}

const BUDGET_LIMIT = 15;
const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
type Position = (typeof POSITIONS)[number];

// Position-keyed state type
type PositionSlots = {
  PG: PlayerType | null;
  SG: PlayerType | null;
  SF: PlayerType | null;
  PF: PlayerType | null;
  C: PlayerType | null;
};

const initialPositionSlots: PositionSlots = {
  PG: null,
  SG: null,
  SF: null,
  PF: null,
  C: null,
};

export function PlayerSelector({
  playersByValue,
  onSubmit,
  isSubmitting = false,
}: PlayerSelectorProps) {
  const [positionSlots, setPositionSlots] =
    useState<PositionSlots>(initialPositionSlots);
  const [activePlayer, setActivePlayer] = useState<PlayerType | null>(null);

  // Configure sensors for better drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before starting drag
      },
    }),
  );

  // Calculate derived values
  const selectedPlayers = POSITIONS.map((pos) => positionSlots[pos]).filter(
    (p): p is PlayerType => p !== null,
  );
  const currentBudget = selectedPlayers.reduce((sum, p) => sum + p.value, 0);
  const remainingBudget = BUDGET_LIMIT - currentBudget;
  const filledSlots = selectedPlayers.length;
  const canSubmit = filledSlots === 5;

  const isPlayerSelected = (player: PlayerType) =>
    selectedPlayers.some((p) => getId(p) === getId(player));

  const canAffordPlayer = (player: PlayerType) =>
    player.value <= remainingBudget || isPlayerSelected(player);

  // Find first empty position slot
  const findFirstEmptySlot = (): Position | null => {
    for (const pos of POSITIONS) {
      if (positionSlots[pos] === null) {
        return pos;
      }
    }
    return null;
  };

  // Find which position a player is in
  const findPlayerPosition = (player: PlayerType): Position | null => {
    for (const pos of POSITIONS) {
      const slotPlayer = positionSlots[pos];
      if (slotPlayer && getId(slotPlayer) === getId(player)) {
        return pos;
      }
    }
    return null;
  };

  // Handle click to auto-select or deselect
  const handlePlayerClick = (player: PlayerType) => {
    const currentPosition = findPlayerPosition(player);

    if (currentPosition) {
      // Deselect player - remove from their position
      setPositionSlots((prev) => ({
        ...prev,
        [currentPosition]: null,
      }));
    } else if (canAffordPlayer(player) && filledSlots < 5) {
      // Select player - find first empty slot
      const emptySlot = findFirstEmptySlot();
      if (emptySlot) {
        setPositionSlots((prev) => ({
          ...prev,
          [emptySlot]: player,
        }));
      }
    }
  };

  // Handle removing a player from a slot
  const handleRemovePlayer = (player: PlayerType) => {
    const position = findPlayerPosition(player);
    if (position) {
      setPositionSlots((prev) => ({
        ...prev,
        [position]: null,
      }));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const player = active.data.current?.player as PlayerType | undefined;
    if (player) {
      setActivePlayer(player);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayer(null);

    if (!over) return;

    const player = active.data.current?.player as PlayerType | undefined;
    const targetPosition = over.id as Position;

    if (!player || !POSITIONS.includes(targetPosition)) return;

    // Check if this is a valid position
    const currentPosition = findPlayerPosition(player);
    const existingPlayerInSlot = positionSlots[targetPosition];

    // If dropping on same position, do nothing
    if (currentPosition === targetPosition) return;

    // Check budget constraints for new players
    if (!currentPosition && !canAffordPlayer(player)) return;

    setPositionSlots((prev) => {
      const newSlots = { ...prev };

      // If player is already in a position, clear that position
      if (currentPosition) {
        newSlots[currentPosition] = null;
      }

      // If target slot has a player, swap them
      if (existingPlayerInSlot && currentPosition) {
        // Swap: move existing player to the dragged player's old position
        newSlots[currentPosition] = existingPlayerInSlot;
      } else if (existingPlayerInSlot && !currentPosition) {
        // Replacing: the existing player goes back to the grid (removed)
        // No action needed as we're just replacing
      }

      // Place the dragged player in the target slot
      newSlots[targetPosition] = player;

      return newSlots;
    });
  };

  const handleSubmit = () => {
    if (canSubmit) {
      // Convert position slots to ordered array
      const orderedPlayers = POSITIONS.map((pos) => positionSlots[pos]).filter(
        (p): p is PlayerType => p !== null,
      );
      onSubmit(orderedPlayers);
    }
  };

  const clearSelection = () => {
    setPositionSlots(initialPositionSlots);
  };

  const allPlayers = [
    { label: "$5", value: 5, players: playersByValue.value5Players },
    { label: "$4", value: 4, players: playersByValue.value4Players },
    { label: "$3", value: 3, players: playersByValue.value3Players },
    { label: "$2", value: 2, players: playersByValue.value2Players },
    { label: "$1", value: 1, players: playersByValue.value1Players },
  ];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-center">
        {/* Left Container - Player Grid */}
        <div className="flex-shrink-0">
          {/* Header with Title and Budget */}
          <header className="mb-4 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold tracking-wide text-white uppercase">
              Build Your Starting 5
            </h1>
            <span
              className={`mt-1 text-3xl font-bold transition-colors duration-200 ${
                remainingBudget < 3
                  ? "text-red-400"
                  : remainingBudget < 6
                    ? "text-gold"
                    : "text-white"
              }`}
            >
              ${remainingBudget}
            </span>
            {activePlayer && (
              <span className="mt-1 animate-pulse text-sm text-white/60">
                Drag to a position slot...
              </span>
            )}
          </header>

          {/* Player Grid - Rows by Value */}
          <div className="flex flex-col gap-2">
            {allPlayers.map(({ label, players }) => (
              <div key={label} className="flex items-start gap-3">
                {/* Price Label */}
                <h2 className="w-8 pt-6 text-right text-xl font-bold text-white">
                  {label}
                </h2>

                {/* Players Row - Fixed 5 columns */}
                <div className="grid grid-cols-5 gap-2">
                  {players.map((player) => (
                    <DraggablePlayerCard
                      key={getId(player)}
                      player={player}
                      selected={isPlayerSelected(player)}
                      onSelect={handlePlayerClick}
                      disabled={
                        !canAffordPlayer(player) ||
                        (filledSlots >= 5 && !isPlayerSelected(player))
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Container - Selected Players & Buttons */}
        <div className="flex flex-col items-center lg:ml-8">
          {/* Selected Players with Position Labels - Horizontal */}
          <div className="mb-4 flex justify-center gap-2">
            {POSITIONS.map((position) => (
              <DroppablePositionSlot
                key={position}
                position={position}
                player={positionSlots[position]}
                onRemove={handleRemovePlayer}
                isAnyDragging={activePlayer !== null}
              />
            ))}
          </div>

          {/* Confirm Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-gold hover:bg-gold-light rounded-md px-6 py-2 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Confirm Lineup"}
            </button>
            <button
              onClick={clearSelection}
              disabled={filledSlots === 0}
              className="bg-gold hover:bg-gold-light rounded-md px-6 py-2 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>

      {/* Drag Overlay - Shows the player being dragged */}
      <DragOverlay dropAnimation={null}>
        {activePlayer ? (
          <div className="relative flex w-[4.5rem] flex-col items-center opacity-90">
            <div
              className={`ring-gold relative h-[4.5rem] w-[4.5rem] scale-110 overflow-hidden rounded-lg bg-[#f2f2f2] shadow-2xl ring-2 ${
                activePlayer.value === 5
                  ? "shadow-[0px_0px_20px_5px_#99fcff]"
                  : activePlayer.value === 4
                    ? "shadow-[0px_0px_20px_5px_#8317e8]"
                    : activePlayer.value === 3
                      ? "shadow-[0px_0px_20px_5px_#e3b920]"
                      : activePlayer.value === 2
                        ? "shadow-[0px_0px_20px_5px_#c0c0c0]"
                        : "shadow-[0px_0px_20px_5px_#804a14]"
              }`}
            >
              <img
                src={activePlayer.imgUrl}
                alt={`${activePlayer.firstName} ${activePlayer.lastName}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="mt-1 h-10 text-center">
              <p className="text-xs font-medium text-white drop-shadow-lg">
                {activePlayer.firstName.length < 9
                  ? activePlayer.firstName
                  : ""}
              </p>
              <p className="text-xs text-white/80 drop-shadow-lg">
                {activePlayer.lastName.length < 9 ? activePlayer.lastName : ""}
              </p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
