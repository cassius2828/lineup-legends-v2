import type { GambleOutcomeTier } from "~/server/api/schemas/output";
import { BUDGET_LIMIT } from "~/lib/constants";

export { BUDGET_LIMIT };

// ============================================
// GAMBLING CONFIGURATION
// ============================================

/**
 * Weighted probability matrix for gambling outcomes.
 * Each row represents the current player value (1-5).
 * Each column represents the probability (%) of getting a player of that value.
 *
 * Design philosophy:
 * - Lower value players = higher risk, small upside potential (hail mary)
 * - Higher value players = safer odds, maintain value (low risk, low reward)
 */
export const GAMBLE_ODDS: Record<number, number[]> = {
  // [chance of getting value: 1, 2, 3, 4, 5]
  1: [70, 15, 8, 6, 1], // 45% upgrade chance, mostly small gains
  2: [35, 45, 10, 7, 3], // 30% upgrade, 30% downgrade
  3: [9, 20, 50, 14, 7], // 25% upgrade, 30% downgrade - balanced
  4: [5, 8, 17, 45, 25], // 25% upgrade to 5, 30% downgrade
  5: [2, 5, 8, 25, 60], // 60% stay at 5, very safe
};

/** Maximum gambles allowed per day per lineup */
export const DAILY_GAMBLE_LIMIT = 3;

/**
 * Selects a target player value based on weighted probabilities.
 * Uses cumulative probability distribution for selection.
 */
export function selectWeightedValue(currentValue: number): number {
  const weights = GAMBLE_ODDS[currentValue];
  if (!weights) return currentValue;

  const random = Math.random() * 100;
  let cumulative = 0;

  for (let i = 0; i < weights.length; i++) {
    const weight = weights[i] ?? 0;
    cumulative += weight;
    if (random < cumulative) {
      return i + 1; // Values are 1-indexed
    }
  }

  return currentValue; // Fallback
}

/**
 * Determines the outcome tier based on value change.
 * Used for visual feedback in the UI.
 */
export function getOutcomeTier(valueChange: number): GambleOutcomeTier {
  if (valueChange >= 3) return "jackpot";
  if (valueChange === 2) return "big_win";
  if (valueChange === 1) return "upgrade";
  if (valueChange === 0) return "neutral";
  if (valueChange === -1) return "downgrade";
  if (valueChange === -2) return "big_loss";
  return "disaster"; // -3 or worse
}

/**
 * Calculates streak change based on outcome.
 * Positive outcomes continue/start positive streak.
 * Negative outcomes continue/start negative streak.
 * Neutral resets streak.
 */
export function calculateStreakChange(
  currentStreak: number,
  valueChange: number,
): number {
  if (valueChange > 0) {
    // Upgrade: continue positive streak or start new one
    return currentStreak >= 0 ? currentStreak + 1 : 1;
  } else if (valueChange < 0) {
    // Downgrade: continue negative streak or start new one
    return currentStreak <= 0 ? currentStreak - 1 : -1;
  }
  // Neutral: reset streak
  return 0;
}

/**
 * Checks if the daily gamble limit should reset (new day).
 */
export function shouldResetDailyGambles(resetAt: Date | undefined): boolean {
  if (!resetAt) return true;
  const now = new Date();
  const resetDate = new Date(resetAt);
  return (
    now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
    now.getUTCMonth() !== resetDate.getUTCMonth() ||
    now.getUTCDate() !== resetDate.getUTCDate()
  );
}
