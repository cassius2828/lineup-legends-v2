"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { PlayerSelector } from "~/app/_components/CreateNew/PlayerSelector";
import { useNewLineupPage } from "../_hooks/useNewLineupPage";

export function NewLineupPageContent() {
  const {
    playersByValue,
    isLoading,
    isAuthenticated,
    isSubmitting,
    handleSubmit,
  } = useNewLineupPage();

  return (
    <main className="bg-surface-950 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/lineups"
          className="text-foreground/60 hover:text-foreground/80 mb-4 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to My Lineups
        </Link>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="border-t-gold border-foreground/20 mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4" />
              <p className="text-foreground/60">Loading players...</p>
            </div>
          </div>
        ) : playersByValue ? (
          <PlayerSelector
            playersByValue={playersByValue}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isAuthenticated={isAuthenticated}
          />
        ) : (
          <div className="rounded-xl bg-red-500/20 p-6 text-center">
            <p className="text-red-400">
              Failed to load players. Please try again.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
