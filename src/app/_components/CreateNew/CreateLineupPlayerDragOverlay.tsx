"use client";

import { useEffect, useState } from "react";
import type { PlayerType } from "~/lib/types";
import { getId } from "~/lib/types";

const FALLBACK_PLAYER_IMAGE = "/default-user.jpg";

const CreateLineupPlayerDragOverlay = ({
  activePlayer,
}: {
  activePlayer: PlayerType;
}) => {
  const playerId = getId(activePlayer);
  const [realImageLoaded, setRealImageLoaded] = useState(false);
  useEffect(() => {
    setRealImageLoaded(false);
  }, [playerId]);

  return (
    <div className="relative flex w-[4.5rem] flex-col items-center opacity-90">
      <div
        className={`ring-gold relative h-[4.5rem] w-[4.5rem] scale-110 overflow-hidden rounded-lg bg-[#f2f2f2] shadow-2xl ring-2 ${
          activePlayer.value === 5
            ? "shadow-[0px_0px_20px_5px_#99fcff]"
            : activePlayer.value === 4
              ? "shadow-[0px_0px_20px_5px_#8317e8]"
              : activePlayer.value === 3
                ? "shadow-[0px_0px_20px_5px_#e3b920]"
                : activePlayer.value === 2
                  ? "shadow-[0px_0px_20px_5px_#c0c0c0]"
                  : "shadow-[0px_0px_20px_5px_#804a14]"
        }`}
      >
        {/* Default: visible while the real image loads */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FALLBACK_PLAYER_IMAGE}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Real image: fades in when loaded */}
        {activePlayer.imgUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
              src={activePlayer.imgUrl}
              alt={`${activePlayer.firstName} ${activePlayer.lastName}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
                realImageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setRealImageLoaded(true)}
              onError={() => setRealImageLoaded(false)}
            />
        ) : null}
      </div>
      <div className="mt-1 h-10 text-center">
        <p className="text-xs font-medium text-white drop-shadow-lg">
          {activePlayer.firstName.length < 9 ? activePlayer.firstName : ""}
        </p>
        <p className="text-xs text-white/80 drop-shadow-lg">
          {activePlayer.lastName.length < 9 ? activePlayer.lastName : ""}
        </p>
      </div>
    </div>
  );
};
export default CreateLineupPlayerDragOverlay;
