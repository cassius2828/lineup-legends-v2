"use client";

import Fuse from "fuse.js";
import { useState } from "react";
import { api } from "~/trpc/react";
import { PlayerImage } from "~/app/_components/PlayerImage";

const valueShadows: Record<number, string> = {
  5: "shadow-[0px_0px_10px_3px_#99fcff]",
  4: "shadow-[0px_0px_10px_3px_#8317e8]",
  3: "shadow-[0px_0px_10px_3px_#e3b920]",
  2: "shadow-[0px_0px_10px_3px_#c0c0c0]",
  1: "shadow-[0px_0px_10px_3px_#804a14]",
};

const valueLabels: Record<number, string> = {
  5: "Diamond",
  4: "Amethyst",
  3: "Gold",
  2: "Silver",
  1: "Bronze",
};

const INITIAL_COUNT = 10;
const PAGE_SIZE = 50;

function getPaginationRange(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [valueFilter, setValueFilter] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: allPlayers, isLoading } = api.player.getAll.useQuery();

  const fuse = allPlayers
    ? new Fuse(allPlayers, {
        keys: ["firstName", "lastName"],
        threshold: 0.3,
      })
    : null;

  const searchResults = fuse?.search(searchQuery);

  const isSearching = searchQuery.length > 0;

  const filteredResults = valueFilter
    ? searchResults?.filter((p) => p.item.value === valueFilter)
    : searchResults;

  const defaultPlayers = valueFilter
    ? allPlayers?.filter((p) => p.value === valueFilter)
    : allPlayers;

  const noResults = !isLoading && searchResults?.length === 0 && isSearching;

  const allDisplayable = isSearching ? filteredResults : defaultPlayers;
  const totalCount = allDisplayable?.length ?? 0;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const displayPlayers = (() => {
    if (!allDisplayable) return undefined;
    if (!isSearching && !expanded) {
      return allDisplayable.slice(0, INITIAL_COUNT);
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    return allDisplayable.slice(start, start + PAGE_SIZE);
  })();

  const showShowMore = !isSearching && !expanded && totalCount > INITIAL_COUNT;
  const showPagination =
    (isSearching || expanded) && totalPages > 1;

  const handleShowMore = () => {
    setExpanded(true);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleValueFilterChange = (value: number | null) => {
    setValueFilter(value);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Players</h1>
          <p className="mt-1 text-foreground/50">
            Browse all NBA players available for your lineups
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by player name..."
            className="w-full rounded-xl border border-foreground/10 bg-foreground/5 py-3.5 pl-12 pr-4 text-foreground placeholder-foreground/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        {/* Value Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => handleValueFilterChange(null)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              valueFilter === null
                ? "bg-gold text-black"
                : "bg-foreground/10 text-foreground hover:bg-foreground/20"
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((value) => (
            <button
              key={value}
              onClick={() => handleValueFilterChange(value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                valueFilter === value
                  ? "bg-gold text-black"
                  : "bg-foreground/10 text-foreground hover:bg-foreground/20"
              }`}
            >
              ${value} &middot; {valueLabels[value]}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-foreground/20 border-t-gold" />
              <p className="text-foreground/60">Loading players...</p>
            </div>
          </div>
        ) : noResults ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <svg
              className="mb-4 h-16 w-16 text-foreground/20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-foreground/70">
              No players found
            </h3>
            <p className="mt-1 text-foreground/50">
              Try a different search or filter
            </p>
          </div>
        ) : displayPlayers && displayPlayers.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-foreground/50">
              {!isSearching && !expanded
                ? `Showing ${displayPlayers.length} of ${totalCount} players`
                : isSearching
                  ? `${totalCount} player${totalCount !== 1 ? "s" : ""} found`
                  : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, totalCount)} of ${totalCount} players`}
            </p>
            <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {displayPlayers.map((result) => {
                const player = "item" in result ? result.item : result;
                return (
                  <div
                    key={player._id?.toString()}
                    className="group flex flex-col items-center"
                  >
                    <div
                      className={`relative h-24 w-24 overflow-hidden bg-[#f2f2f2] transition-all duration-200 sm:h-28 sm:w-28 ${
                        valueShadows[player.value ?? 0]
                      } group-hover:scale-105`}
                    >
                      <PlayerImage
                        imgUrl={player.imgUrl ?? undefined}
                        alt={`${player.firstName ?? ""} ${player.lastName ?? ""}`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-medium text-foreground">
                        {player.firstName}
                      </p>
                      <p className="text-sm text-foreground/80">
                        {player.lastName}
                      </p>
                      <p className="text-gold mt-1 text-xs font-medium">
                        ${player.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show More Button */}
            {showShowMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleShowMore}
                  className="rounded-xl border border-foreground/10 bg-foreground/5 px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
                >
                  Show all {totalCount} players
                </button>
              </div>
            )}

            {/* Pagination */}
            {showPagination && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:pointer-events-none disabled:opacity-30"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {getPaginationRange(currentPage, totalPages).map((page, i) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-sm text-foreground/40"
                    >
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`min-w-[36px] rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-gold text-black"
                          : "text-foreground hover:bg-foreground/10"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:pointer-events-none disabled:opacity-30"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
