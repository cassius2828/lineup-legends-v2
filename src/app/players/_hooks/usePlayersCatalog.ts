import { useMemo } from "react";
import Fuse, { type FuseResult } from "fuse.js";
import { api } from "~/trpc/react";
import { usePlayerFiltersStore } from "~/stores/playerFilters";
import type { PlayerOutput } from "~/server/api/schemas/output";
import { INITIAL_COUNT, PAGE_SIZE } from "../_lib/constants";

/**
 * Fuse returns `{ item, refIndex, ... }`; unfiltered lists are plain `PlayerOutput`.
 * The grid always receives normalized `PlayerOutput` rows.
 */
function flattenCatalogRow(
  result: FuseResult<PlayerOutput> | PlayerOutput,
): PlayerOutput {
  return "item" in result ? result.item : result;
}

/**
 * Client-side players browse: full roster from `player.getAll`, search via Fuse,
 * tier filter, and windowed display (initial teaser vs paginated “show all” / search).
 * Filter UI state lives in `usePlayerFiltersStore` so it survives navigation (e.g. back from a player).
 */
export function usePlayersCatalog() {
  // ─── Persisted UI state (Zustand) ─────────────────────────────────────────
  const {
    searchQuery,
    setSearchQuery,
    valueFilter,
    setValueFilter,
    expanded,
    setExpanded,
    currentPage,
    setCurrentPage,
  } = usePlayerFiltersStore();

  // ─── Source data ──────────────────────────────────────────────────────────
  const { data: allPlayers, isLoading } = api.player.getAll.useQuery();

  // ─── Fuzzy name search (only used when `searchQuery` is non-empty) ────────
  const fuse = useMemo(
    () =>
      allPlayers
        ? new Fuse(allPlayers, {
            keys: ["firstName", "lastName"],
            threshold: 0.3,
          })
        : null,
    [allPlayers],
  );

  const searchResults = fuse?.search(searchQuery);
  const isSearching = searchQuery.length > 0;

  // ─── Tier filter ($1–$5): intersects with Fuse hits or full list ─────────
  const filteredResults = valueFilter
    ? searchResults?.filter((p) => p.item.value === valueFilter)
    : searchResults;

  const defaultPlayers = valueFilter
    ? allPlayers?.filter((p) => p.value === valueFilter)
    : allPlayers;

  // ─── Empty state: user typed a query and Fuse returned nothing ───────────
  const noResults = !isLoading && searchResults?.length === 0 && isSearching;

  // ─── Single stream to paginate: either search pipeline or browse-all ─────
  const allDisplayable = isSearching ? filteredResults : defaultPlayers;
  const totalCount = allDisplayable?.length ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ─── Window into `allDisplayable`: teaser vs full pages ──────────────────
  // Not searching + not expanded: first INITIAL_COUNT only (“Showing N of total”).
  // Searching or expanded: slice by PAGE_SIZE and currentPage.
  const displayPlayersRaw = useMemo(() => {
    if (!allDisplayable) return undefined;
    if (!isSearching && !expanded) {
      return allDisplayable.slice(0, INITIAL_COUNT);
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    return allDisplayable.slice(start, start + PAGE_SIZE);
  }, [allDisplayable, isSearching, expanded, currentPage]);

  const players = useMemo(
    () => displayPlayersRaw?.map(flattenCatalogRow),
    [displayPlayersRaw],
  );

  // ─── Footer controls ──────────────────────────────────────────────────────
  const showShowMore = !isSearching && !expanded && totalCount > INITIAL_COUNT;
  const showPagination = (isSearching || expanded) && totalPages > 1;

  const handleShowMore = () => {
    setExpanded(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Copy for “Showing …” / “N players found” above the grid ────────────
  const summaryText = (() => {
    if (!players?.length) return null;
    if (!isSearching && !expanded) {
      return `Showing ${players.length} of ${totalCount} players`;
    }
    if (isSearching) {
      return `${totalCount} player${totalCount !== 1 ? "s" : ""} found`;
    }
    return `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, totalCount)} of ${totalCount} players`;
  })();

  return {
    searchQuery,
    setSearchQuery,
    valueFilter,
    setValueFilter,
    isLoading,
    noResults,
    players,
    totalCount,
    isSearching,
    showShowMore,
    showPagination,
    currentPage,
    totalPages,
    handleShowMore,
    handlePageChange,
    summaryText,
  };
}
