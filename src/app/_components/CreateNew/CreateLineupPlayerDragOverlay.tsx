"use client";

import type { PlayerOutput } from "~/server/api/schemas/output";
import { VALUE_SHADOWS_LARGE } from "~/lib/constants";
import { PlayerImage } from "~/app/_components/PlayerImage";

const CreateLineupPlayerDragOverlay = ({
  activePlayer,
}: {
  activePlayer: PlayerOutput;
}) => {
  return (
    <div className="relative flex w-12 flex-col items-center opacity-90 sm:w-[4.5rem]">
      <div
        className={`ring-gold relative h-12 w-12 scale-110 overflow-hidden rounded-lg bg-[#f2f2f2] shadow-2xl ring-2 sm:h-[4.5rem] sm:w-[4.5rem] ${
          VALUE_SHADOWS_LARGE[activePlayer.value] ?? ""
        }`}
      >
        <PlayerImage
          imgUrl={activePlayer.imgUrl}
          alt={`${activePlayer.firstName} ${activePlayer.lastName}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="mt-1 h-10 text-center">
        <p className="text-foreground text-xs font-medium drop-shadow-lg">
          {activePlayer.firstName.length > 8
            ? activePlayer.firstName.slice(0, 7) + "…"
            : activePlayer.firstName}
        </p>
        <p className="text-foreground/80 text-xs drop-shadow-lg">
          {activePlayer.lastName.length > 8
            ? activePlayer.lastName.slice(0, 7) + "…"
            : activePlayer.lastName}
        </p>
      </div>
    </div>
  );
};
export default CreateLineupPlayerDragOverlay;
