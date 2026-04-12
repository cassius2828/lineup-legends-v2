"use client";

import { useState } from "react";
import type { WikiCareerSeasonBestEntry } from "~/server/lib/wikipedia-sections";
import { WIKI_CAREER_STATS_ORDER } from "~/lib/wiki-career-stats";
import { CareerStatValue } from "./CareerStatValue";

type CareerStatsToggleProps = {
  averages: Record<string, string> | null | undefined;
  bests: Partial<Record<string, WikiCareerSeasonBestEntry>> | null | undefined;
  loading?: boolean;
  /** When provided and false, shows a "No career table found" message instead of the stats list. */
  hasCareerStats?: boolean;
  headingAs?: "h2" | "h3";
};

export function CareerStatsToggle({
  averages,
  bests,
  loading = false,
  hasCareerStats,
  headingAs: Heading = "h3",
}: CareerStatsToggleProps) {
  const hasBests = !!bests && Object.keys(bests).length > 0;
  const [mode, setMode] = useState<"averages" | "bests">("averages");

  const headingClass =
    Heading === "h2"
      ? "text-foreground/40 text-sm font-medium tracking-wider uppercase"
      : "text-foreground/80 text-sm font-semibold tracking-wide uppercase";

  const showEmptyState = hasCareerStats === false && !loading;

  return (
    <section aria-busy={loading} aria-label="Career statistics">
      <div className="mb-3 flex items-center justify-between">
        <Heading className={headingClass}>
          {mode === "averages" ? "Career averages" : "Career bests"}
        </Heading>
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

      {showEmptyState ? (
        <p className="text-foreground/50 text-sm">
          No career table found on Wikipedia for this player.
        </p>
      ) : (
        <>
          <ul className="border-foreground/10 divide-foreground/10 divide-y rounded-lg border">
            {WIKI_CAREER_STATS_ORDER.map(({ key, label }, rowIndex) => {
              if (mode === "bests") {
                const best = bests?.[key];
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <span className="flex w-full items-baseline justify-between gap-2">
                      <span className="text-foreground/70">{label}</span>
                      {best ? (
                        <div className="flex items-center gap-2">
                          <span className="text-foreground/45 text-xs">
                            {best.season}
                          </span>
                          <span className="text-gold font-mono font-semibold tabular-nums">
                            {best.value}
                          </span>
                        </div>
                      ) : (
                        <span className="text-foreground/30 font-mono">—</span>
                      )}
                    </span>
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
                    loading={loading}
                    rowIndex={rowIndex}
                  />
                </li>
              );
            })}
          </ul>
          {loading ? (
            <span className="sr-only">
              Loading career statistics from Wikipedia
            </span>
          ) : null}
        </>
      )}
    </section>
  );
}
