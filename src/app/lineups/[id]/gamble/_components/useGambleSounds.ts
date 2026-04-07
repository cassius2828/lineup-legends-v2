import { useCallback } from "react";
import useSound from "use-sound";
import { getOutcomeCategory } from "./gamble-reveal-utils";
import type { GambleOutcomeTier } from "~/server/api/schemas/output";

const SOUND_BASE = "/sounds/gamble";

export function useGambleSounds(outcomeTier: GambleOutcomeTier) {
  const category = getOutcomeCategory(outcomeTier);

  const [playSuspense, { stop: stopSuspense }] = useSound(
    `${SOUND_BASE}/suspense.wav`,
    { volume: 0.35, loop: true, playbackRate: 0.55 },
  );

  const [playFlip] = useSound(`${SOUND_BASE}/card-flip.wav`, {
    volume: 0.5,
  });

  const [playWin] = useSound(`${SOUND_BASE}/win.wav`, { volume: 0.7 });
  const [playNeutral] = useSound(`${SOUND_BASE}/neutral.wav`, {
    volume: 0.45,
  });
  const [playLose] = useSound(`${SOUND_BASE}/lose.wav`, { volume: 0.5 });

  const playCelebration = useCallback(() => {
    if (category === "positive") playWin();
    else if (category === "negative") playLose();
    else playNeutral();
  }, [category, playWin, playLose, playNeutral]);

  return {
    playSuspense,
    stopSuspense,
    playFlip,
    playCelebration,
  };
}
