import type { GambleOutcomeTier } from "~/server/models";

export const VALUE_COLORS: Record<number, string> = {
  5: "#99fcff",
  4: "#8317e8",
  3: "#e3b920",
  2: "#c0c0c0",
  1: "#804a14",
};

export const VALUE_LABELS: Record<number, string> = {
  5: "Diamond",
  4: "Amethyst",
  3: "Gold",
  2: "Silver",
  1: "Bronze",
};

export type AnimationPhase = "suspense" | "reveal" | "celebration" | "done";

export type OutcomeCategory = "positive" | "neutral" | "negative";

export function getOutcomeCategory(tier: GambleOutcomeTier): OutcomeCategory {
  if (tier === "jackpot" || tier === "big_win" || tier === "upgrade")
    return "positive";
  if (tier === "neutral") return "neutral";
  return "negative";
}

export interface TierAnimationConfig {
  flipDuration: number;
  suspenseDuration: number;
  confettiCount: number;
  confettiSpread: number;
  screenShake: boolean;
  lightBeams: boolean;
  glowIntensity: number; // 1-3
}

export function getTierConfig(tier: GambleOutcomeTier): TierAnimationConfig {
  switch (tier) {
    case "jackpot":
      return {
        flipDuration: 0.8,
        suspenseDuration: 2500,
        confettiCount: 200,
        confettiSpread: 360,
        screenShake: true,
        lightBeams: true,
        glowIntensity: 3,
      };
    case "big_win":
      return {
        flipDuration: 0.9,
        suspenseDuration: 2200,
        confettiCount: 120,
        confettiSpread: 300,
        screenShake: true,
        lightBeams: true,
        glowIntensity: 2,
      };
    case "upgrade":
      return {
        flipDuration: 1.0,
        suspenseDuration: 2000,
        confettiCount: 60,
        confettiSpread: 200,
        screenShake: false,
        lightBeams: true,
        glowIntensity: 2,
      };
    case "neutral":
      return {
        flipDuration: 1.1,
        suspenseDuration: 1800,
        confettiCount: 0,
        confettiSpread: 0,
        screenShake: false,
        lightBeams: false,
        glowIntensity: 1,
      };
    case "downgrade":
      return {
        flipDuration: 1.3,
        suspenseDuration: 1600,
        confettiCount: 0,
        confettiSpread: 0,
        screenShake: false,
        lightBeams: false,
        glowIntensity: 1,
      };
    case "big_loss":
      return {
        flipDuration: 1.4,
        suspenseDuration: 1500,
        confettiCount: 0,
        confettiSpread: 0,
        screenShake: false,
        lightBeams: false,
        glowIntensity: 1,
      };
    case "disaster":
      return {
        flipDuration: 1.5,
        suspenseDuration: 1400,
        confettiCount: 0,
        confettiSpread: 0,
        screenShake: false,
        lightBeams: false,
        glowIntensity: 1,
      };
  }
}
