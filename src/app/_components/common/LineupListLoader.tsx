"use client";

import { Spinner } from "../ui/Spinner";

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
