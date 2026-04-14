import { useRef } from "react";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import { LineupCardCompact } from "~/app/_components/LineupCard/LineupCardCompact";
import LineupCardGrid from "~/app/_components/common/lineups/LineupCardGrid";
import {
  GoldCircleSpinnerLoader,
  LoadMoreTrigger,
} from "~/app/_components/common/loaders";
import { LineupListSkeleton } from "~/app/_components/common/skeletons";
import { getId } from "~/lib/types";
import type { LineupOutput } from "~/server/api/schemas/output";
import type { ViewMode } from "~/app/_components/common/lineups/ViewToggle";
import type { ReactNode } from "react";

type LineupListResultsProps = {
  lineups: LineupOutput[];
  isLoading: boolean;
  view: ViewMode;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  /** Show the lineup owner avatar + name on each card */
  showOwner?: boolean;
  /** Current user is the owner (enables delete / feature actions) */
  isOwner?: boolean;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onToggleFeatured?: (id: string) => void;
  /** Rendered when no lineups exist */
  emptyState: ReactNode;
  /** Seed the skeleton count before data loads (e.g. from profile stats) */
  initialCount?: number;
};

export function LineupListResults({
  lineups,
  isLoading,
  view,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  showOwner = false,
  isOwner = false,
  currentUserId,
  onDelete,
  onToggleFeatured,
  emptyState,
  initialCount,
}: LineupListResultsProps) {
  const lastCountRef = useRef<number | undefined>(initialCount);

  if (!isLoading && lineups.length > 0) {
    lastCountRef.current = lineups.length;
  }

  if (isLoading) {
    if (lastCountRef.current != null) {
      return (
        <LineupListSkeleton
          view={view}
          count={lastCountRef.current}
          showOwner={showOwner}
          isOwner={isOwner}
        />
      );
    }
    return <GoldCircleSpinnerLoader />;
  }

  if (lineups.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      <LineupCardGrid view={view}>
        {lineups.map((lineup) =>
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
              showOwner={showOwner}
              isOwner={isOwner}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onToggleFeatured={onToggleFeatured}
            />
          ),
        )}
      </LineupCardGrid>
      <LoadMoreTrigger
        onLoadMore={onLoadMore}
        loading={isFetchingNextPage}
        hasMore={hasNextPage}
      />
    </>
  );
}
