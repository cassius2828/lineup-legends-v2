/** Named skeleton placeholders for loading states — add new exports here as needed. */

import type { ReactNode } from "react";
import type { ViewMode } from "~/app/_components/common/lineups/ViewToggle";
import { cn } from "~/lib/utils";

// ─── Lineup List ─────────────────────────────────────────────────────────────

/** Compact skeleton matching LineupCardCompact (grid view): value pill, overlapping avatars, time. */
export function LineupCardCompactSkeleton() {
  return (
    <div className="from-surface-800/90 to-surface-950/90 block rounded-xl bg-gradient-to-br p-3 shadow-lg backdrop-blur-sm">
      {/* Top row — matches LineupCardCompact: value pill (px-1.5 py-0.5 text-[10px]) + star + rating */}
      <div className="mb-2 flex animate-pulse items-center justify-between">
        <span className="bg-foreground/10 rounded-full px-1.5 py-0.5 text-[10px] leading-normal">
          &nbsp;&nbsp;&nbsp;&nbsp;
        </span>
        <div className="flex items-center gap-0.5">
          <div className="bg-foreground/10 h-3 w-3 rounded" />
          <span className="bg-foreground/10 rounded text-[10px] leading-normal">
            &nbsp;&nbsp;
          </span>
        </div>
      </div>

      {/* Player avatars — identical to LineupCardCompact container sizing */}
      <div className="mb-2 flex animate-pulse justify-center -space-x-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-surface-950 bg-foreground/10 relative h-7 w-7 overflow-hidden rounded-full border sm:h-8 sm:w-8"
          />
        ))}
      </div>

      {/* Time — matches text-[10px] line height */}
      <p className="animate-pulse truncate text-center text-[10px] leading-normal">
        <span className="bg-foreground/10 inline-block h-full w-12 rounded" />
      </p>
    </div>
  );
}

/** Skeleton grid displayed while a lineup list is loading. Adapts layout to the current view mode. */
export function LineupListSkeleton({
  count,
  view = "list",
}: { count?: number; view?: ViewMode } = {}) {
  const effectiveCount = count ?? (view === "grid" ? 12 : 4);

  if (view === "grid") {
    return (
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-6">
        {Array.from({ length: effectiveCount }).map((_, i) => (
          <LineupCardCompactSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {Array.from({ length: effectiveCount }).map((_, i) => (
        <LineupCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Lineups ─────────────────────────────────────────────────────────────────

const wikiInsetCardClass =
  "border-foreground/10 bg-foreground/5 space-y-2 rounded-lg border p-3";

export function LineupCardSkeleton() {
  return (
    <div className="from-surface-800/90 to-surface-950/90 rounded-2xl bg-gradient-to-br p-6 shadow-xl">
      {/* Header — matches LineupCardHeader: avatar + name + time/value pill */}
      <div className="mb-4 flex animate-pulse items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-foreground/10 h-8 w-8 rounded-full" />
          <div className="bg-foreground/10 h-3.5 w-24 rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="bg-foreground/10 h-3 w-16 rounded" />
          <div className="bg-foreground/10 h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Stats bar — matches LineupCardStatsBar: star + rating text */}
      <div className="mb-4 flex animate-pulse items-center gap-4">
        <div className="bg-foreground/10 h-4 w-4 rounded" />
        <div className="bg-foreground/10 h-3 w-8 rounded" />
        <div className="bg-foreground/10 h-3 w-24 rounded" />
      </div>

      {/* Players grid — matches LineupCardPlayersGrid: 5 positions with label + image + name */}
      <div className="flex gap-12 overflow-x-auto px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex min-w-[5rem] shrink-0 grow basis-0 animate-pulse flex-col items-center gap-2 p-2"
          >
            <div className="bg-foreground/10 h-3 w-5 rounded" />
            <div className="bg-foreground/10 h-16 w-16 rounded-full md:h-24 md:w-24" />
            <div className="bg-foreground/10 h-3 w-14 rounded" />
          </div>
        ))}
      </div>

      {/* Footer — matches LineupCardFooter: icons left + right */}
      <div className="border-foreground/10 mt-4 flex animate-pulse items-center justify-between border-t pt-3">
        <div className="bg-foreground/10 h-4 w-4 rounded" />
        <div className="flex items-center gap-3">
          <div className="bg-foreground/10 h-4 w-4 rounded" />
          <div className="bg-foreground/10 h-4 w-4 rounded" />
          <div className="bg-foreground/10 h-4 w-4 rounded" />
        </div>
      </div>
    </div>
  );
}

/** Three staggered lines (taller) for Wikipedia biography blocks while fetching. */
export function WikiBiographyLinesSkeleton() {
  return (
    <div className="space-y-2">
      <div className="bg-foreground/10 h-4 w-full animate-pulse rounded" />
      <div className="bg-foreground/10 h-4 w-[92%] animate-pulse rounded" />
      <div className="bg-foreground/10 h-4 w-[85%] animate-pulse rounded" />
    </div>
  );
}

type WikiTextPairSkeletonProps = {
  /** Second line width; first line is always full width. */
  secondLineWide?: "88" | "92";
};

/** Two short text lines (compact wiki-style body copy). */
export function WikiTextPairSkeleton({
  secondLineWide = "88",
}: WikiTextPairSkeletonProps) {
  return (
    <>
      <div className="bg-foreground/10 h-3 w-full animate-pulse rounded" />
      <div
        className={cn(
          "bg-foreground/10 h-3 animate-pulse rounded",
          secondLineWide === "92" ? "w-[92%]" : "w-[88%]",
        )}
      />
    </>
  );
}

/** Listed height / weight placeholders (max-width like infobox text). */
export function WikiMeasurementsLinesSkeleton() {
  return (
    <>
      <div className="bg-foreground/10 h-3 w-[88%] max-w-xs animate-pulse rounded" />
      <div className="bg-foreground/10 h-3 w-[72%] max-w-xs animate-pulse rounded" />
    </>
  );
}

type WikiInsetLoadingCardProps = {
  caption: ReactNode;
  secondLineWide?: WikiTextPairSkeletonProps["secondLineWide"];
  className?: string;
};

/**
 * Bordered inset card with two-line pulse + caption (Wikipedia / awards loading UX).
 */
export function WikiInsetLoadingCard({
  caption,
  secondLineWide = "88",
  className,
}: WikiInsetLoadingCardProps) {
  return (
    <div className={cn(wikiInsetCardClass, className)}>
      <WikiTextPairSkeleton secondLineWide={secondLineWide} />
      <p className="text-foreground/40 pt-1 text-xs">{caption}</p>
    </div>
  );
}
