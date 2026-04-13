"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import { LineupCardCompact } from "~/app/_components/LineupCard/LineupCardCompact";
import { Button } from "~/app/_components/common/ui/Button";
import { getId } from "~/lib/types";
import { SORT_OPTIONS, type SortOption } from "~/lib/constants";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useLineupFilters } from "~/hooks/useLineupFilters";
import LineupFilters from "../_components/common/lineups/LineupFilters";
import LineupsHeader from "../_components/Header/LineupsHeader";
import LineupCardGrid from "../_components/common/lineups/LineupCardGrid";
import {
  LineupListLoader,
  LoadMoreTrigger,
} from "../_components/common/loaders";
import { ViewToggle } from "../_components/common/lineups/ViewToggle";
import ConfirmModal from "../_components/common/ui/ConfirmModal";
import { useViewModeStore } from "~/stores/viewMode";

export default function MyLineupsPage() {
  const [sort, setSort] = useState<SortOption>("newest");
  const { view, setView } = useViewModeStore();
  const { filters, setFilters, filterParams, activeFilterCount } =
    useLineupFilters();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const utils = api.useUtils();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.lineup.getLineupsByCurrentUser.useInfiniteQuery(
      { sort, ...filterParams },
      {
        getNextPageParam: (lastPage) =>
          lastPage.hasMore ? lastPage.cursor : undefined,
      },
    );

  const lineups = data?.pages.flatMap((p) => p.lineups) ?? [];

  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });

  const deleteLineup = api.lineup.delete.useMutation({
    onSuccess: () => {
      void utils.lineup.getLineupsByCurrentUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleFeatured = api.lineup.toggleFeatured.useMutation({
    onSuccess: () => {
      void utils.lineup.getLineupsByCurrentUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteLineup.mutate({ id: deleteTarget });
      setDeleteTarget(null);
    }
  };

  const handleToggleFeatured = (id: string) => {
    toggleFeatured.mutate({ id });
  };

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-8">
        <LineupsHeader
          title="My Lineups"
          description="Manage your fantasy basketball lineups"
          exploreLink="/lineups/explore"
          createLink="/lineups/new"
          exploreLinkText="Explore Lineups"
          createLinkText="+ Create Lineup"
          extraLinks={[{ href: "/lineups/bookmarked", label: "Bookmarked" }]}
        />

        {/* Sort Controls */}
        <div className="mb-6 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {SORT_OPTIONS.map((option) => (
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

        {/* Lineups Grid */}
        {isLoading ? (
          <LineupListLoader />
        ) : lineups.length > 0 ? (
          <>
            <LineupCardGrid view={view}>
              {lineups.map((lineup) =>
                view === "grid" ? (
                  <LineupCardCompact
                    key={lineup._id?.toString() ?? ""}
                    lineup={lineup}
                    featured={lineup.featured}
                  />
                ) : (
                  <LineupCard
                    key={lineup._id?.toString() ?? ""}
                    lineup={lineup}
                    showOwner={false}
                    isOwner={true}
                    currentUserId={getId(session)}
                    onDelete={handleDelete}
                    onToggleFeatured={handleToggleFeatured}
                  />
                ),
              )}
            </LineupCardGrid>
            <LoadMoreTrigger
              onLoadMore={handleFetchNextPage}
              loading={isFetchingNextPage}
              hasMore={hasNextPage ?? false}
            />
          </>
        ) : (
          <div className="bg-foreground/5 rounded-2xl p-12 text-center">
            <div className="bg-foreground/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-foreground mb-2 text-xl font-semibold">
              No lineups yet
            </h3>
            <p className="text-foreground/60 mb-6">
              Create your first lineup to get started!
            </p>
            <Link
              href="/lineups/new"
              className="bg-gold hover:bg-gold-light inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-black transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Lineup
            </Link>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Lineup?"
        description="Are you sure you want to delete this lineup? This action cannot be undone."
        confirmLabel={deleteLineup.isPending ? "Deleting..." : "Delete"}
        variant="danger"
        loading={deleteLineup.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
