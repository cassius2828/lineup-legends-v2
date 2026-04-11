import { create } from "zustand";
import type { ViewMode } from "~/app/_components/common/ViewToggle";

interface ViewModeState {
  view: ViewMode;
  setView: (view: ViewMode) => void;
}

export const useViewModeStore = create<ViewModeState>((set) => ({
  view: "list",
  setView: (view) => set({ view }),
}));
