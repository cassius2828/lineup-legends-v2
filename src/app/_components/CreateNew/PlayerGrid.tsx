import { cn } from "~/lib/utils";
import { DraggablePlayerCard } from "../DraggablePlayerCard";
import { getId } from "~/lib/types";
import type { PlayerOutput } from "~/server/api/schemas/output";

const PlayerGrid = ({
  allPlayers,
  isPlayerSelected,
  handlePlayerClick,
  canAffordPlayer,
  filledSlots,
  isLoading = false,
}: {
  allPlayers: { label: string; players: PlayerOutput[] }[];
  isPlayerSelected: (player: PlayerOutput) => boolean;
  handlePlayerClick: (player: PlayerOutput) => void;
  canAffordPlayer: (player: PlayerOutput) => boolean;
  filledSlots: number;
  isLoading?: boolean;
}) => {
  return (
    <div className={cn("flex flex-col gap-2", isLoading && "animate-pulse")}>
      {allPlayers.map(({ label, players }) => (
        <div key={label} className="flex items-start gap-2 sm:gap-3">
          <h2 className="text-foreground absolute left-0 w-8 pt-4 text-right text-base font-bold sm:relative sm:pt-6 sm:text-xl">
            {label}
          </h2>

          <div className="grid grid-cols-5 gap-2 sm:gap-5">
            {players.map((player) => (
              <DraggablePlayerCard
                key={getId(player)}
                player={player}
                selected={isPlayerSelected(player)}
                onSelect={handlePlayerClick}
                disabled={
                  isLoading ||
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
