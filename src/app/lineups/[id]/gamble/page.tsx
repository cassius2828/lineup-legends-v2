"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { type PlayerType, type GambleResultData } from "~/lib/types";
import { PlayerImage } from "~/app/_components/PlayerImage";
import { POSITIONS_LOWER, POSITION_LABELS, VALUE_SHADOWS } from "~/lib/constants";
import { GambleReveal } from "./_components/GambleReveal";

type PageView = "selection" | "animating" | "result";

export default function GambleLineupPage() {
  const params = useParams();
  const lineupId = typeof params.id === "string" ? params.id : "";

  const [selectedPosition, setSelectedPosition] = useState<
    (typeof POSITIONS_LOWER)[number] | null
  >(null);
  const [gambleResult, setGambleResult] = useState<GambleResultData | null>(
    null,
  );
  const [view, setView] = useState<PageView>("selection");

  const utils = api.useUtils();

  const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery({
    id: lineupId,
  });

  const gambleMutation = api.lineup.gamble.useMutation({
    onSuccess: (data) => {
      setGambleResult({
        previousPlayer: data.previousPlayer as PlayerType,
        newPlayer: data.newPlayer as PlayerType,
        outcomeTier: data.outcome.outcomeTier,
        valueChange: data.outcome.valueChange,
      });
      setView("animating");
      void utils.lineup.getLineupById.invalidate({ id: lineupId });
      void utils.lineup.getLineupsByCurrentUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleGamble = () => {
    if (!selectedPosition) return;
    gambleMutation.mutate({ lineupId, position: selectedPosition });
  };

  const handleAnimationComplete = useCallback(() => {
    setView("result");
  }, []);

  const handleReset = () => {
    setGambleResult(null);
    setSelectedPosition(null);
    setView("selection");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
        <div className="flex h-64 items-center justify-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-foreground/20 border-t-gold" />
        </div>
      </main>
    );
  }

  if (!lineup) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Lineup not found
          </h1>
          <Link
            href="/lineups"
            className="text-gold hover:text-gold-light mt-4 hover:underline"
          >
            Back to My Lineups
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/lineups"
            className="mb-2 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground/80"
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
          <h1 className="text-3xl font-bold text-foreground">
            <span className="text-gold">Gamble</span> a Player
          </h1>
          <p className="mt-1 text-foreground/60">
            Trade a player for a random player of similar value
          </p>
        </div>

        {/* Animation View */}
        {view === "animating" && gambleResult && (
          <div className="mb-8 rounded-2xl bg-surface-800/80 p-6">
            <GambleReveal
              previousPlayer={gambleResult.previousPlayer}
              newPlayer={gambleResult.newPlayer}
              outcomeTier={gambleResult.outcomeTier}
              valueChange={gambleResult.valueChange}
              onComplete={handleAnimationComplete}
            />
          </div>
        )}

        {/* Final Result View */}
        {view === "result" && gambleResult && (
          <div className="mb-8 rounded-2xl bg-surface-800/80 p-6">
            <h2 className="mb-6 text-center text-xl font-bold text-foreground">
              Gamble Result
            </h2>

            <div className="flex items-center justify-center gap-8">
              {/* Previous Player */}
              <div className="text-center opacity-50">
                <div
                  className={`relative mx-auto h-20 w-20 overflow-hidden rounded-full grayscale ${VALUE_SHADOWS[gambleResult.previousPlayer.value] ?? "shadow"}`}
                >
                  <PlayerImage
                    imgUrl={gambleResult.previousPlayer.imgUrl}
                    alt={`${gambleResult.previousPlayer.firstName} ${gambleResult.previousPlayer.lastName}`}
                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                  />
                </div>
                <p className="mt-2 font-semibold text-foreground line-through">
                  {gambleResult.previousPlayer.firstName}
                </p>
                <p className="text-sm text-foreground/50">
                  ${gambleResult.previousPlayer.value}
                </p>
              </div>

              {/* Arrow */}
              <div className="text-gold text-4xl">→</div>

              {/* New Player */}
              <div className="text-center">
                <div
                  className={`border-gold relative mx-auto h-20 w-20 overflow-hidden rounded-full border-4 ${VALUE_SHADOWS[gambleResult.newPlayer.value] ?? "shadow"}`}
                >
                  <PlayerImage
                    imgUrl={gambleResult.newPlayer.imgUrl}
                    alt={`${gambleResult.newPlayer.firstName} ${gambleResult.newPlayer.lastName}`}
                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                  />
                  {gambleResult.valueChange > 0 && (
                    <span className="absolute -top-2 -right-2 rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-foreground">
                      +{gambleResult.valueChange}
                    </span>
                  )}
                  {gambleResult.valueChange < 0 && (
                    <span className="absolute -top-2 -right-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-foreground">
                      {gambleResult.valueChange}
                    </span>
                  )}
                </div>
                <p className="mt-2 font-semibold text-foreground">
                  {gambleResult.newPlayer.firstName}{" "}
                  {gambleResult.newPlayer.lastName}
                </p>
                <p className="text-gold text-sm font-semibold">
                  ${gambleResult.newPlayer.value}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg bg-gold py-3 font-semibold text-black transition-colors hover:bg-gold-light"
              >
                Gamble Again
              </button>
              <Link
                href="/lineups"
                className="flex-1 rounded-lg bg-foreground/10 py-3 text-center font-medium text-foreground transition-colors hover:bg-foreground/20"
              >
                Done
              </Link>
            </div>
          </div>
        )}

        {/* Selection View */}
        {view === "selection" && (
          <>
            {/* Select Position */}
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Select a player to gamble:
              </h2>
              <div className="flex gap-3 overflow-x-auto">
                {POSITIONS_LOWER.map((pos) => {
                  const player =
                    lineup.players[pos as keyof typeof lineup.players];
                  const isSelected = selectedPosition === pos;

                  return (
                    <button
                      key={pos}
                      onClick={() => setSelectedPosition(pos)}
                      className={`min-w-[5rem] shrink-0 grow basis-0 rounded-xl p-3 transition-all ${
                        isSelected
                          ? "bg-gold/20 ring-2 ring-gold"
                          : "bg-surface-800/80 hover:bg-surface-700"
                      }`}
                    >
                      <span className="mb-1 block text-xs font-bold text-foreground/50">
                        {POSITION_LABELS[pos]}
                      </span>
                      <div
                        className={`relative mx-auto h-16 w-16 overflow-hidden rounded-full ${VALUE_SHADOWS[player.value] ?? "shadow"}`}
                      >
                        <PlayerImage
                          imgUrl={player.imgUrl ?? undefined}
                          alt={`${player?.firstName ?? ""} ${player?.lastName ?? ""}`}
                          className="absolute inset-0 h-full w-full rounded-full object-cover"
                        />
                      </div>
                      <p className="mt-2 truncate text-sm font-medium text-foreground">
                        {player.firstName}
                      </p>
                      <p className="text-gold text-xs">
                        ${player.value}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Player Info */}
            {selectedPosition && (
              <div className="mb-6 rounded-xl bg-surface-800/80 p-4">
                <p className="text-sm text-foreground/60">
                  Gambling{" "}
                  <strong className="text-foreground">
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
                className="flex-1 rounded-lg bg-foreground/10 py-3 text-center font-medium text-foreground transition-colors hover:bg-foreground/20"
              >
                Cancel
              </Link>
              <button
                onClick={handleGamble}
                disabled={!selectedPosition || gambleMutation.isPending}
                className="flex-1 rounded-lg bg-gold py-3 font-semibold text-black transition-colors hover:bg-gold-light disabled:opacity-50"
              >
                {gambleMutation.isPending ? "Gambling..." : "🎲 Gamble!"}
              </button>
            </div>
          </>
        )}

        {/* Times gambled */}
        <p className="mt-6 text-center text-sm text-foreground/40">
          This lineup has been gambled {lineup.timesGambled} time
          {lineup.timesGambled !== 1 ? "s" : ""}
        </p>
      </div>
    </main>
  );
}
