/** Named skeleton placeholders for loading states — add new exports here as needed. */

import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

const wikiInsetCardClass =
  "border-foreground/10 bg-foreground/5 space-y-2 rounded-lg border p-3";

export function LineupCardSkeleton() {
  return (
    <div className="from-surface-800/90 to-surface-950/90 animate-pulse rounded-2xl bg-gradient-to-br p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-foreground/10 h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <div className="bg-foreground/10 h-3.5 w-28 rounded" />
            <div className="bg-foreground/10 h-3 w-20 rounded" />
          </div>
        </div>
        <div className="bg-foreground/10 h-6 w-16 rounded-full" />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="bg-foreground/10 h-4 w-24 rounded" />
        <div className="bg-foreground/10 h-4 w-20 rounded" />
      </div>
      <div className="mt-4 flex justify-between px-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="bg-foreground/10 h-3 w-5 rounded" />
            <div className="bg-foreground/10 h-16 w-16 rounded-full" />
            <div className="bg-foreground/10 h-3 w-14 rounded" />
          </div>
        ))}
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
