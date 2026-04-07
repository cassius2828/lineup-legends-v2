import type { PlayerOutput } from "~/server/api/schemas/output";
import type { FuseResult } from "fuse.js";
const ResultsCount = ({
  isAllPlayersLoading,
  isInitialRender,
  filteredPlayers,
}: {
  isAllPlayersLoading: boolean;
  isInitialRender: boolean;
  filteredPlayers: FuseResult<PlayerOutput>[];
}) => {
  return (
    <div className="mb-4">
      <p className="text-sm text-foreground/60">
        {isAllPlayersLoading
          ? "Searching..."
          : `Found ${isInitialRender ? 10 : (filteredPlayers?.length ?? 0)} players`}
      </p>
    </div>
  );
};
export default ResultsCount;
