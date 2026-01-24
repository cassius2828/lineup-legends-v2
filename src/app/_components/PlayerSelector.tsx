"use client";

import { useState } from "react";
import type { Player } from "../../../generated/prisma";
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
    selectedPlayers.some((p) => p.id === player.id);

  const canAffordPlayer = (player: Player) =>
    player.value <= remainingBudget || isPlayerSelected(player);

  const handlePlayerClick = (player: Player) => {
    if (isPlayerSelected(player)) {
      // Deselect player
      setSelectedPlayers(selectedPlayers.filter((p) => p.id !== player.id));
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

  const allPlayers = [
    { label: "$5 Players", players: playersByValue.value5Players },
    { label: "$4 Players", players: playersByValue.value4Players },
    { label: "$3 Players", players: playersByValue.value3Players },
    { label: "$2 Players", players: playersByValue.value2Players },
    { label: "$1 Players", players: playersByValue.value1Players },
  ];

  return (
    <div className="space-y-8">
      {/* Budget Display */}
      <div className="sticky top-0 z-10 rounded-2xl bg-slate-900/95 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-white/60">Budget Remaining</p>
              <p
                className={`text-3xl font-bold ${
                  remainingBudget < 3
                    ? "text-red-400"
                    : remainingBudget < 6
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              >
                ${remainingBudget}
              </p>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div>
              <p className="text-sm text-white/60">Players Selected</p>
              <p className="text-3xl font-bold text-white">
                {selectedPlayers.length}/5
              </p>
            </div>
          </div>

          {/* Selected Players Preview */}
          <div className="flex items-center gap-2">
            {POSITIONS.map((pos, idx) => (
              <div
                key={pos}
                className={`flex h-12 w-12 flex-col items-center justify-center rounded-lg ${
                  selectedPlayers[idx]
                    ? "bg-emerald-600/50"
                    : "border-2 border-dashed border-white/30 bg-white/5"
                }`}
              >
                {selectedPlayers[idx] ? (
                  <img
                    src={selectedPlayers[idx].imgUrl}
                    alt={selectedPlayers[idx].firstName}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-xs text-white/50">{pos}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearSelection}
              disabled={selectedPlayers.length === 0}
              className="rounded-lg bg-white/10 px-4 py-2 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Lineup"}
            </button>
          </div>
        </div>
      </div>

      {/* Player Tiers */}
      {allPlayers.map(({ label, players }) => (
        <div key={label}>
          <h3 className="mb-4 text-lg font-semibold text-white/80">{label}</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
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
  );
}

