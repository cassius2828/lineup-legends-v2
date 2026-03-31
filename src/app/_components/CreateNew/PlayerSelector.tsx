"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { getId, type PlayerType } from "~/lib/types";
import CreateLineupHeader from "../Header/CreateLineupHeader";
import OrderLineup from "./OrderLineup";
import PlayerGrid from "./PlayerGrid";
import CreateLineupPlayerDragOverlay from "./CreateLineupPlayerDragOverlay";

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
  isAuthenticated?: boolean;
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
  isAuthenticated = true,
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
      <div className="flex flex-col gap-4 lg:flex-row items-center lg:justify-center lg:gap-20">
        {/* Left Container - Player Grid */}
        <div className="flex-shrink-0">
          {/* Header with Title and Budget */}
          <CreateLineupHeader
            remainingBudget={remainingBudget}
            activePlayer={!!activePlayer}
          />

          {/* Player Grid - Rows by Value */}
          <PlayerGrid
            allPlayers={allPlayers}
            isPlayerSelected={isPlayerSelected}
            handlePlayerClick={handlePlayerClick}
            canAffordPlayer={canAffordPlayer}
            filledSlots={filledSlots}
          />
        </div>

        {/* Right Container - Selected Players & Buttons */}
        <OrderLineup
          positionSlots={positionSlots}
          handleRemovePlayer={handleRemovePlayer}
          activePlayer={activePlayer}
          handleSubmit={handleSubmit}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          clearSelection={clearSelection}
          filledSlots={filledSlots}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Drag Overlay - Shows the player being dragged */}
      <DragOverlay dropAnimation={null}>
        {activePlayer ? (
          <CreateLineupPlayerDragOverlay activePlayer={activePlayer} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
