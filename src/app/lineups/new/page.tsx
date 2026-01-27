"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlayerSelector } from "~/app/_components/PlayerSelector";
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

    createLineup.mutate({
      pgId: getId(selectedPlayers[0]),
      sgId: getId(selectedPlayers[1]),
      sfId: getId(selectedPlayers[2]),
      pfId: getId(selectedPlayers[3]),
      cId: getId(selectedPlayers[4]),
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/lineups"
              className="mb-2 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white/80"
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
            <h1 className="text-3xl font-bold text-white">Create New Lineup</h1>
            <p className="mt-1 text-white/60">
              Select 5 players within your $15 budget
            </p>
          </div>
        </div>

        {/* Player Selector */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-500" />
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
