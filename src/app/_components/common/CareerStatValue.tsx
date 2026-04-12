"use client";

import type { CSSProperties } from "react";

const STAGGER_MS = 72;

type CareerStatValueProps = {
  value: string | undefined;
  /** When true and value is empty, show animated placeholder instead of "—". */
  loading: boolean;
  /** Used to stagger shimmer so rows feel like a wave (0-based). */
  rowIndex: number;
};

/**
 * Career stat cell: value, em dash, or a gold-tinted shimmer while Wikipedia stats load.
 */
export function CareerStatValue({
  value,
  loading,
  rowIndex,
}: CareerStatValueProps) {
  const trimmed = value?.trim();
  if (trimmed) {
    return (
      <span className="text-foreground/90 font-mono tabular-nums">
        {trimmed}
      </span>
    );
  }
  if (loading) {
    return (
      <span
        className="career-stat-skeleton"
        style={
          {
            "--career-stat-stagger": `${rowIndex * STAGGER_MS}ms`,
          } as CSSProperties
        }
        aria-hidden
      />
    );
  }
  return <span className="text-foreground/90 font-mono tabular-nums">—</span>;
}
