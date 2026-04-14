"use client";

import { Package } from "lucide-react";
import { getId } from "~/lib/types";
import { SORT_OPTIONS } from "~/lib/constants";
import ConfirmModal from "~/app/_components/common/ui/ConfirmModal";
import { useMyLineupsPage } from "../_hooks/useMyLineupsPage";
import { LineupSortBar } from "./LineupSortBar";
import { LineupFilterRow } from "./LineupFilterRow";
import { LineupListResults } from "./LineupListResults";
import { LineupsEmptyState } from "./LineupsEmptyState";

export function MyLineupsPageContent() {
  const {
    sort,
    setSort,
    view,
    setView,
    filters,
    setFilters,
    activeFilterCount,
    lineups,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    handleFetchNextPage,
    session,
    deleteTarget,
    deleteLineup,
    handleDelete,
    confirmDelete,
    cancelDelete,
    handleToggleFeatured,
  } = useMyLineupsPage();

  return (
    <>
      <div className="mb-6 space-y-2">
        <LineupSortBar
          options={SORT_OPTIONS}
          sort={sort}
          onSortChange={(s) => setSort(s as typeof sort)}
        />
        <LineupFilterRow
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
          view={view}
          onViewChange={setView}
        />
      </div>

      <LineupListResults
        lineups={lineups}
        isLoading={isLoading}
        view={view}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={handleFetchNextPage}
        showOwner={false}
        isOwner={true}
        currentUserId={getId(session)}
        onDelete={handleDelete}
        onToggleFeatured={handleToggleFeatured}
        emptyState={
          <LineupsEmptyState
            icon={<Package className="text-foreground/40 h-8 w-8" />}
            title="No lineups yet"
            message="Create your first lineup to get started!"
            ctaHref="/lineups/new"
            ctaLabel="Create Your First Lineup"
          />
        }
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Lineup?"
        description="Are you sure you want to delete this lineup? This action cannot be undone."
        confirmLabel={deleteLineup.isPending ? "Deleting..." : "Delete"}
        variant="danger"
        loading={deleteLineup.isPending}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
