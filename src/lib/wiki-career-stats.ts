/** Keys match Wikipedia-derived `wikiCareerRegularSeason` (server) and UI labels. */
export const WIKI_CAREER_STATS_ORDER = [
  { key: "points", label: "Points" },
  { key: "assists", label: "Assists" },
  { key: "rebounds", label: "Rebounds" },
  { key: "threePointPct", label: "Three-point %" },
  { key: "fieldGoalPct", label: "Field goal %" },
  { key: "freeThrowPct", label: "Free throw %" },
  { key: "steals", label: "Steals" },
  { key: "blocks", label: "Blocks" },
] as const;

export type WikiCareerStatKey = (typeof WIKI_CAREER_STATS_ORDER)[number]["key"];
