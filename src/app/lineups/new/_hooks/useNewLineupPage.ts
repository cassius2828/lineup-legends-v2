import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { PlayerOutput } from "~/server/api/schemas/output";

const RANDOM_PLAYERS_QUERY_OPTS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
} as const;

export function useNewLineupPage() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const utils = api.useUtils();

  const { data: playersByValue, isLoading } =
    api.player.getRandomByValue.useQuery(undefined, RANDOM_PLAYERS_QUERY_OPTS);

  const createLineup = api.lineup.create.useMutation({
    onSuccess: () => {
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

  return {
    playersByValue,
    isLoading,
    isAuthenticated,
    isSubmitting: createLineup.isPending,
    handleSubmit,
  };
}
