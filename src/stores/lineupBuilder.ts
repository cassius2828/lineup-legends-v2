import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayersByValueOutput } from "~/server/api/schemas/output";

interface LineupBuilderState {
  playerPool: PlayersByValueOutput | null;
  setPlayerPool: (pool: PlayersByValueOutput) => void;
  clearPlayerPool: () => void;
}

export const useLineupBuilderStore = create<LineupBuilderState>()(
  persist(
    (set) => ({
      playerPool: null,
      setPlayerPool: (pool) => set({ playerPool: pool }),
      clearPlayerPool: () => set({ playerPool: null }),
    }),
    { name: "lineup-builder" },
  ),
);
