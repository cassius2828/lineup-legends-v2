import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { SKELETON_PLAYERS_BY_VALUE } from "~/lib/skeletons";
import { useLineupBuilderStore } from "~/stores/lineupBuilder";
import type { PlayerOutput } from "~/server/api/schemas/output";

export function useNewLineupPage() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const utils = api.useUtils();

  const { playerPool, setPlayerPool, clearPlayerPool } =
    useLineupBuilderStore();

  // React Query is a fetch-only mechanism here — disabled once Zustand has data.
  const {
    data: fetchedPool,
    isLoading: isFetchLoading,
    isError,
  } = api.player.getRandomByValue.useQuery(undefined, {
    enabled: playerPool === null,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Persist fetched data to Zustand after the network response arrives.
  // useEffect (not render-path) prevents stale RQ cache from writing back
  // after clearPlayerPool().
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (fetchedPool && playerPool === null) {
      setPlayerPool(fetchedPool);
    }
  }, [fetchedPool]); // playerPool/setPlayerPool intentionally excluded

  const isLoading = playerPool === null && isFetchLoading;

  // --- Refresh logic ---

  const { data: refreshStatus } = api.player.canRefreshPool.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  const canRefresh = !isAuthenticated || (refreshStatus?.canRefresh ?? false);
  const nextRefreshAt = refreshStatus?.nextRefreshAt ?? null;

  const { mutateAsync: refreshMutationAsync, isPending: isRefreshPending } =
    api.player.refreshRandomByValue.useMutation();

  const handleRefresh = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const newPool = await refreshMutationAsync();
        if (newPool) setPlayerPool(newPool);
        void utils.player.canRefreshPool.invalidate();
      } else {
        clearPlayerPool();
      }
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  }, [
    isAuthenticated,
    refreshMutationAsync,
    setPlayerPool,
    clearPlayerPool,
    utils.player.canRefreshPool,
  ]);

  // --- Create lineup ---
  const createLineup = api.lineup.create.useMutation({
    onSuccess: () => {
      void utils.player.getRandomByValue.invalidate();
      clearPlayerPool();
      void utils.lineup.getLineupsByCurrentUser.invalidate();
      router.push("/lineups");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (selectedPlayers: PlayerOutput[]) => {
    if (selectedPlayers.length !== 5) return;
    if (selectedPlayers.some((player) => !player)) return;
    createLineup.mutate({
      players: {
        pg: selectedPlayers[0]!,
        sg: selectedPlayers[1]!,
        sf: selectedPlayers[2]!,
        pf: selectedPlayers[3]!,
        c: selectedPlayers[4]!,
      },
    });
  };

  const displayData = playerPool ?? SKELETON_PLAYERS_BY_VALUE;

  return {
    playersByValue: displayData,
    isLoading,
    isError,
    isAuthenticated,
    isSubmitting: createLineup.isPending,
    handleSubmit,
    handleRefresh,
    canRefresh,
    nextRefreshAt,
    isRefreshPending,
  };
}
