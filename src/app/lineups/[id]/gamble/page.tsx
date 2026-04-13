"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Button } from "~/app/_components/common/ui/Button";
import BaseModal from "~/app/_components/common/ui/BaseModal";
import { Spinner } from "~/app/_components/common/loaders";
import type {
  PlayerOutput,
  GambleOutcomeTier,
} from "~/server/api/schemas/output";
import { PlayerImage } from "~/app/_components/PlayerImage";
import {
  POSITIONS_LOWER,
  POSITION_LABELS,
  VALUE_SHADOWS,
} from "~/lib/constants";
import { ChevronLeft, Info, Lock } from "lucide-react";
import { GambleReveal } from "./_components/GambleReveal";

type PageView = "selection" | "animating" | "result";

function GambleInfoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <h3 className="text-foreground text-lg font-bold lg:text-2xl">
        How Gambling Works
      </h3>

      <div className="text-foreground/70 mt-4 space-y-3 text-sm leading-relaxed lg:text-lg">
        <div className="flex gap-2">
          <span className="text-gold mt-0.5 shrink-0">&#x2022;</span>
          <p>
            You can gamble{" "}
            <strong className="text-foreground">once per lineup</strong> —
            choose wisely, there are no redos.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-gold mt-0.5 shrink-0">&#x2022;</span>
          <p>
            Select a position to trade that player for a random player. The
            replacement is drawn from a weighted probability pool based on the
            original player&#39;s value.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-gold mt-0.5 shrink-0">&#x2022;</span>
          <p>
            <strong className="text-foreground">Lower-value players</strong>{" "}
            carry higher risk but have the potential for a big upgrade.{" "}
            <strong className="text-foreground">Higher-value players</strong>{" "}
            are safer bets but rarely jump up.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-gold mt-0.5 shrink-0">&#x2022;</span>
          <div>
            <p className="mb-1">Possible outcomes:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
              <span className="text-emerald-400">Jackpot (+3 or +4)</span>
              <span className="text-red-400">Downgrade (-1)</span>
              <span className="text-emerald-400">Big Win (+2)</span>
              <span className="text-red-400">Big Loss (-2)</span>
              <span className="text-emerald-400">Upgrade (+1)</span>
              <span className="text-red-400">Disaster (-3 or -4)</span>
              <span className="text-foreground/50">Neutral (0)</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-gold mt-0.5 shrink-0">&#x2022;</span>
          <p>
            Your gamble streak is tracked across lineups — consecutive upgrades
            or downgrades build your streak.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="bg-gold hover:bg-gold-light rounded-full px-5 py-1.5 text-sm font-semibold text-black transition-colors"
        >
          Got it
        </button>
      </div>
    </BaseModal>
  );
}

export default function GambleLineupPage() {
  const params = useParams();
  const lineupId = typeof params.id === "string" ? params.id : "";

  const [selectedPosition, setSelectedPosition] = useState<
    (typeof POSITIONS_LOWER)[number] | null
  >(null);
  const [gambleResult, setGambleResult] = useState<{
    previousPlayer: PlayerOutput;
    newPlayer: PlayerOutput;
    outcomeTier: GambleOutcomeTier;
    valueChange: number;
  } | null>(null);
  const [view, setView] = useState<PageView>("selection");
  const [showInfo, setShowInfo] = useState(false);

  const utils = api.useUtils();

  const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery({
    id: lineupId,
  });

  const alreadyGambled = (lineup?.timesGambled ?? 0) >= 1;

  const gambleMutation = api.lineup.gamble.useMutation({
    onSuccess: (data) => {
      setGambleResult({
        previousPlayer: data.previousPlayer,
        newPlayer: data.newPlayer,
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

  if (isLoading) {
    return (
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </main>
    );
  }

  if (!lineup) {
    return (
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-foreground text-2xl font-bold">
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
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/lineups"
            className="text-foreground/60 hover:text-foreground/80 mb-2 inline-flex items-center gap-1 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to My Lineups
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-3xl font-bold">
              <span className="text-gold">Gamble</span> a Player
            </h1>
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="text-foreground/40 hover:text-gold mt-1 transition-colors"
              aria-label="How gambling works"
            >
              <Info className="h-5 w-5" />
            </button>
          </div>
          <p className="text-foreground/60 mt-1">
            Trade a player for a random player. You can only gamble once per
            lineup.
          </p>
        </div>

        <GambleInfoModal open={showInfo} onClose={() => setShowInfo(false)} />

        {/* Animation View */}
        {view === "animating" && gambleResult && (
          <div className="bg-surface-800/80 mb-8 rounded-2xl p-6">
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
          <div className="bg-surface-800/80 mb-8 rounded-2xl p-6">
            <h2 className="text-foreground mb-6 text-center text-xl font-bold">
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
                <p className="text-foreground mt-2 font-semibold line-through">
                  {gambleResult.previousPlayer.firstName}
                </p>
                <p className="text-foreground/50 text-sm">
                  ${gambleResult.previousPlayer.value}
                </p>
              </div>

              {/* Arrow */}
              <div className="text-gold text-4xl">&rarr;</div>

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
                    <span className="text-foreground absolute -top-2 -right-2 rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold">
                      +{gambleResult.valueChange}
                    </span>
                  )}
                  {gambleResult.valueChange < 0 && (
                    <span className="text-foreground absolute -top-2 -right-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold">
                      {gambleResult.valueChange}
                    </span>
                  )}
                </div>
                <p className="text-foreground mt-2 font-semibold">
                  {gambleResult.newPlayer.firstName}{" "}
                  {gambleResult.newPlayer.lastName}
                </p>
                <p className="text-gold text-sm font-semibold">
                  ${gambleResult.newPlayer.value}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/lineups"
                className="bg-gold hover:bg-gold-light block rounded-lg py-3 text-center font-semibold text-black transition-colors"
              >
                Done
              </Link>
            </div>
          </div>
        )}

        {/* Locked state — already gambled */}
        {view === "selection" && alreadyGambled && (
          <div className="bg-surface-800/80 mb-8 rounded-2xl p-8 text-center">
            <div className="text-foreground/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Lock className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h2 className="text-foreground text-lg font-semibold">
              Already Gambled
            </h2>
            <p className="text-foreground/50 mt-2 text-sm">
              You have already used your one gamble on this lineup.
            </p>
            <Link
              href="/lineups"
              className="bg-foreground/10 text-foreground hover:bg-foreground/20 mt-6 inline-block rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
            >
              Back to My Lineups
            </Link>
          </div>
        )}

        {/* Selection View */}
        {view === "selection" && !alreadyGambled && (
          <>
            {/* Select Position */}
            <div className="mb-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
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
                          ? "bg-gold/20 ring-gold ring-2"
                          : "bg-surface-800/80 hover:bg-surface-700"
                      }`}
                    >
                      <span className="text-foreground/50 mb-1 block text-xs font-bold">
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
                      <p className="text-foreground mt-2 truncate text-sm font-medium">
                        {player.firstName}
                      </p>
                      <p className="text-gold text-xs">${player.value}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Player Info */}
            {selectedPosition && (
              <div className="bg-surface-800/80 mb-6 rounded-xl p-4">
                <p className="text-foreground/60 text-sm">
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
                className="bg-foreground/10 text-foreground hover:bg-foreground/20 flex-1 rounded-lg py-3 text-center font-medium transition-colors"
              >
                Cancel
              </Link>
              <Button
                onClick={handleGamble}
                disabled={!selectedPosition}
                color="gold"
                variant="solid"
                loading={gambleMutation.isPending}
                loadingText="Gambling..."
                className="flex-1 py-3 font-semibold"
              >
                🎲 Gamble!
              </Button>
            </div>
          </>
        )}

        {/* Times gambled */}
        <p className="text-foreground/40 mt-6 text-center text-sm">
          This lineup has been gambled {lineup.timesGambled} time
          {lineup.timesGambled !== 1 ? "s" : ""}
        </p>
      </div>
    </main>
  );
}
