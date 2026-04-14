import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { useLineupFilters } from "~/hooks/useLineupFilters";
import { useViewModeStore } from "~/stores/viewMode";
import type { SortOption } from "~/lib/constants";

export function useExplorePage() {
  const [sort, setSort] = useState<SortOption>("newest");
  const { view, setView } = useViewModeStore();
  const { filters, setFilters, filterParams, activeFilterCount } =
    useLineupFilters();
  const utils = api.useUtils();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.lineup.getLineupsByOtherUsers.useInfiniteQuery(
      {
        sort,
        excludeUserId: session?.user?.id,
        ...filterParams,
      },
      {
        getNextPageParam: (lastPage) =>
          lastPage.hasMore ? lastPage.cursor : undefined,
      },
    );

  const lineups = data?.pages.flatMap((p) => p.lineups) ?? [];

  const listQueryKey = useMemo(
    () =>
      JSON.stringify({
        sort,
        excludeUserId: session?.user?.id ?? null,
        ...filterParams,
      }),
    [sort, session?.user?.id, filterParams],
  );

  const handleRefreshAllLineups = () => {
    void utils.lineup.getLineupsByOtherUsers.invalidate();
  };

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
    filterParams,
    activeFilterCount,
    session,
    isAuthenticated,
    lineups,
    isLoading,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    handleFetchNextPage,
    handleRefreshAllLineups,
    listQueryKey,
  };
}
