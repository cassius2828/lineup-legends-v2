import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useLineupFilters } from "~/hooks/useLineupFilters";
import { useViewModeStore } from "~/stores/viewMode";
import type { SortOption } from "~/lib/constants";

export function useMyLineupsPage() {
  const [sort, setSort] = useState<SortOption>("newest");
  const { view, setView } = useViewModeStore();
  const { filters, setFilters, filterParams, activeFilterCount } =
    useLineupFilters();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const utils = api.useUtils();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.lineup.getLineupsByCurrentUser.useInfiniteQuery(
      { sort, ...filterParams },
      {
        getNextPageParam: (lastPage) =>
          lastPage.hasMore ? lastPage.cursor : undefined,
      },
    );

  const lineups = data?.pages.flatMap((p) => p.lineups) ?? [];

  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });

  const deleteLineup = api.lineup.delete.useMutation({
    onSuccess: () => {
      void utils.lineup.getLineupsByCurrentUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleFeatured = api.lineup.toggleFeatured.useMutation({
    onSuccess: () => {
      void utils.lineup.getLineupsByCurrentUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteLineup.mutate({ id: deleteTarget });
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleToggleFeatured = (id: string) => {
    toggleFeatured.mutate({ id });
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
    activeFilterCount,
    lineups,
    isLoading,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    handleFetchNextPage,
    session,
    deleteTarget,
    deleteLineup,
    handleDelete,
    confirmDelete,
    cancelDelete,
    handleToggleFeatured,
  };
}
