"use client";

import type { PlayerType } from "~/lib/types";
import { VALUE_SHADOWS_LARGE } from "~/lib/constants";
import { PlayerImage } from "~/app/_components/PlayerImage";

const CreateLineupPlayerDragOverlay = ({
  activePlayer,
}: {
  activePlayer: PlayerType;
}) => {
  return (
    <div className="relative flex w-[4.5rem] flex-col items-center opacity-90">
      <div
        className={`ring-gold relative h-[4.5rem] w-[4.5rem] scale-110 overflow-hidden rounded-lg bg-[#f2f2f2] shadow-2xl ring-2 ${
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
        <p className="text-xs font-medium text-foreground drop-shadow-lg">
          {activePlayer.firstName.length < 9 ? activePlayer.firstName : ""}
        </p>
        <p className="text-xs text-foreground/80 drop-shadow-lg">
          {activePlayer.lastName.length < 9 ? activePlayer.lastName : ""}
        </p>
      </div>
    </div>
  );
};
export default CreateLineupPlayerDragOverlay;
