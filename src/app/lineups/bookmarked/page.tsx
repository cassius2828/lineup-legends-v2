"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import LineupCardGrid from "~/app/_components/common/LineupCardGrid";
import { ViewToggle } from "~/app/_components/common/ViewToggle";
import { useViewModeStore } from "~/stores/viewMode";
import LineupsHeader from "~/app/_components/Header/LineupsHeader";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import { LineupCardCompact } from "~/app/_components/LineupCard/LineupCardCompact";
import { Button } from "~/app/_components/ui/Button";
import { getId } from "~/lib/types";
import { SORT_OPTIONS_BASIC } from "~/lib/constants";
import { api } from "~/trpc/react";
import { useLineupFilters } from "~/hooks/useLineupFilters";
import LineupFilters from "~/app/_components/common/LineupFilters";

type SortOption = "newest" | "oldest";

export default function BookmarkedLineupsPage() {
  const [sort, setSort] = useState<SortOption>("newest");
  const { view, setView } = useViewModeStore();
  const { filters, setFilters, filterLineups, activeFilterCount } =
    useLineupFilters();
  const { data: session } = useSession();

  const { data: lineups, isLoading } =
    api.bookmark.getBookmarkedLineups.useQuery(
      { sort },
      { enabled: !!session?.user },
    );

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-8">
        <LineupsHeader
          title="Bookmarked Lineups"
          description="Lineups you've saved for later"
          exploreLink="/lineups/explore"
          createLink="/lineups/new"
          exploreLinkText="Explore Lineups"
          createLinkText="+ Create Lineup"
        />

        <div className="mb-6 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {SORT_OPTIONS_BASIC.map((option) => (
              <Button
                key={option.value}
                onClick={() => setSort(option.value)}
                color={sort === option.value ? "gold" : "white"}
                variant={sort === option.value ? "solid" : "subtle"}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LineupFilters
              filters={filters}
              onFiltersChange={setFilters}
              activeFilterCount={activeFilterCount}
            />
            <div className="ml-auto">
              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="border-foreground/20 border-t-gold mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4" />
              <p className="text-foreground/60">Loading bookmarks...</p>
            </div>
          </div>
        ) : lineups && lineups.length > 0 ? (
          (() => {
            const filtered = filterLineups(lineups);
            return filtered.length > 0 ? (
              <LineupCardGrid view={view}>
                {filtered.map((lineup) =>
                  view === "grid" ? (
                    <LineupCardCompact
                      key={getId(lineup)}
                      lineup={lineup}
                      featured={lineup.featured}
                    />
                  ) : (
                    <LineupCard
                      key={getId(lineup)}
                      lineup={lineup}
                      showOwner={true}
                      isOwner={false}
                      currentUserId={session?.user.id ?? ""}
                    />
                  ),
                )}
              </LineupCardGrid>
            ) : (
              <div className="bg-foreground/5 rounded-2xl p-12 text-center">
                <p className="text-foreground/60">
                  No lineups match the current filters.
                </p>
              </div>
            );
          })()
        ) : (
          <div className="bg-foreground/5 rounded-2xl p-12 text-center">
            <div className="bg-foreground/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Bookmark className="text-foreground/40 h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 text-xl font-semibold">
              No bookmarked lineups
            </h3>
            <p className="text-foreground/60 mb-6">
              Bookmark lineups you like to find them here later.
            </p>
            <Link
              href="/lineups/explore"
              className="bg-gold hover:bg-gold-light inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-black transition-colors"
            >
              Explore Lineups
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
