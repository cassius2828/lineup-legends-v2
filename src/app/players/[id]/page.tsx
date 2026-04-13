"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useEnsureWikiData } from "~/hooks/useEnsureWikiData";
import { CareerStatsToggle } from "~/app/_components/common/career/CareerStatsToggle";
import { WikiPlayerMeasurements } from "~/app/_components/common/wiki/WikiPlayerMeasurements";
import {
  WikiBiographyLinesSkeleton,
  WikiInsetLoadingCard,
} from "~/app/_components/common/skeletons";
import { PlayerImage } from "~/app/_components/PlayerImage";

const VALUE_TIERS: Record<
  number,
  { label: string; color: string; glow: string }
> = {
  5: {
    label: "Diamond",
    color: "text-cyan-300",
    glow: "shadow-[0px_0px_20px_6px_#99fcff]",
  },
  4: {
    label: "Amethyst",
    color: "text-purple-400",
    glow: "shadow-[0px_0px_20px_6px_#8317e8]",
  },
  3: {
    label: "Gold",
    color: "text-yellow-400",
    glow: "shadow-[0px_0px_20px_6px_#e3b920]",
  },
  2: {
    label: "Silver",
    color: "text-gray-300",
    glow: "shadow-[0px_0px_20px_6px_#c0c0c0]",
  },
  1: {
    label: "Bronze",
    color: "text-amber-600",
    glow: "shadow-[0px_0px_20px_6px_#804a14]",
  },
};

export default function PlayerPage() {
  const params = useParams();
  const playerId = params?.id as string;
  const router = useRouter();
  const {
    data: player,
    isLoading,
    isFetching,
  } = api.player.getById.useQuery({ id: playerId }, { enabled: !!playerId });

  const { ensureWiki, ensureAwardsAI, wikiAttempted, mutateWiki } =
    useEnsureWikiData({ playerId, player });

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="border-foreground/10 border-t-gold h-10 w-10 animate-spin rounded-full border-2" />
      </main>
    );
  }

  if (!player) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-foreground/50 text-lg">Player not found</p>
        <Link
          href="/"
          className="text-gold hover:text-gold-light text-sm transition-colors"
        >
          Go home
        </Link>
      </main>
    );
  }

  const tier = VALUE_TIERS[player.value] ?? VALUE_TIERS[1]!;

  const wikiContentReady =
    !!player.wikiSummaryExtract?.trim() &&
    player.wikiAwardsHonorsText !== undefined;
  const showWikiSkeleton =
    !wikiContentReady &&
    !ensureWiki.isError &&
    (ensureWiki.isPending || isFetching || !ensureWiki.isSuccess);

  const hasCareerStats =
    !!player.wikiCareerRegularSeason &&
    Object.keys(player.wikiCareerRegularSeason).length > 0;
  const careerStatsLoading =
    !hasCareerStats && (isFetching || ensureWiki.isPending);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <button
        onClick={() => router.back()}
        className="text-foreground/40 hover:text-foreground/70 mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex flex-col items-center gap-8">
        {/* Headshot */}
        <div
          className={`relative h-48 w-48 overflow-hidden rounded-full bg-[#f2f2f2] sm:h-64 sm:w-64 ${tier.glow}`}
        >
          <PlayerImage
            imgUrl={player.imgUrl}
            alt={`${player.firstName} ${player.lastName}`}
            className="absolute inset-0 h-full w-full rounded-full object-cover"
          />
        </div>

        {/* Name + Tier */}
        <div className="text-center">
          <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            {player.firstName} {player.lastName}
          </h1>
          <p className={`mt-2 text-lg font-semibold ${tier.color}`}>
            {tier.label}
          </p>
          <p className="text-foreground mt-2 text-lg font-semibold">
            ${player.value}
          </p>
        </div>

        {/* Wikipedia: summary, career (regular season), awards */}
        <div className="border-foreground/10 bg-surface-800/50 w-full space-y-8 rounded-xl border p-6">
          <section>
            <h2 className="text-foreground/40 mb-3 text-sm font-medium tracking-wider uppercase">
              Biography
            </h2>
            {showWikiSkeleton ? (
              <div className="space-y-2">
                <WikiBiographyLinesSkeleton />
                <p className="text-foreground/50 text-xs">Loading Wikipedia…</p>
              </div>
            ) : player.wikiSummaryExtract ? (
              <div className="space-y-4">
                <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                  {player.wikiSummaryExtract}
                </p>
                {player.wikiPageTitle ? (
                  <a
                    href={`https://en.wikipedia.org/wiki/${encodeURIComponent(
                      player.wikiPageTitle.replace(/ /g, "_"),
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:text-gold-light text-sm underline-offset-4 transition-colors hover:underline"
                  >
                    Read on Wikipedia
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-foreground/50 text-sm">
                  {ensureWiki.isError
                    ? "Could not load a Wikipedia biography right now. Check your connection or try again."
                    : "Biography unavailable. Wikipedia did not return a matching basketball article for this player."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    wikiAttempted.current = false;
                    mutateWiki({ id: playerId, force: true });
                  }}
                  disabled={ensureWiki.isPending}
                  className="text-gold hover:text-gold-light disabled:text-foreground/30 text-sm font-medium underline-offset-4 transition-colors hover:underline disabled:cursor-not-allowed"
                >
                  {ensureWiki.isPending ? "Loading…" : "Retry biography"}
                </button>
              </div>
            )}
          </section>

          {(showWikiSkeleton ||
            player.wikiListedHeight?.trim() ||
            player.wikiListedWeight?.trim()) && (
            <WikiPlayerMeasurements
              listedHeight={player.wikiListedHeight}
              listedWeight={player.wikiListedWeight}
              showLoading={
                showWikiSkeleton &&
                !player.wikiListedHeight?.trim() &&
                !player.wikiListedWeight?.trim()
              }
              headingLevel="h2"
              className="mb-8"
            />
          )}

          {player.wikiSummaryExtract?.trim() ? (
            <>
              <CareerStatsToggle
                averages={player.wikiCareerRegularSeason}
                bests={player.wikiCareerSeasonBests}
                loading={careerStatsLoading}
                hasCareerStats={hasCareerStats}
                headingAs="h2"
              />

              <section>
                <h2 className="text-foreground/40 mb-3 text-sm font-medium tracking-wider uppercase">
                  Awards and honors
                </h2>
                {player.wikiAwardsHonorsText?.trim() ? (
                  <p className="text-foreground/90 max-h-96 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
                    {player.wikiAwardsHonorsText}
                  </p>
                ) : ensureAwardsAI.isPending ? (
                  <WikiInsetLoadingCard caption="Searching for awards via AI…" />
                ) : (
                  <p className="text-foreground/50 text-sm">
                    No awards found for this player.
                  </p>
                )}
              </section>
            </>
          ) : null}
        </div>

        {process.env.NODE_ENV === "development" ? (
          <div className="border-gold/30 bg-surface-900/80 w-full rounded-lg border border-dashed px-4 py-3">
            <p className="text-foreground/50 mb-2 text-xs font-medium tracking-wide uppercase">
              Dev only
            </p>
            <p className="text-foreground/60 mb-3 text-xs">
              Bypasses the 7-day cache and re-runs Wikipedia summary + awards +
              career parsing. Use after schema or parser changes.
            </p>
            <button
              type="button"
              onClick={() => {
                wikiAttempted.current = false;
                mutateWiki({ id: playerId, force: true });
              }}
              disabled={ensureWiki.isPending}
              className="bg-gold/15 text-gold hover:bg-gold/25 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {ensureWiki.isPending
                ? "Refetching Wikipedia…"
                : "Force Wikipedia refetch & reset cache"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
