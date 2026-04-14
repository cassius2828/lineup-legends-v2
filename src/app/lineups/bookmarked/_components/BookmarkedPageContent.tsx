"use client";

import { Bookmark } from "lucide-react";
import { SORT_OPTIONS_BASIC } from "~/lib/constants";
import LineupsHeader from "~/app/_components/Header/LineupsHeader";
import { useBookmarkedPage } from "../_hooks/useBookmarkedPage";
import { LineupSortBar } from "../../_components/LineupSortBar";
import { LineupFilterRow } from "../../_components/LineupFilterRow";
import { LineupListResults } from "../../_components/LineupListResults";
import { LineupsEmptyState } from "../../_components/LineupsEmptyState";

export function BookmarkedPageContent() {
  const {
    sort,
    setSort,
    view,
    setView,
    filters,
    setFilters,
    activeFilterCount,
    session,
    lineups,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    handleFetchNextPage,
  } = useBookmarkedPage();

  return (
    <>
      <LineupsHeader
        title="Bookmarked Lineups"
        description="Lineups you've saved for later"
        exploreLink="/lineups/explore"
        createLink="/lineups/new"
        exploreLinkText="Explore Lineups"
        createLinkText="+ Create Lineup"
      />

      <div className="mb-6 space-y-2">
        <LineupSortBar
          options={SORT_OPTIONS_BASIC}
          sort={sort}
          onSortChange={(s) => setSort(s as typeof sort)}
        />
        <LineupFilterRow
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
          view={view}
          onViewChange={setView}
        />
      </div>

      <LineupListResults
        lineups={lineups}
        isLoading={isLoading}
        view={view}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={handleFetchNextPage}
        showOwner={true}
        isOwner={false}
        currentUserId={session?.user.id ?? ""}
        emptyState={
          <LineupsEmptyState
            icon={<Bookmark className="text-foreground/40 h-8 w-8" />}
            title="No bookmarked lineups"
            message="Bookmark lineups you like to find them here later."
            ctaHref="/lineups/explore"
            ctaLabel="Explore Lineups"
          />
        }
      />
    </>
  );
}
