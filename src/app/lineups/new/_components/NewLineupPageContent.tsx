"use client";

import { PlayerSelector } from "~/app/_components/CreateNew/PlayerSelector";
import { useNewLineupPage } from "../_hooks/useNewLineupPage";

export function NewLineupPageContent() {
  const {
    playersByValue,
    isLoading,
    isError,
    isAuthenticated,
    isSubmitting,
    handleSubmit,
    handleRefresh,
    canRefresh,
    isRefreshing,
  } = useNewLineupPage();

  if (isError && !isLoading) {
    return (
      <div className="rounded-xl bg-red-500/20 p-6 text-center">
        <p className="text-red-400">
          Failed to load players. Please try again.
        </p>
      </div>
    );
  }

  return (
    <PlayerSelector
      playersByValue={playersByValue}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      canRefresh={canRefresh}
      isRefreshing={isRefreshing}
    />
  );
}
