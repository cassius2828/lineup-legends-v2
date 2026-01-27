"use client";

import { useState } from "react";
import { type Player, getId } from "~/lib/types";
import { PlayerCard } from "./PlayerCard";

interface PlayersByValue {
  value1Players: Player[];
  value2Players: Player[];
  value3Players: Player[];
  value4Players: Player[];
  value5Players: Player[];
}

interface PlayerSelectorProps {
  playersByValue: PlayersByValue;
  onSubmit: (selectedPlayers: Player[]) => void;
  isSubmitting?: boolean;
}

const BUDGET_LIMIT = 15;
const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

export function PlayerSelector({
  playersByValue,
  onSubmit,
  isSubmitting = false,
}: PlayerSelectorProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  const currentBudget = selectedPlayers.reduce((sum, p) => sum + p.value, 0);
  const remainingBudget = BUDGET_LIMIT - currentBudget;
  const canSubmit = selectedPlayers.length === 5;

  const isPlayerSelected = (player: Player) =>
    selectedPlayers.some((p) => getId(p) === getId(player));

  const canAffordPlayer = (player: Player) =>
    player.value <= remainingBudget || isPlayerSelected(player);

  const handlePlayerClick = (player: Player) => {
    if (isPlayerSelected(player)) {
      // Deselect player
      setSelectedPlayers(
        selectedPlayers.filter((p) => getId(p) !== getId(player)),
      );
    } else if (selectedPlayers.length < 5 && canAffordPlayer(player)) {
      // Select player
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit(selectedPlayers);
    }
  };

  const clearSelection = () => {
    setSelectedPlayers([]);
  };

  const removePlayer = (player: Player) => {
    setSelectedPlayers(
      selectedPlayers.filter((p) => getId(p) !== getId(player)),
    );
  };

  const allPlayers = [
    { label: "$5", value: 5, players: playersByValue.value5Players },
    { label: "$4", value: 4, players: playersByValue.value4Players },
    { label: "$3", value: 3, players: playersByValue.value3Players },
    { label: "$2", value: 2, players: playersByValue.value2Players },
    { label: "$1", value: 1, players: playersByValue.value1Players },
  ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-center">
      {/* Left Container - Player Grid */}
      <div className="flex-shrink-0">
        {/* Header with Title and Budget */}
        <header className="mb-4 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold tracking-wide text-white uppercase">
            Build Your Starting 5
          </h1>
          <span
            className={`mt-1 text-3xl font-bold ${
              remainingBudget < 3
                ? "text-red-400"
                : remainingBudget < 6
                  ? "text-gold"
                  : "text-white"
            }`}
          >
            ${remainingBudget}
          </span>
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
                  <PlayerCard
                    key={getId(player)}
                    player={player}
                    selected={isPlayerSelected(player)}
                    onSelect={handlePlayerClick}
                    disabled={
                      !canAffordPlayer(player) ||
                      (selectedPlayers.length >= 5 && !isPlayerSelected(player))
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
          {POSITIONS.map((position, idx) => {
            const player = selectedPlayers[idx];
            return (
              <div key={position} className="flex flex-col items-center gap-1">
                {/* Position Label */}
                <span className="text-sm font-bold text-white/70">
                  {position}
                </span>
                {/* Player Slot */}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-white/30 bg-white/5">
                  {player ? (
                    <>
                      <img
                        src={player.imgUrl}
                        alt={player.firstName}
                        className="h-full w-full rounded-lg object-cover"
                      />
                      {/* Remove Button */}
                      <button
                        onClick={() => removePlayer(player)}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white hover:bg-red-500"
                      >
                        ×
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
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
            disabled={selectedPlayers.length === 0}
            className="bg-gold hover:bg-gold-light rounded-md px-6 py-2 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
}
