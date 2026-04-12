# Gambling Mechanic

The gamble feature lets lineup owners swap a player at a given position for a new player. The **outcome value** (1–5) is determined by a **weighted probability matrix** based on the current player's value, so lower-value players are riskier with more upside, and higher-value players are safer with less upside.

## Overview

- **Scope**: One position per gamble (PG, SG, SF, PF, or C).
- **Input**: `lineupId`, `position`.
- **Authorization**: Only the lineup owner can gamble.
- **Limit**: One gamble per lineup (permanent — no daily reset).
- **Result**: The lineup is updated with a new player at that position; the previous player is replaced. The API returns the updated lineup, both players, and outcome metadata (value change, outcome tier, streak) for UI feedback.

## Why Weighted Odds?

The probability matrix provides strategic depth:

- **Lower value (e.g. 1)** = higher risk, but real chance to upgrade (hail mary).
- **Higher value (e.g. 5)** = safer odds, likely to stay high (low risk, low reward).

This makes the decision to gamble depend on both the current player and how much risk the user wants to take.

## Probability Matrix

Each row is the **current player value** (1–5). Each column is the **resulting value** (1–5). Values are percentages that sum to 100.

| Current value | → 1 | → 2 | → 3 | → 4 | → 5 |
| ------------- | --- | --- | --- | --- | --- |
| **1**         | 70% | 15% | 8%  | 6%  | 1%  |
| **2**         | 35% | 45% | 10% | 7%  | 3%  |
| **3**         | 9%  | 20% | 50% | 14% | 7%  |
| **4**         | 5%  | 8%  | 17% | 45% | 25% |
| **5**         | 2%  | 5%  | 8%  | 25% | 60% |

Interpretation:

- **Value 1**: 30% chance to upgrade (2–5); 70% stay at 1.
- **Value 5**: 60% stay at 5; 85% chance to keep 4 or 5.
- **Mid values**: Heavier weight on staying near current value, with some chance to move up or down.

## Implementation

### Odds configuration

Odds are defined in `src/server/api/routers/lineup-utils.ts`:

```typescript
export const GAMBLE_ODDS: Record<number, number[]> = {
  // [chance of getting value: 1, 2, 3, 4, 5]
  1: [70, 15, 8, 6, 1], // 30% upgrade chance
  2: [35, 45, 10, 7, 3], // 20% upgrade, 35% downgrade
  3: [9, 20, 50, 14, 7], // 21% upgrade, 29% downgrade
  4: [5, 8, 17, 45, 25], // 25% upgrade to 5, 30% downgrade
  5: [2, 5, 8, 25, 60], // 60% stay at 5, very safe
};
```

### Weighted random selection

A single target value (1–5) is chosen using the row for the current value:

```typescript
export function selectWeightedValue(currentValue: number): number {
  const weights = GAMBLE_ODDS[currentValue];
  if (!weights) return currentValue;

  const random = Math.random() * 100;
  let cumulative = 0;

  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) return i + 1;
  }
  return currentValue; // fallback
}
```

### Outcome tiers

The value change is classified into 7 tiers for visual and audio feedback:

```typescript
export type GambleOutcomeTier =
  | "jackpot" // +3 or +4 value jump
  | "big_win" // +2 value jump
  | "upgrade" // +1 value jump
  | "neutral" // same value
  | "downgrade" // -1 value drop
  | "big_loss" // -2 value drop
  | "disaster"; // -3 or -4 value drop

export function getOutcomeTier(valueChange: number): GambleOutcomeTier {
  if (valueChange >= 3) return "jackpot";
  if (valueChange === 2) return "big_win";
  if (valueChange === 1) return "upgrade";
  if (valueChange === 0) return "neutral";
  if (valueChange === -1) return "downgrade";
  if (valueChange === -2) return "big_loss";
  return "disaster";
}
```

### Streak tracking

Consecutive upgrades or downgrades are tracked as a streak:

```typescript
export function calculateStreakChange(
  currentStreak: number,
  valueChange: number,
): number {
  if (valueChange > 0) {
    return currentStreak >= 0 ? currentStreak + 1 : 1;
  } else if (valueChange < 0) {
    return currentStreak <= 0 ? currentStreak - 1 : -1;
  }
  return 0; // neutral resets streak
}
```

### Mutation flow

1. **Validate ownership and limit**
   Load lineup by `lineupId`, ensure ownership, reject if `timesGambled >= 1`.

2. **Resolve current player**
   Get the player at the given position and their `currentValue`.

3. **Choose target value**
   `targetValue = selectWeightedValue(currentValue)`.

4. **Fetch one replacement player**
   Query for a player with `value === targetValue` who is not already in the lineup. Use `$sample: { size: 1 }` for a random eligible player.

5. **Fallback**
   If no player exists at `targetValue`, expand to adjacent values and pick an eligible player.

6. **Update lineup**
   Set the position to the new player's ID. Increment `timesGambled`, set `lastGambleResult` and `gambleStreak`.

7. **Return**
   Return the updated lineup, previous player, new player, and outcome (value change, outcome tier) so the UI can show the result.

### Return shape

The gamble mutation returns:

```typescript
{
  lineup: Lineup;
  previousPlayer: Player;
  newPlayer: Player;
  outcome: {
    previousValue: number;
    newValue: number;
    valueChange: number;
    outcomeTier: GambleOutcomeTier;
  }
}
```

## UI

### Gamble page (`/lineups/[id]/gamble`)

- Shows a position selector when the lineup has not been gambled yet.
- If `timesGambled >= 1`, the page shows a **locked state** with an "Already Gambled" message instead of the selector.
- An **info icon** (Lucide `Info`) next to the heading opens a modal explaining the gambling mechanics (weighted odds, outcome tiers, once-per-lineup rule, streak tracking).
- On the lineup card, the **Gamble button** is disabled (shows "Gambled") when the lineup has already been gambled.

### GambleReveal component

The `GambleReveal` component (`src/app/lineups/[id]/gamble/_components/GambleReveal.tsx`) provides an animated reveal experience:

### Phases

1. **Suspense**: Mystery card with suspenseful build-up
2. **Reveal**: Card flip animation (Framer Motion) revealing the new player
3. **Celebration**: Confetti particles and outcome label
4. **Done**: Comparison view showing previous → new player

### Features

- Sound effects via `useGambleSounds` hook (keyed to outcome tier)
- Confetti particle effects via `RevealParticles`
- Skip button to jump to the result
- Outcome-tier-specific labels and colors
- Side-by-side player comparison with value change indicator

### Admin Preview

The `/admin/gamble-animations` page lets admins test all 7 outcome tiers with mock data.

## Efficiency

- **Single target value**: The matrix gives one target value, so the DB query uses `value: targetValue` instead of `value: { $in: possibleValues }`.
- **Index**: Queries use the existing index on `Player.value`.
- **One aggregate**: One aggregation (match + sample) is used to get a single replacement player; fallback only runs when that returns no document.

## API

- **Procedure**: `lineup.gamble` (protected mutation).
- **Input**: `{ lineupId: string, position: "pg" | "sg" | "sf" | "pf" | "c" }`.
- **Errors**: `NOT_FOUND` (lineup or current player), `FORBIDDEN` (not owner), `TOO_MANY_REQUESTS` (already gambled), `NOT_FOUND` (no eligible replacement after fallback).

## Lineup Model Gambling Fields

```typescript
// src/server/models/lineup.ts
{
  timesGambled:        { type: Number, default: 0 },     // acts as the once-per-lineup guard
  lastGambleResult:    { type: LastGambleResultSchema, default: undefined },
  gambleStreak:        { type: Number, default: 0 },
  // Legacy fields (kept for existing documents, no longer written to):
  dailyGamblesUsed:    { type: Number, default: 0 },
  dailyGamblesResetAt: { type: Date, default: undefined },
}
```
