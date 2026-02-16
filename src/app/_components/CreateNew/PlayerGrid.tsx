import { DraggablePlayerCard } from "../DraggablePlayerCard";
import { getId } from "~/lib/types";
import { type PlayerType } from "~/lib/types";

const PlayerGrid = ({
  allPlayers,
  isPlayerSelected,
  handlePlayerClick,
  canAffordPlayer,
  filledSlots,
}: {
  allPlayers: { label: string; players: PlayerType[] }[];
  isPlayerSelected: (player: PlayerType) => boolean;
  handlePlayerClick: (player: PlayerType) => void;
  canAffordPlayer: (player: PlayerType) => boolean;
  filledSlots: number;
}) => {
  return (
    <div className="flex flex-col gap-2">
      {allPlayers.map(({ label, players }) => (
        <div key={label} className="flex items-start gap-3">
          {/* Price Label */}
          <h2 className="w-8 pt-6 text-right text-xl font-bold text-white">
            {label}
          </h2>

          {/* Players Row - Fixed 5 columns */}
          <div className="grid grid-cols-5 gap-5">
            {players.map((player) => (
              <DraggablePlayerCard
                key={getId(player)}
                player={player}
                selected={isPlayerSelected(player)}
                onSelect={handlePlayerClick}
                disabled={
                  !canAffordPlayer(player) ||
                  (filledSlots >= 5 && !isPlayerSelected(player))
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
export default PlayerGrid;
