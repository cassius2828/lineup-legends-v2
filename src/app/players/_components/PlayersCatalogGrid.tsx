import { PlayerImage } from "~/app/_components/PlayerImage";
import { VALUE_SHADOWS } from "~/lib/constants";
import type { PlayerOutput } from "~/server/api/schemas/output";

type PlayersCatalogGridProps = {
  players: PlayerOutput[];
  onPlayerClick: (playerId: string) => void;
};

export function PlayersCatalogGrid({
  players,
  onPlayerClick,
}: PlayersCatalogGridProps) {
  return (
    <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {players.map((player) => (
        <div
          key={player._id?.toString()}
          className="group flex flex-col items-center"
        >
          <div
            className={`relative h-24 w-24 overflow-hidden bg-[#f2f2f2] transition-all duration-200 sm:h-28 sm:w-28 ${
              VALUE_SHADOWS[player.value ?? 0]
            } group-hover:scale-105`}
          >
            <PlayerImage
              onClick={() => onPlayerClick(player._id?.toString() ?? "")}
              imgUrl={player.imgUrl ?? undefined}
              alt={`${player.firstName ?? ""} ${player.lastName ?? ""}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="mt-2 text-center">
            <p className="text-foreground text-sm font-medium">
              {player.firstName}
            </p>
            <p className="text-foreground/80 text-sm">{player.lastName}</p>
            <p className="text-gold mt-1 text-xs font-medium">
              ${player.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
