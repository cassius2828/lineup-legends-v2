import LineupFilters from "~/app/_components/common/lineups/LineupFilters";
import { ViewToggle } from "~/app/_components/common/lineups/ViewToggle";
import type { ViewMode } from "~/app/_components/common/lineups/ViewToggle";
import type { LineupFilterState } from "~/hooks/useLineupFilters";

type LineupFilterRowProps = {
  filters: LineupFilterState;
  onFiltersChange: (filters: LineupFilterState) => void;
  activeFilterCount: number;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  showUserFilter?: boolean;
  excludeUserId?: string;
};

export function LineupFilterRow({
  filters,
  onFiltersChange,
  activeFilterCount,
  view,
  onViewChange,
  showUserFilter,
  excludeUserId,
}: LineupFilterRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <LineupFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        activeFilterCount={activeFilterCount}
        showUserFilter={showUserFilter}
        excludeUserId={excludeUserId}
      />
      <div className="ml-auto">
        <ViewToggle view={view} onChange={onViewChange} />
      </div>
    </div>
  );
}
