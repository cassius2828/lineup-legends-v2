"use client";

import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

// ─── Spinner ─────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-12 w-12 border-4",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "border-foreground/20 border-t-gold animate-spin rounded-full",
        sizeClasses[size],
        className,
      )}
    />
  );
}

// ─── GoldCircleSpinnerLoader (centered route loading) ─────────────────────────

export function GoldCircleSpinnerLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

// ─── LineupListLoader ─────────────────────────────────────────────────────────

interface LineupListLoaderProps {
  message?: string;
}

export function LineupListLoader({
  message = "Loading lineups...",
}: LineupListLoaderProps) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-foreground/60">{message}</p>
      </div>
    </div>
  );
}

// ─── LoadMoreTrigger ──────────────────────────────────────────────────────────

interface LoadMoreTriggerProps {
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
}

export function LoadMoreTrigger({
  onLoadMore,
  loading,
  hasMore,
}: LoadMoreTriggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !loading) onLoadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onLoadMore, loading, hasMore]);

  if (!hasMore) return null;

  return (
    <div ref={ref} className="flex justify-center py-8">
      {loading && <Spinner size="md" />}
    </div>
  );
}
