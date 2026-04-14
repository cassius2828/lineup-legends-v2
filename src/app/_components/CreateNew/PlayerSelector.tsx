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
import { getId } from "~/lib/types";
import type { PlayerOutput } from "~/server/api/schemas/output";
import {
  POSITIONS,
  BUDGET_LIMIT,
  INITIAL_POSITION_SLOTS,
  type Position,
  type PositionSlots,
} from "~/lib/constants";
import CreateLineupHeader from "../Header/CreateLineupHeader";
import OrderLineup from "./OrderLineup";
import PlayerGrid from "./PlayerGrid";
import CreateLineupPlayerDragOverlay from "./CreateLineupPlayerDragOverlay";
import { CreateLineupPlayerDetailPanel } from "./CreateLineupPlayerDetailPanel";

interface PlayersByValue {
  value1Players: PlayerOutput[];
  value2Players: PlayerOutput[];
  value3Players: PlayerOutput[];
  value4Players: PlayerOutput[];
  value5Players: PlayerOutput[];
}

interface PlayerSelectorProps {
  playersByValue: PlayersByValue;
  onSubmit: (selectedPlayers: PlayerOutput[]) => void;
  isSubmitting?: boolean;
  isAuthenticated?: boolean;
  isLoading?: boolean;
}

export function PlayerSelector({
  playersByValue,
  onSubmit,
  isSubmitting = false,
  isAuthenticated = true,
  isLoading = false,
}: PlayerSelectorProps) {
  const [positionSlots, setPositionSlots] = useState<PositionSlots>(
    INITIAL_POSITION_SLOTS,
  );
  const [activePlayer, setActivePlayer] = useState<PlayerOutput | null>(null);
  const [lastSelectedPlayer, setLastSelectedPlayer] =
    useState<PlayerOutput | null>(null);
  const [playerDetailOpen, setPlayerDetailOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isLoading ? Infinity : 5,
      },
    }),
  );

  // Calculate derived values
  const selectedPlayers = POSITIONS.map((pos) => positionSlots[pos]).filter(
    (p): p is PlayerOutput => p !== null,
  );
  const currentBudget = selectedPlayers.reduce((sum, p) => sum + p.value, 0);
  const remainingBudget = BUDGET_LIMIT - currentBudget;
  const filledSlots = selectedPlayers.length;
  const canSubmit = filledSlots === 5;

  const isPlayerSelected = (player: PlayerOutput) =>
    selectedPlayers.some((p) => getId(p) === getId(player));

  const canAffordPlayer = (player: PlayerOutput) =>
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
  const findPlayerPosition = (player: PlayerOutput): Position | null => {
    for (const pos of POSITIONS) {
      const slotPlayer = positionSlots[pos];
      if (slotPlayer && getId(slotPlayer) === getId(player)) {
        return pos;
      }
    }
    return null;
  };

  // Handle click to auto-select or deselect
  const handlePlayerClick = (player: PlayerOutput) => {
    const currentPosition = findPlayerPosition(player);

    if (currentPosition) {
      const nextSlots = {
        ...positionSlots,
        [currentPosition]: null,
      };
      const remaining = POSITIONS.map((p) => nextSlots[p]).filter(
        (p): p is PlayerOutput => p !== null,
      );
      setPositionSlots(nextSlots);
      if (remaining.length === 0) {
        setLastSelectedPlayer(null);
        setPlayerDetailOpen(false);
        return;
      }
      setLastSelectedPlayer((prev) => {
        if (prev && remaining.some((r) => getId(r) === getId(prev))) {
          return prev;
        }
        return remaining[0]!;
      });
    } else if (canAffordPlayer(player) && filledSlots < 5) {
      const emptySlot = findFirstEmptySlot();
      if (emptySlot) {
        setPositionSlots((prev) => ({
          ...prev,
          [emptySlot]: player,
        }));
        setLastSelectedPlayer(player);
      }
    }
  };

  // Handle removing a player from a slot
  const handleRemovePlayer = (player: PlayerOutput) => {
    const position = findPlayerPosition(player);
    if (!position) return;
    const nextSlots = { ...positionSlots, [position]: null };
    const remaining = POSITIONS.map((p) => nextSlots[p]).filter(
      (p): p is PlayerOutput => p !== null,
    );
    setPositionSlots(nextSlots);
    if (remaining.length === 0) {
      setLastSelectedPlayer(null);
      setPlayerDetailOpen(false);
      return;
    }
    setLastSelectedPlayer((prev) => {
      if (prev && remaining.some((r) => getId(r) === getId(prev))) {
        return prev;
      }
      return remaining[0]!;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const player = active.data.current?.player as PlayerOutput | undefined;
    if (player) {
      setActivePlayer(player);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayer(null);

    if (!over) return;

    const player = active.data.current?.player as PlayerOutput | undefined;
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
    setLastSelectedPlayer(player);
  };

  const handleSubmit = () => {
    if (canSubmit) {
      // Convert position slots to ordered array
      const orderedPlayers = POSITIONS.map((pos) => positionSlots[pos]).filter(
        (p): p is PlayerOutput => p !== null,
      );
      onSubmit(orderedPlayers);
    }
  };

  const clearSelection = () => {
    setPositionSlots(INITIAL_POSITION_SLOTS);
    setLastSelectedPlayer(null);
    setPlayerDetailOpen(false);
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
      <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-center lg:gap-20">
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
            isLoading={isLoading}
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
          onOpenPlayerDetail={() => setPlayerDetailOpen(true)}
          canOpenPlayerDetail={filledSlots >= 1}
          detailPlayer={lastSelectedPlayer}
          onSelectForDetail={setLastSelectedPlayer}
        />
      </div>

      <CreateLineupPlayerDetailPanel
        player={lastSelectedPlayer}
        open={playerDetailOpen && lastSelectedPlayer !== null}
        onClose={() => setPlayerDetailOpen(false)}
      />

      {/* Drag Overlay - Shows the player being dragged */}
      <DragOverlay dropAnimation={null}>
        {activePlayer ? (
          <CreateLineupPlayerDragOverlay activePlayer={activePlayer} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
