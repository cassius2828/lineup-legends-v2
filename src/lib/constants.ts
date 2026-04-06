import type { PlayerType } from "~/lib/types";

export const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

export const POSITIONS_LOWER = ["pg", "sg", "sf", "pf", "c"] as const;

export const POSITION_LABELS: Record<
  (typeof POSITIONS_LOWER)[number],
  (typeof POSITIONS)[number]
> = {
  pg: "PG",
  sg: "SG",
  sf: "SF",
  pf: "PF",
  c: "C",
} as const;

export const POSITION_FULL_LABELS: Record<
  (typeof POSITIONS_LOWER)[number],
  string
> = {
  pg: "Point Guard",
  sg: "Shooting Guard",
  sf: "Small Forward",
  pf: "Power Forward",
  c: "Center",
} as const;

export const VALUE_SHADOWS: Record<number, string> = {
  5: "shadow-[0px_0px_10px_3px_#99fcff]",
  4: "shadow-[0px_0px_10px_3px_#8317e8]",
  3: "shadow-[0px_0px_10px_3px_#e3b920]",
  2: "shadow-[0px_0px_10px_3px_#c0c0c0]",
  1: "shadow-[0px_0px_10px_3px_#804a14]",
};

export const VALUE_SHADOWS_LARGE: Record<number, string> = {
  5: "shadow-[0px_0px_20px_5px_#99fcff]",
  4: "shadow-[0px_0px_20px_5px_#8317e8]",
  3: "shadow-[0px_0px_20px_5px_#e3b920]",
  2: "shadow-[0px_0px_20px_5px_#c0c0c0]",
  1: "shadow-[0px_0px_20px_5px_#804a14]",
};

export const VALUE_LABELS: Record<number, string> = {
  5: "Diamond",
  4: "Amethyst",
  3: "Gold",
  2: "Silver",
  1: "Bronze",
};

export const BUDGET_LIMIT = 15;

export const RATING_MIN = 0.01;
export const RATING_MAX = 10;
export const RATING_STEP = 0.01;
export const RATING_DEFAULT = 5;

export const RATING_COLORS = [
  { at: 0.01, hex: "#7f1d1d" },
  { at: 2.5, hex: "#ea580c" },
  { at: 5, hex: "#eab308" },
  { at: 7.5, hex: "#22c55e" },
  { at: 10, hex: "#99fcff" },
] as const;

export type Position = (typeof POSITIONS)[number];
export type PositionLower = (typeof POSITIONS_LOWER)[number];

export type PositionSlots = Record<Position, PlayerType | null>;

export const INITIAL_POSITION_SLOTS: PositionSlots = {
  PG: null,
  SG: null,
  SF: null,
  PF: null,
  C: null,
};

export type SortOption = "newest" | "oldest" | "highest-rated" | "most-rated";

export const SORT_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest-rated", label: "Highest Rated" },
  { value: "most-rated", label: "Most Rated" },
] as const;

export const SORT_OPTIONS_BASIC: readonly {
  value: Extract<SortOption, "newest" | "oldest">;
  label: string;
}[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
] as const;
