import type { PlayerType } from "~/lib/types";
import type { FuseResult } from "fuse.js";
const ResultsCount = ({
  isAllPlayersLoading,
  isInitialRender,
  filteredPlayers,
}: {
  isAllPlayersLoading: boolean;
  isInitialRender: boolean;
  filteredPlayers: FuseResult<PlayerType>[];
}) => {
  return (
    <div className="mb-4">
      <p className="text-sm text-white/60">
        {isAllPlayersLoading
          ? "Searching..."
          : `Found ${isInitialRender ? 10 : (filteredPlayers?.length ?? 0)} players`}
      </p>
    </div>
  );
};
export default ResultsCount;
