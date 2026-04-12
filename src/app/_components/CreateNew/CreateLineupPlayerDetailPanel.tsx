"use client";

import { skipToken } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { getId } from "~/lib/types";
import type { PlayerOutput } from "~/server/api/schemas/output";
import { VALUE_SHADOWS } from "~/lib/constants";
import { WIKI_CAREER_STATS_ORDER } from "~/lib/wiki-career-stats";
import { CareerStatValue } from "../common/CareerStatValue";
import { WikiPlayerMeasurements } from "../common/WikiPlayerMeasurements";
import { PlayerImage } from "../PlayerImage";

type SeasonBestEntry = { value: string; season: string };

function CareerStatsToggleBlock({
  averages,
  bests,
  statsLoading,
}: {
  averages: Record<string, string> | null | undefined;
  bests: Record<string, SeasonBestEntry> | null | undefined;
  statsLoading?: boolean;
}) {
  const hasBests = !!bests && Object.keys(bests).length > 0;
  const [mode, setMode] = useState<"averages" | "bests">("averages");

  return (
    <section aria-busy={statsLoading} aria-label="Career statistics">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-foreground/80 text-sm font-semibold tracking-wide uppercase">
          {mode === "averages" ? "Career averages" : "Career bests"}
        </h3>
        {hasBests && (
          <button
            type="button"
            onClick={() =>
              setMode((m) => (m === "averages" ? "bests" : "averages"))
            }
            className="text-gold hover:text-gold-light border-foreground/10 hover:border-foreground/20 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
          >
            {mode === "averages" ? "Show bests" : "Show averages"}
          </button>
        )}
      </div>

      <ul className="border-foreground/10 divide-foreground/10 divide-y rounded-lg border">
        {WIKI_CAREER_STATS_ORDER.map(({ key, label }, rowIndex) => {
          if (mode === "bests") {
            const best = bests?.[key];
            return (
              <li
                key={key}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <span className="text-foreground/70">{label}</span>
                {best ? (
                  <span className="flex items-baseline gap-2">
                    <span className="text-gold font-mono font-semibold tabular-nums">
                      {best.value}
                    </span>
                    <span className="text-foreground/45 text-xs">
                      {best.season}
                    </span>
                  </span>
                ) : (
                  <span className="text-foreground/30 font-mono">—</span>
                )}
              </li>
            );
          }
          return (
            <li
              key={key}
              className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
            >
              <span className="text-foreground/70">{label}</span>
              <CareerStatValue
                value={averages?.[key]}
                loading={!!statsLoading}
                rowIndex={rowIndex}
              />
            </li>
          );
        })}
      </ul>
      {statsLoading ? (
        <span className="sr-only">
          Loading career statistics from Wikipedia
        </span>
      ) : null}
    </section>
  );
}

interface CreateLineupPlayerDetailPanelProps {
  player: PlayerOutput | null;
  open: boolean;
  onClose: () => void;
}

export function CreateLineupPlayerDetailPanel({
  player,
  open,
  onClose,
}: CreateLineupPlayerDetailPanelProps) {
  const playerId = player ? getId(player) : undefined;
  const utils = api.useUtils();
  const wikiAttempted = useRef(false);

  const { data: freshPlayer, isFetching } = api.player.getById.useQuery(
    open && playerId ? { id: playerId } : skipToken,
  );

  const ensureWiki = api.player.ensureWikiSummary.useMutation({
    onSuccess: async (data) => {
      if (!playerId) return;
      utils.player.getById.setData({ id: playerId }, data);
      await utils.player.getById.invalidate({ id: playerId });
    },
    onError: (err) => {
      wikiAttempted.current = false;
      toast.error(err.message);
    },
  });
  const { reset: resetWikiMutation, mutate: mutateWiki } = ensureWiki;

  const displayPlayer = freshPlayer ?? player;

  useEffect(() => {
    wikiAttempted.current = false;
    resetWikiMutation();
  }, [playerId, open, resetWikiMutation]);

  useEffect(() => {
    if (!open || !playerId || !displayPlayer) return;
    const wikiReady =
      !!displayPlayer.wikiSummaryExtract?.trim() &&
      displayPlayer.wikiAwardsHonorsText !== undefined;
    if (wikiReady) return;
    if (wikiAttempted.current) return;
    wikiAttempted.current = true;
    mutateWiki({ id: playerId });
  }, [open, playerId, displayPlayer, mutateWiki]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !player) return null;

  const resolved = freshPlayer ?? player;

  const name = `${resolved.firstName} ${resolved.lastName}`.trim();
  const valueShadow = VALUE_SHADOWS[resolved.value] ?? "";
  const wikiContentReady =
    !!resolved.wikiSummaryExtract?.trim() &&
    resolved.wikiAwardsHonorsText !== undefined;
  const showWikiSkeleton =
    !wikiContentReady &&
    !ensureWiki.isError &&
    (ensureWiki.isPending || isFetching || !ensureWiki.isSuccess);

  const hasWiki =
    !!resolved.wikiSummaryExtract?.trim() &&
    resolved.wikiAwardsHonorsText !== undefined;

  const hasCareerStats =
    !!resolved.wikiCareerRegularSeason &&
    Object.keys(resolved.wikiCareerRegularSeason).length > 0;
  const careerStatsLoading =
    !hasCareerStats && (isFetching || ensureWiki.isPending);

  return (
    <>
      <button
        type="button"
        aria-label="Close player details"
        className="animate-in fade-in fixed inset-0 z-[55] bg-black/50 backdrop-blur-[2px] duration-300 ease-out"
        onClick={onClose}
      />
      <aside
        className="border-foreground/10 bg-surface-950 animate-in slide-in-from-right fade-in fixed top-0 right-0 z-[60] flex h-full w-full max-w-full flex-col border-l shadow-2xl duration-300 ease-out md:max-w-[33vw]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-detail-title"
      >
        <div className="border-foreground/10 flex items-start justify-between border-b px-4 py-4">
          <div className="min-w-0 pr-2">
            <h2
              id="player-detail-title"
              className="text-foreground truncate text-lg font-semibold"
            >
              {name}
            </h2>
            <p className="text-foreground/60 mt-1 text-sm">Fantasy value</p>
            <p
              className={`text-gold mt-1 inline-block rounded-full px-3 py-1 text-xl font-bold ${valueShadow}`}
            >
              ${resolved.value}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground hover:bg-foreground/10 shrink-0 rounded-lg p-2 transition-colors"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="relative mx-auto mt-6 aspect-square w-40 shrink-0 overflow-hidden rounded-full">
          <PlayerImage
            imgUrl={resolved.imgUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-4 py-6">
          {(showWikiSkeleton ||
            resolved.wikiListedHeight?.trim() ||
            resolved.wikiListedWeight?.trim()) && (
            <WikiPlayerMeasurements
              listedHeight={resolved.wikiListedHeight}
              listedWeight={resolved.wikiListedWeight}
              showLoading={
                showWikiSkeleton &&
                !resolved.wikiListedHeight?.trim() &&
                !resolved.wikiListedWeight?.trim()
              }
              headingLevel="h3"
            />
          )}

          <CareerStatsToggleBlock
            averages={resolved.wikiCareerRegularSeason ?? undefined}
            bests={resolved.wikiCareerSeasonBests ?? undefined}
            statsLoading={careerStatsLoading}
          />

          <section>
            <h3 className="text-foreground/80 mb-3 text-sm font-semibold tracking-wide uppercase">
              Player info
            </h3>
            {ensureWiki.isError ? (
              <div className="space-y-3">
                <p className="text-foreground/50 text-sm">
                  Could not load a Wikipedia biography right now. Check your
                  connection or try again.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    wikiAttempted.current = false;
                    if (playerId) mutateWiki({ id: playerId, force: true });
                  }}
                  disabled={ensureWiki.isPending}
                  className="text-gold hover:text-gold-light disabled:text-foreground/30 text-sm font-medium underline-offset-4 transition-colors hover:underline disabled:cursor-not-allowed"
                >
                  {ensureWiki.isPending ? "Loading…" : "Retry biography"}
                </button>
              </div>
            ) : showWikiSkeleton ? (
              <div className="border-foreground/10 bg-foreground/5 space-y-2 rounded-lg border p-3">
                <div className="bg-foreground/10 h-3 w-full animate-pulse rounded" />
                <div className="bg-foreground/10 h-3 w-[92%] animate-pulse rounded" />
                <p className="text-foreground/40 pt-1 text-xs">
                  Loading Wikipedia…
                </p>
              </div>
            ) : hasWiki && resolved.wikiSummaryExtract?.trim() ? (
              <p className="text-foreground/85 text-sm leading-relaxed whitespace-pre-wrap">
                {resolved.wikiSummaryExtract}
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-foreground/50 text-sm">
                  Biography unavailable. Wikipedia did not return a matching
                  basketball article for this player.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    wikiAttempted.current = false;
                    if (playerId) mutateWiki({ id: playerId, force: true });
                  }}
                  disabled={ensureWiki.isPending}
                  className="text-gold hover:text-gold-light disabled:text-foreground/30 text-sm font-medium underline-offset-4 transition-colors hover:underline disabled:cursor-not-allowed"
                >
                  {ensureWiki.isPending ? "Loading…" : "Retry biography"}
                </button>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-foreground/80 mb-3 text-sm font-semibold tracking-wide uppercase">
              Accolades
            </h3>
            {ensureWiki.isError ? (
              <p className="text-foreground/50 text-sm">
                Awards could not be loaded. Use retry above or open the full
                player page.
              </p>
            ) : showWikiSkeleton ? (
              <div className="border-foreground/10 bg-foreground/5 space-y-2 rounded-lg border p-3">
                <div className="bg-foreground/10 h-3 w-full animate-pulse rounded" />
                <div className="bg-foreground/10 h-3 w-[88%] animate-pulse rounded" />
                <p className="text-foreground/40 pt-1 text-xs">
                  Loading awards from Wikipedia…
                </p>
              </div>
            ) : hasWiki && resolved.wikiAwardsHonorsText?.trim() ? (
              <p className="text-foreground/85 max-h-64 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
                {resolved.wikiAwardsHonorsText}
              </p>
            ) : hasWiki && !resolved.wikiAwardsHonorsText?.trim() ? (
              <p className="text-foreground/50 text-sm">
                No awards list found on Wikipedia for this player.
              </p>
            ) : (
              <p className="text-foreground/50 text-sm">
                Accolades load with the biography.
              </p>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
