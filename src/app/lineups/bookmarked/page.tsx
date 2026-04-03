"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import LineupCardGrid from "~/app/_components/common/LineupCardGrid";
import LineupsHeader from "~/app/_components/Header/LineupsHeader";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import { getId } from "~/lib/types";
import { api } from "~/trpc/react";

type SortOption = "newest" | "oldest";

export default function BookmarkedLineupsPage() {
  const [sort, setSort] = useState<SortOption>("newest");
  const { data: session } = useSession();

  const { data: lineups, isLoading } =
    api.bookmark.getBookmarkedLineups.useQuery(
      { sort },
      { enabled: !!session?.user },
    );

  return (
    <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-800 to-surface-950">
      <div className="container mx-auto px-4 py-8">
        <LineupsHeader
          title="Bookmarked Lineups"
          description="Lineups you've saved for later"
          exploreLink="/lineups/explore"
          createLink="/lineups/new"
          exploreLinkText="Explore Lineups"
          createLinkText="+ Create Lineup"
        />

        <div className="mb-6 flex gap-2">
          {(
            [
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              onClick={() => setSort(option.value)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                sort === option.value
                  ? "bg-gold-600 text-foreground"
                  : "bg-foreground/10 text-foreground/70 hover:bg-foreground/20"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-foreground/20 border-t-gold" />
              <p className="text-foreground/60">Loading bookmarks...</p>
            </div>
          </div>
        ) : lineups && lineups.length > 0 ? (
          <LineupCardGrid>
            {lineups.map((lineup) => (
              <LineupCard
                key={getId(lineup)}
                lineup={lineup}
                showOwner={true}
                isOwner={false}
                currentUserId={session?.user.id ?? ""}
              />
            ))}
          </LineupCardGrid>
        ) : (
          <div className="rounded-2xl bg-foreground/5 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/10">
              <Bookmark className="h-8 w-8 text-foreground/40" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              No bookmarked lineups
            </h3>
            <p className="mb-6 text-foreground/60">
              Bookmark lineups you like to find them here later.
            </p>
            <Link
              href="/lineups/explore"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-semibold text-black transition-colors hover:bg-gold-light"
            >
              Explore Lineups
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
