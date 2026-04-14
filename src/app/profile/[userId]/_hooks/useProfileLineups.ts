"use client";

import { useState, useCallback } from "react";
import { api } from "~/trpc/react";
import type { SortOption } from "~/lib/constants";
import { useViewModeStore } from "~/stores/viewMode";
import { useLineupFilters } from "~/hooks/useLineupFilters";

export function useProfileLineups(userId: string) {
  const [sort, setSort] = useState<SortOption>("newest");
  const { view, setView } = useViewModeStore();
  const { filters, setFilters, filterParams, activeFilterCount } =
    useLineupFilters();

  const {
    data: lineupsData,
    isLoading: lineupsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.lineup.getLineupsByUser.useInfiniteQuery(
    { userId, sort, ...filterParams },
    {
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.cursor : undefined,
    },
  );

  const lineups = lineupsData?.pages.flatMap((p) => p.lineups) ?? [];

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  return {
    sort,
    setSort,
    view,
    setView,
    filters,
    setFilters,
    activeFilterCount,
    lineups,
    lineupsLoading,
    handleFetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}
