import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { useLineupFilters } from "~/hooks/useLineupFilters";
import { useViewModeStore } from "~/stores/viewMode";

type BookmarkedSortOption = "newest" | "oldest";

export function useBookmarkedPage() {
  const [sort, setSort] = useState<BookmarkedSortOption>("newest");
  const { view, setView } = useViewModeStore();
  const { filters, setFilters, filterParams, activeFilterCount } =
    useLineupFilters();
  const { data: session } = useSession();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.bookmark.getBookmarkedLineups.useInfiniteQuery(
      { sort, ...filterParams },
      {
        getNextPageParam: (lastPage) =>
          lastPage.hasMore ? lastPage.cursor : undefined,
        enabled: !!session?.user,
      },
    );

  const lineups = data?.pages.flatMap((p) => p.lineups) ?? [];

  const listQueryKey = useMemo(
    () => JSON.stringify({ sort, ...filterParams }),
    [sort, filterParams],
  );

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
    session,
    lineups,
    isLoading,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    handleFetchNextPage,
    listQueryKey,
  };
}
