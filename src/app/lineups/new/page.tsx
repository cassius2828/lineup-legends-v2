"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PlayerSelector } from "~/app/_components/CreateNew/PlayerSelector";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { getId } from "~/lib/types";
import type { PlayerOutput } from "~/server/api/schemas/output";

export default function CreateLineupPage() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { data: playersByValue, isLoading } =
    api.player.getRandomByValue.useQuery();

  const createLineup = api.lineup.create.useMutation({
    onSuccess: () => {
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

  return (
    <main className="min-h-screen bg-surface-950">
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/lineups"
          className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground/80"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to My Lineups
        </Link>

        {/* Player Selector */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="border-t-gold mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-foreground/20" />
              <p className="text-foreground/60">Loading players...</p>
            </div>
          </div>
        ) : playersByValue ? (
          <PlayerSelector
            playersByValue={playersByValue}
            onSubmit={handleSubmit}
            isSubmitting={createLineup.isPending}
            isAuthenticated={isAuthenticated}
          />
        ) : (
          <div className="rounded-xl bg-red-500/20 p-6 text-center">
            <p className="text-red-400">
              Failed to load players. Please try again.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
