"use client";

import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "list" | "grid";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="bg-foreground/5 flex rounded-lg p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`cursor-pointer rounded-md p-1.5 transition-colors ${
          view === "list"
            ? "bg-gold text-black"
            : "text-foreground/50 hover:text-foreground/80"
        }`}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`cursor-pointer rounded-md p-1.5 transition-colors ${
          view === "grid"
            ? "bg-gold text-black"
            : "text-foreground/50 hover:text-foreground/80"
        }`}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}
