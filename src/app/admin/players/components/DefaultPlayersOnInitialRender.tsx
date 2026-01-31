import Link from "next/link";
import type { PlayerType } from "~/lib/types";
// Value-based box-shadow glow colors
const valueShadows: Record<number, string> = {
  5: "shadow-[0px_0px_10px_3px_#99fcff]",
  4: "shadow-[0px_0px_10px_3px_#8317e8]",
  3: "shadow-[0px_0px_10px_3px_#e3b920]",
  2: "shadow-[0px_0px_10px_3px_#c0c0c0]",
  1: "shadow-[0px_0px_10px_3px_#804a14]",
};
const DefaultPlayersOnInitialRender = ({
  allPlayersData,
}: {
  allPlayersData: PlayerType[];
}) => {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {allPlayersData?.slice(0, 10)?.map((player) => (
        <Link
          key={player._id?.toString()}
          href={`/admin/edit-player/${player._id?.toString()}`}
          className="group flex flex-col items-center"
        >
          {/* Player Image */}
          <div
            className={`relative h-28 w-28 overflow-hidden bg-[#f2f2f2] transition-all duration-200 ${
              valueShadows[player.value ?? 0]
            } cursor-pointer group-hover:scale-105`}
          >
            {/* need a trick to ensure this takes up entire div */}
            {/* //* remains regular img componet due to how we store our player images */}
            <img
              src={player.imgUrl}
              alt={`${player.firstName} ${player.lastName}`}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Player Info */}
          <div className="mt-2 text-center">
            <p className="text-sm font-medium text-white">{player.firstName}</p>
            <p className="text-sm text-white/80">{player.lastName}</p>
            <p className="text-gold mt-1 text-xs">${player.value}</p>
          </div>

          {/* Edit Indicator */}
          <p className="mt-2 text-xs text-white/40 opacity-0 transition-opacity group-hover:opacity-100">
            Click to edit
          </p>
        </Link>
      ))}
    </div>
  );
};
export default DefaultPlayersOnInitialRender;
