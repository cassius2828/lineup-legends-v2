"use client";

import { usePlayersCatalog } from "../_hooks/usePlayersCatalog";
import { PlayersLoadingState } from "./PlayersLoadingState";
import { PlayersNoResults } from "./PlayersNoResults";
import { PlayersPageHeader } from "./PlayersPageHeader";
import { PlayersSearchBar } from "./PlayersSearchBar";
import { PlayersTierFilter } from "./PlayersTierFilter";
import { PlayersCatalogResults } from "./PlayersCatalogResults";

export function PlayersPageContent() {
  const catalog = usePlayersCatalog();

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <PlayersPageHeader />
        <PlayersSearchBar
          value={catalog.searchQuery}
          onChange={catalog.setSearchQuery}
        />
        <PlayersTierFilter
          valueFilter={catalog.valueFilter}
          onChange={catalog.setValueFilter}
        />

        {catalog.isLoading ? (
          <PlayersLoadingState />
        ) : catalog.noResults ? (
          <PlayersNoResults />
        ) : (
          <PlayersCatalogResults
            players={catalog.players ?? []}
            totalCount={catalog.totalCount}
            summaryText={catalog.summaryText}
            showShowMore={catalog.showShowMore}
            showPagination={catalog.showPagination}
            currentPage={catalog.currentPage}
            totalPages={catalog.totalPages}
            onShowMore={catalog.handleShowMore}
            onPageChange={catalog.handlePageChange}
          />
        )}
      </div>
    </main>
  );
}
