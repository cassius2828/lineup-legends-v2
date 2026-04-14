"use client";

import { ViewToggle } from "~/app/_components/common/lineups/ViewToggle";
import { Button } from "~/app/_components/common/ui/Button";
import LineupFilters from "~/app/_components/common/lineups/LineupFilters";
import { LineupListResults } from "~/app/lineups/_components/LineupListResults";
import { SORT_OPTIONS, type SortOption } from "~/lib/constants";
import type { LineupOutput } from "~/server/api/schemas/output";
import type { ViewMode } from "~/app/_components/common/lineups/ViewToggle";
import type { LineupFilterState } from "~/hooks/useLineupFilters";

type ProfileLineupsSectionProps = {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  filters: LineupFilterState;
  onFiltersChange: (filters: LineupFilterState) => void;
  activeFilterCount: number;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  lineups: LineupOutput[];
  lineupsLoading: boolean;
  onLoadMore: () => void;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  /** Pre-seed skeleton count from profile stats */
  totalLineups?: number;
  /** Resets skeleton count cache when sort/filters change */
  listQueryKey: string;
};

export function ProfileLineupsSection({
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  activeFilterCount,
  view,
  onViewChange,
  lineups,
  lineupsLoading,
  onLoadMore,
  isFetchingNextPage,
  hasNextPage,
  totalLineups,
  listQueryKey,
}: ProfileLineupsSectionProps) {
  return (
    <div className="pb-16">
      <div className="mb-4 space-y-2">
        <h2 className="text-foreground text-xl font-semibold">Lineups</h2>
        <div className="flex flex-wrap items-center gap-2">
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              color={sort === option.value ? "gold" : "white"}
              variant={sort === option.value ? "solid" : "subtle"}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LineupFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            activeFilterCount={activeFilterCount}
          />
          <div className="ml-auto">
            <ViewToggle view={view} onChange={onViewChange} />
          </div>
        </div>
      </div>

      <LineupListResults
        lineups={lineups}
        isLoading={lineupsLoading}
        listQueryKey={listQueryKey}
        view={view}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore}
        initialCount={totalLineups}
        emptyState={
          <div className="bg-foreground/5 rounded-2xl p-12 text-center">
            <p className="text-foreground/60">No lineups yet</p>
          </div>
        }
      />
    </div>
  );
}
