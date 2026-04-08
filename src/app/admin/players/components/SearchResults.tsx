import type { FuseResult } from "fuse.js";
import Link from "next/link";
import type { PlayerOutput } from "~/server/api/schemas/output";
import { PlayerImage } from "~/app/_components/PlayerImage";

const SearchResults = ({
  filteredPlayers,
}: {
  filteredPlayers: FuseResult<PlayerOutput>[];
}) => {
  // Value-based box-shadow glow colors
  const valueShadows: Record<number, string> = {
    5: "shadow-[0px_0px_10px_3px_#99fcff]",
    4: "shadow-[0px_0px_10px_3px_#8317e8]",
    3: "shadow-[0px_0px_10px_3px_#e3b920]",
    2: "shadow-[0px_0px_10px_3px_#c0c0c0]",
    1: "shadow-[0px_0px_10px_3px_#804a14]",
  };
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {filteredPlayers?.map((player) => (
        <Link
          key={player.item?._id?.toString()}
          href={`/admin/edit-player/${player.item?._id?.toString()}`}
          className="group flex flex-col items-center"
        >
          {/* Player Image */}
          <div
            className={`relative h-28 w-28 overflow-hidden bg-[#f2f2f2] transition-all duration-200 ${
              valueShadows[player.item?.value ?? 0]
            } cursor-pointer group-hover:scale-105`}
          >
            <PlayerImage
              imgUrl={player.item.imgUrl ?? undefined}
              alt={`${player.item.firstName ?? ""} ${player.item.lastName ?? ""}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          {/* Player Info */}
          <div className="mt-2 text-center">
            <p className="text-foreground text-sm font-medium">
              {player?.item?.firstName ?? ""}
            </p>
            <p className="text-foreground/80 text-sm">
              {player?.item?.lastName ?? ""}
            </p>
            <p className="text-gold mt-1 text-xs">
              ${player?.item?.value ?? 0}
            </p>
          </div>

          {/* Edit Indicator */}
          <p className="text-foreground/40 mt-2 text-xs opacity-0 transition-opacity group-hover:opacity-100">
            Click to edit
          </p>
        </Link>
      ))}
    </div>
  );
};
export default SearchResults;
