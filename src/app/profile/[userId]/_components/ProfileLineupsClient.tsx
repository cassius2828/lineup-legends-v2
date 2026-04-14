"use client";

import { useProfileLineups } from "../_hooks/useProfileLineups";
import { ProfileLineupsSection } from "./ProfileLineupsSection";

type ProfileLineupsClientProps = {
  userId: string;
  totalLineups?: number;
};

export function ProfileLineupsClient({
  userId,
  totalLineups,
}: ProfileLineupsClientProps) {
  const p = useProfileLineups(userId);

  return (
    <ProfileLineupsSection
      sort={p.sort}
      onSortChange={p.setSort}
      filters={p.filters}
      onFiltersChange={p.setFilters}
      activeFilterCount={p.activeFilterCount}
      view={p.view}
      onViewChange={p.setView}
      lineups={p.lineups}
      lineupsLoading={p.lineupsLoading}
      onLoadMore={p.handleFetchNextPage}
      isFetchingNextPage={p.isFetchingNextPage}
      hasNextPage={p.hasNextPage}
      totalLineups={totalLineups}
      listQueryKey={p.listQueryKey}
    />
  );
}
