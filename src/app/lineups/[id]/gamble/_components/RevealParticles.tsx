"use client";

import { useEffect, useRef } from "react";
import type { GambleOutcomeTier } from "~/server/api/schemas/output";
import { VALUE_COLORS, getTierConfig } from "./gamble-reveal-utils";

interface RevealParticlesProps {
  playerValue: number;
  outcomeTier: GambleOutcomeTier;
  fire: boolean;
}

export function RevealParticles({
  playerValue,
  outcomeTier,
  fire,
}: RevealParticlesProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (!fire || hasFired.current) return;
    hasFired.current = true;

    const config = getTierConfig(outcomeTier);
    if (config.confettiCount === 0) return;

    const tierColor = VALUE_COLORS[playerValue] ?? "#e3b920";
    const colors = buildColorPalette(tierColor, outcomeTier);

    void fireConfettiSequence(
      colors,
      config.confettiCount,
      config.confettiSpread,
      outcomeTier,
    );
  }, [fire, playerValue, outcomeTier]);

  return null;
}

function buildColorPalette(
  tierColor: string,
  tier: GambleOutcomeTier,
): string[] {
  const base = [tierColor, "#ffffff"];

  switch (tier) {
    case "jackpot":
      return [...base, "#ffd700", "#ff6b35", "#00ff88", tierColor];
    case "big_win":
      return [...base, "#ffd700", "#00ff88"];
    case "upgrade":
      return [...base, "#00ff88"];
    default:
      return base;
  }
}

async function fireConfettiSequence(
  colors: string[],
  count: number,
  spread: number,
  tier: GambleOutcomeTier,
): Promise<void> {
  const { confetti } = await import("@tsparticles/confetti");

  const base = {
    colors,
    spread,
    ticks: 200,
    gravity: 0.8,
    decay: 0.92,
    startVelocity: 35,
    shapes: ["circle", "square"] as string[],
    zIndex: 9999,
  };

  if (tier === "jackpot") {
    void confetti({
      ...base,
      particleCount: Math.floor(count * 0.4),
      origin: { x: 0.5, y: 0.6 },
      startVelocity: 45,
    });

    await sleep(150);

    void confetti({
      ...base,
      particleCount: Math.floor(count * 0.3),
      origin: { x: 0.3, y: 0.7 },
      angle: 60,
    });
    void confetti({
      ...base,
      particleCount: Math.floor(count * 0.3),
      origin: { x: 0.7, y: 0.7 },
      angle: 120,
    });

    await sleep(300);

    void confetti({
      ...base,
      particleCount: Math.floor(count * 0.5),
      origin: { x: 0.5, y: 0.5 },
      startVelocity: 55,
      spread: 360,
      scalar: 1.2,
    });
  } else if (tier === "big_win") {
    void confetti({
      ...base,
      particleCount: Math.floor(count * 0.5),
      origin: { x: 0.5, y: 0.6 },
      startVelocity: 40,
    });

    await sleep(200);

    void confetti({
      ...base,
      particleCount: Math.floor(count * 0.5),
      origin: { x: 0.5, y: 0.5 },
      spread: 300,
    });
  } else {
    void confetti({
      ...base,
      particleCount: count,
      origin: { x: 0.5, y: 0.6 },
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
