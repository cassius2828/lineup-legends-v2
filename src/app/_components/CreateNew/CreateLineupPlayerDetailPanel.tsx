"use client";

import { skipToken } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "~/trpc/react";
import { getId } from "~/lib/types";
import type { PlayerOutput } from "~/server/api/schemas/output";
import { VALUE_SHADOWS } from "~/lib/constants";
import { useEnsureWikiData } from "~/hooks/useEnsureWikiData";
import { CareerStatsToggle } from "../common/career/CareerStatsToggle";
import { WikiPlayerMeasurements } from "../common/wiki/WikiPlayerMeasurements";
import { WikiInsetLoadingCard } from "../common/skeletons";
import { PlayerImage } from "../PlayerImage";

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

  const { data: freshPlayer, isFetching } = api.player.getById.useQuery(
    open && playerId ? { id: playerId } : skipToken,
  );

  const displayPlayer = freshPlayer ?? player;

  const { ensureWiki, ensureAwardsAI, wikiAttempted, mutateWiki } =
    useEnsureWikiData({ playerId, player: displayPlayer, enabled: open });

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

          <CareerStatsToggle
            averages={resolved.wikiCareerRegularSeason ?? undefined}
            bests={resolved.wikiCareerSeasonBests ?? undefined}
            loading={careerStatsLoading}
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
              <WikiInsetLoadingCard
                secondLineWide="92"
                caption="Loading Wikipedia…"
              />
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
              <WikiInsetLoadingCard caption="Loading awards from Wikipedia…" />
            ) : hasWiki && resolved.wikiAwardsHonorsText?.trim() ? (
              <p className="text-foreground/85 max-h-64 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
                {resolved.wikiAwardsHonorsText}
              </p>
            ) : ensureAwardsAI.isPending ? (
              <WikiInsetLoadingCard caption="Searching for awards via AI…" />
            ) : (
              <p className="text-foreground/50 text-sm">
                No awards found for this player.
              </p>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
