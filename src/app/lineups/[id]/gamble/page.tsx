"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { type PlayerType } from "~/lib/types";
import { PlayerImage } from "~/app/_components/PlayerImage";

const POSITIONS = ["pg", "sg", "sf", "pf", "c"] as const;

// Value-based box-shadow glow colors matching original design
const valueShadows: Record<number, string> = {
  5: "shadow-[0px_0px_10px_3px_#99fcff]", // Light blue diamond
  4: "shadow-[0px_0px_10px_3px_#8317e8]", // Purple
  3: "shadow-[0px_0px_10px_3px_#e3b920]", // Gold
  2: "shadow-[0px_0px_10px_3px_#c0c0c0]", // Silver
  1: "shadow-[0px_0px_10px_3px_#804a14]", // Bronze
};

const POSITION_LABELS = {
  pg: "PG",
  sg: "SG",
  sf: "SF",
  pf: "PF",
  c: "C",
};

export default function GambleLineupPage() {
  const params = useParams();
  const lineupId = typeof params.id === "string" ? params.id : "";

  const [selectedPosition, setSelectedPosition] = useState<
    (typeof POSITIONS)[number] | null
  >(null);
  const [gambleResult, setGambleResult] = useState<{
    previousPlayer: PlayerType;
    newPlayer: PlayerType;
  } | null>(null);

  const {
    data: lineup,
    isLoading,
    refetch,
  } = api.lineup.getLineupById.useQuery({ id: lineupId });

  const gambleMutation = api.lineup.gamble.useMutation({
    onSuccess: (data) => {
      setGambleResult({
        previousPlayer: data.previousPlayer,
        newPlayer: data.newPlayer,
      });
      void refetch();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleGamble = () => {
    if (!selectedPosition) return;
    gambleMutation.mutate({ lineupId, position: selectedPosition });
  };

  const handleReset = () => {
    setGambleResult(null);
    setSelectedPosition(null);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-green-900/20 to-slate-900">
        <div className="flex h-64 items-center justify-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-green-500" />
        </div>
      </main>
    );
  }

  if (!lineup) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 via-green-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white">Lineup not found</h1>
          <Link href="/lineups" className="mt-4 text-green-400 hover:underline">
            Back to My Lineups
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-green-900/20 to-slate-900">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
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
          <h1 className="text-3xl font-bold text-white">
            <span className="text-green-400">Gamble</span> a Player
          </h1>
          <p className="mt-1 text-white/60">
            Trade a player for a random player of similar value
          </p>
        </div>

        {/* Gamble Result */}
        {gambleResult ? (
          <div className="mb-8 rounded-2xl bg-slate-800/80 p-6">
            <h2 className="mb-6 text-center text-xl font-bold text-white">
              Gamble Result
            </h2>

            <div className="flex items-center justify-center gap-8">
              {/* Previous Player */}
              <div className="text-center opacity-50">
                <div
                  className={`relative mx-auto h-20 w-20 overflow-hidden rounded-full grayscale ${valueShadows[gambleResult.previousPlayer.value] ?? "shadow"}`}
                >
                  <PlayerImage
                    imgUrl={gambleResult.previousPlayer.imgUrl}
                    alt={`${gambleResult.previousPlayer.firstName} ${gambleResult.previousPlayer.lastName}`}
                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                  />
                </div>
                <p className="mt-2 font-semibold text-white line-through">
                  {gambleResult.previousPlayer.firstName}
                </p>
                <p className="text-sm text-white/50">
                  ${gambleResult.previousPlayer.value}
                </p>
              </div>

              {/* Arrow */}
              <div className="text-4xl text-green-400">→</div>

              {/* New Player */}
              <div className="text-center">
                <div
                  className={`relative mx-auto h-20 w-20 overflow-hidden rounded-full border-4 border-green-500 ${valueShadows[gambleResult.newPlayer.value] ?? "shadow"}`}
                >
                  <PlayerImage
                    imgUrl={gambleResult.newPlayer.imgUrl}
                    alt={`${gambleResult.newPlayer.firstName} ${gambleResult.newPlayer.lastName}`}
                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                  />
                  {gambleResult.newPlayer.value >
                    gambleResult.previousPlayer.value && (
                    <span className="absolute -top-2 -right-2 rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-white">
                      +
                      {gambleResult.newPlayer.value -
                        gambleResult.previousPlayer.value}
                    </span>
                  )}
                  {gambleResult.newPlayer.value <
                    gambleResult.previousPlayer.value && (
                    <span className="absolute -top-2 -right-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                      {gambleResult.newPlayer.value -
                        gambleResult.previousPlayer.value}
                    </span>
                  )}
                </div>
                <p className="mt-2 font-semibold text-white">
                  {gambleResult.newPlayer.firstName}{" "}
                  {gambleResult.newPlayer.lastName}
                </p>
                <p className="text-sm font-semibold text-green-400">
                  ${gambleResult.newPlayer.value}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg bg-green-500 py-3 font-semibold text-white transition-colors hover:bg-green-400"
              >
                Gamble Again
              </button>
              <Link
                href="/lineups"
                className="flex-1 rounded-lg bg-white/10 py-3 text-center font-medium text-white transition-colors hover:bg-white/20"
              >
                Done
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Select Position */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Select a player to gamble:
              </h2>
              <div className="grid grid-cols-5 gap-3">
                {POSITIONS.map((pos) => {
                  const player =
                    lineup.players[pos as keyof typeof lineup.players];
                  const isSelected = selectedPosition === pos;

                  return (
                    <button
                      key={pos}
                      onClick={() => setSelectedPosition(pos)}
                      className={`rounded-xl p-3 transition-all ${
                        isSelected
                          ? "bg-green-500/30 ring-2 ring-green-500"
                          : "bg-slate-800/80 hover:bg-slate-800"
                      }`}
                    >
                      <span className="mb-1 block text-xs font-bold text-white/50">
                        {POSITION_LABELS[pos]}
                      </span>
                      <div
                        className={`relative mx-auto h-16 w-16 overflow-hidden rounded-full ${valueShadows[player.value] ?? "shadow"}`}
                      >
                        <PlayerImage
                          imgUrl={player.imgUrl ?? undefined}
                          alt={`${player?.firstName ?? ""} ${player?.lastName ?? ""}`}
                          className="absolute inset-0 h-full w-full rounded-full object-cover"
                        />
                      </div>
                      <p className="mt-2 truncate text-sm font-medium text-white">
                        {player.firstName}
                      </p>
                      <p className="text-xs text-green-400">${player.value}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Player Info */}
            {selectedPosition && (
              <div className="mb-6 rounded-xl bg-slate-800/80 p-4">
                <p className="text-sm text-white/60">
                  Gambling{" "}
                  <strong className="text-white">
                    {lineup.players[selectedPosition]?.firstName}{" "}
                    {lineup.players[selectedPosition]?.lastName}
                  </strong>{" "}
                  (${lineup.players[selectedPosition]?.value})
                </p>
              </div>
            )}

            {/* Gamble Button */}
            <div className="flex gap-3">
              <Link
                href="/lineups"
                className="flex-1 rounded-lg bg-white/10 py-3 text-center font-medium text-white transition-colors hover:bg-white/20"
              >
                Cancel
              </Link>
              <button
                onClick={handleGamble}
                disabled={!selectedPosition || gambleMutation.isPending}
                className="flex-1 rounded-lg bg-green-500 py-3 font-semibold text-white transition-colors hover:bg-green-400 disabled:opacity-50"
              >
                {gambleMutation.isPending ? "Gambling..." : "🎲 Gamble!"}
              </button>
            </div>
          </>
        )}

        {/* Times gambled */}
        <p className="mt-6 text-center text-sm text-white/40">
          This lineup has been gambled {lineup.timesGambled} time
          {lineup.timesGambled !== 1 ? "s" : ""}
        </p>
      </div>
    </main>
  );
}
