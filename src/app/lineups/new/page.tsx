"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlayerSelector } from "~/app/_components/CreateNew/PlayerSelector";
import { api } from "~/trpc/react";
import { type PlayerType, getId } from "~/lib/types";

export default function CreateLineupPage() {
  const router = useRouter();
  const { data: playersByValue, isLoading } =
    api.player.getRandomByValue.useQuery();

  const createLineup = api.lineup.create.useMutation({
    onSuccess: () => {
      router.push("/lineups");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleSubmit = (selectedPlayers: PlayerType[]) => {
    if (selectedPlayers.length !== 5) return;
    if (selectedPlayers.some((player) => !player)) return;
    createLineup.mutate({
      players: {
        pg: selectedPlayers[0],
        sg: selectedPlayers[1],
        sf: selectedPlayers[2],
        pf: selectedPlayers[3],
        c: selectedPlayers[4],
      },
    });
  };

  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/lineups"
          className="mb-4 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white/80"
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
              <div className="border-t-gold mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20" />
              <p className="text-white/60">Loading players...</p>
            </div>
          </div>
        ) : playersByValue ? (
          <PlayerSelector
            playersByValue={playersByValue}
            onSubmit={handleSubmit}
            isSubmitting={createLineup.isPending}
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
