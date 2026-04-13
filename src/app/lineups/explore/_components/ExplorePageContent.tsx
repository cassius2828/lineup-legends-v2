"use client";

import { SORT_OPTIONS } from "~/lib/constants";
import LineupsHeader from "~/app/_components/Header/LineupsHeader";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/common/ui/tooltip";
import { useExplorePage } from "../_hooks/useExplorePage";
import { LineupSortBar } from "../../_components/LineupSortBar";
import { LineupFilterRow } from "../../_components/LineupFilterRow";
import { LineupListResults } from "../../_components/LineupListResults";
import { LineupsEmptyState } from "../../_components/LineupsEmptyState";

export function ExplorePageContent() {
  const {
    sort,
    setSort,
    view,
    setView,
    filters,
    setFilters,
    activeFilterCount,
    session,
    isAuthenticated,
    lineups,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    handleFetchNextPage,
    handleRefreshAllLineups,
  } = useExplorePage();

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-8">
        <LineupsHeader
          title="Explore Lineups"
          description="Discover lineups from the community"
          exploreLink={isAuthenticated ? "/lineups" : ""}
          createLink={isAuthenticated ? "/lineups/new" : ""}
          exploreLinkText={isAuthenticated ? "My Lineups" : ""}
          createLinkText={isAuthenticated ? "+ Create Lineup" : ""}
          extraLinks={
            isAuthenticated
              ? [{ href: "/lineups/bookmarked", label: "Bookmarked" }]
              : []
          }
        />

        <div className="mb-6 space-y-2">
          <LineupSortBar
            options={SORT_OPTIONS}
            sort={sort}
            onSortChange={(s) => setSort(s as typeof sort)}
            trailing={
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleRefreshAllLineups}
                    className="text-foreground/50 hover:bg-foreground/10 hover:text-foreground/70 flex cursor-pointer items-center justify-center rounded-lg p-1.5 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 640 640"
                      fill="currentColor"
                    >
                      <path d="M129.9 292.5C143.2 199.5 223.3 128 320 128C373 128 421 149.5 455.8 184.2C456 184.4 456.2 184.6 456.4 184.8L464 192L416.1 192C398.4 192 384.1 206.3 384.1 224C384.1 241.7 398.4 256 416.1 256L544.1 256C561.8 256 576.1 241.7 576.1 224L576.1 96C576.1 78.3 561.8 64 544.1 64C526.4 64 512.1 78.3 512.1 96L512.1 149.4L500.8 138.7C454.5 92.6 390.5 64 320 64C191 64 84.3 159.4 66.6 283.5C64.1 301 76.2 317.2 93.7 319.7C111.2 322.2 127.4 310 129.9 292.6zM573.4 356.5C575.9 339 563.7 322.8 546.3 320.3C528.9 317.8 512.6 330 510.1 347.4C496.8 440.4 416.7 511.9 320 511.9C267 511.9 219 490.4 184.2 455.7C184 455.5 183.8 455.3 183.6 455.1L176 447.9L223.9 447.9C241.6 447.9 255.9 433.6 255.9 415.9C255.9 398.2 241.6 383.9 223.9 383.9L96 384C87.5 384 79.3 387.4 73.3 393.5C67.3 399.6 63.9 407.7 64 416.3L65 543.3C65.1 561 79.6 575.2 97.3 575C115 574.8 129.2 560.4 129 542.7L128.6 491.2L139.3 501.3C185.6 547.4 249.5 576 320 576C449 576 555.7 480.6 573.4 356.5z" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Refresh lineups</TooltipContent>
              </Tooltip>
            }
          />
          <LineupFilterRow
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={activeFilterCount}
            view={view}
            onViewChange={setView}
            showUserFilter={true}
            excludeUserId={session?.user?.id}
          />
        </div>

        <LineupListResults
          lineups={lineups}
          isLoading={isLoading}
          view={view}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={handleFetchNextPage}
          showOwner={true}
          isOwner={false}
          currentUserId={session?.user.id ?? ""}
          emptyState={
            <LineupsEmptyState
              icon={
                <svg
                  className="text-foreground/40 h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
              title="No lineups to explore"
              message="Be the first to create a lineup!"
              ctaHref="/lineups/new"
              ctaLabel="Create a Lineup"
            />
          }
        />
      </div>
    </main>
  );
}
