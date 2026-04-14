import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useLineupBuilderStore } from "~/stores/lineupBuilder";
import type { PlayerOutput } from "~/server/api/schemas/output";

function makeSkeletonPlayer(value: number, index: number): PlayerOutput {
  return {
    _id: `skeleton-${value}-${index}`,
    firstName: "--",
    lastName: "--",
    imgUrl: "",
    value,
  };
}

const SKELETON_PLAYERS_BY_VALUE = {
  value1Players: Array.from({ length: 5 }, (_, i) => makeSkeletonPlayer(1, i)),
  value2Players: Array.from({ length: 5 }, (_, i) => makeSkeletonPlayer(2, i)),
  value3Players: Array.from({ length: 5 }, (_, i) => makeSkeletonPlayer(3, i)),
  value4Players: Array.from({ length: 5 }, (_, i) => makeSkeletonPlayer(4, i)),
  value5Players: Array.from({ length: 5 }, (_, i) => makeSkeletonPlayer(5, i)),
};

export function useNewLineupPage() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const utils = api.useUtils();

  const { playerPool, setPlayerPool, clearPlayerPool } =
    useLineupBuilderStore();
  const hasPersistedPool = playerPool !== null;

  const {
    data: fetchedPool,
    isLoading: isFetchLoading,
    isError,
  } = api.player.getRandomByValue.useQuery(undefined, {
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !hasPersistedPool,
    initialData: hasPersistedPool ? playerPool : undefined,
  });

  // Persist fetched data to Zustand when it arrives from the server
  const resolvedPool = hasPersistedPool ? playerPool : fetchedPool;
  if (resolvedPool && !hasPersistedPool && fetchedPool) {
    setPlayerPool(fetchedPool);
  }

  const isLoading = !hasPersistedPool && isFetchLoading;

  // --- Refresh logic ---
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: refreshStatus } = api.player.canRefreshPool.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  const canRefresh = !isAuthenticated || (refreshStatus?.canRefresh ?? false);
  const nextRefreshAt = refreshStatus?.nextRefreshAt ?? null;

  const refreshMutation = api.player.refreshRandomByValue.useMutation();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (isAuthenticated) {
        const newPool = await refreshMutation.mutateAsync();
        if (newPool) {
          setPlayerPool(newPool);
          utils.player.getRandomByValue.setData(undefined, newPool);
        }
        void utils.player.canRefreshPool.invalidate();
      } else {
        const newPool = await utils.player.getRandomByValue.fetch(undefined, {
          staleTime: 0,
        });
        if (newPool) {
          setPlayerPool(newPool);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [
    isAuthenticated,
    refreshMutation,
    setPlayerPool,
    utils.player.getRandomByValue,
    utils.player.canRefreshPool,
  ]);

  // --- Create lineup ---
  const createLineup = api.lineup.create.useMutation({
    onSuccess: () => {
      clearPlayerPool();
      void utils.player.getRandomByValue.invalidate();
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

  const displayData = resolvedPool ?? SKELETON_PLAYERS_BY_VALUE;

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
    isRefreshing,
  };
}
