"use client";

import { WikiMeasurementsLinesSkeleton } from "../skeletons";

type WikiPlayerMeasurementsProps = {
  listedHeight: string | null | undefined;
  listedWeight: string | null | undefined;
  /** Show loading placeholders when wiki data is still fetching. */
  showLoading: boolean;
  /** "h2" for full player page card; "h4" for sidebar under Player info */
  headingLevel?: "h2" | "h3" | "h4";
  className?: string;
};

/**
 * Wikipedia infobox measurements (listed height / weight), shown inside Player info areas.
 */
export function WikiPlayerMeasurements({
  listedHeight,
  listedWeight,
  showLoading,
  headingLevel = "h2",
  className = "",
}: WikiPlayerMeasurementsProps) {
  const h = listedHeight?.trim();
  const w = listedWeight?.trim();
  const HeadingTag = headingLevel;

  if (!h && !w && !showLoading) return null;

  const titleClass =
    headingLevel === "h2"
      ? "text-foreground/40 mb-3 text-sm font-medium tracking-wider uppercase"
      : headingLevel === "h3"
        ? "text-foreground/80 mb-2 text-xs font-semibold tracking-wide uppercase"
        : "text-foreground/70 mb-2 text-xs font-medium tracking-wide uppercase";

  return (
    <section
      className={className}
      aria-label="Listed height and weight from Wikipedia"
    >
      <HeadingTag className={titleClass}>Measurements</HeadingTag>
      {showLoading && !h && !w ? (
        <div className="border-foreground/10 bg-foreground/5 space-y-2 rounded-lg border p-3">
          <WikiMeasurementsLinesSkeleton />
          <p className="text-foreground/40 text-xs">Loading measurements…</p>
        </div>
      ) : (
        <ul className="border-foreground/10 divide-foreground/10 divide-y rounded-lg border text-sm">
          <li className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-foreground/70">Height</span>
            <span className="text-foreground/90 font-mono tabular-nums">
              {h ?? "—"}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-foreground/70">Weight</span>
            <span className="text-foreground/90 font-mono tabular-nums">
              {w ?? "—"}
            </span>
          </li>
        </ul>
      )}
    </section>
  );
}
