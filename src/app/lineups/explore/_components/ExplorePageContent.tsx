"use client";

import { Search } from "lucide-react";
import { SORT_OPTIONS } from "~/lib/constants";
import { RefreshIcon } from "~/app/_components/common/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/common/ui/tooltip";
import { useExplorePage } from "../_hooks/useExplorePage";
import { LineupSortBar } from "../../_components/LineupSortBar";
import { LineupFilterRow } from "../../_components/LineupFilterRow";
import { LineupListResults } from "../../_components/LineupListResults";
import { LineupsEmptyState } from "../../_components/LineupsEmptyState";

export function ExplorePageContent() {
  const {
    sort,
    setSort,
    view,
    setView,
    filters,
    setFilters,
    activeFilterCount,
    session,
    isAuthenticated,
    lineups,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    handleFetchNextPage,
    handleRefreshAllLineups,
  } = useExplorePage();

  return (
    <>
      <div className="mb-6 space-y-2">
        <LineupSortBar
          options={SORT_OPTIONS}
          sort={sort}
          onSortChange={(s) => setSort(s as typeof sort)}
          trailing={
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleRefreshAllLineups}
                  className="text-foreground/50 hover:bg-foreground/10 hover:text-foreground/70 flex cursor-pointer items-center justify-center rounded-lg p-1.5 transition-colors"
                >
                  <RefreshIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Refresh lineups</TooltipContent>
            </Tooltip>
          }
        />
        <LineupFilterRow
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
          view={view}
          onViewChange={setView}
          showUserFilter={true}
          excludeUserId={session?.user?.id}
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
            icon={
              <Search
                className="text-foreground/40 h-8 w-8"
                strokeWidth={1.5}
              />
            }
            title="No lineups to explore"
            message="Be the first to create a lineup!"
            ctaHref="/lineups/new"
            ctaLabel="Create a Lineup"
          />
        }
      />
    </>
  );
}
