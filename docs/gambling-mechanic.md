# Gambling Mechanic

The gamble feature lets lineup owners swap a player at a given position for a new player. The **outcome value** (1–5) is determined by a **weighted probability matrix** based on the current player’s value, so lower-value players are riskier with more upside, and higher-value players are safer with less upside.

## Overview

- **Scope**: One position per gamble (PG, SG, SF, PF, or C).
- **Input**: `lineupId`, `position`.
- **Authorization**: Only the lineup owner can gamble.
- **Result**: The lineup is updated with a new player at that position; the previous player is replaced. The API returns the updated lineup, both players, and outcome metadata (value change) for UI feedback.

## Why Weighted Odds?

The previous logic had limited strategic depth:

- **Value 1**: Could only stay at 1 (no upside).
- **Value 5**: 50/50 between 4 and 5 (little risk).
- **Values 2–4**: Equal 33% chance for each of the three adjacent values.

The new system uses a **probability matrix** so that:

- **Lower value (e.g. 1)** = higher risk, but real chance to upgrade (hail mary).
- **Higher value (e.g. 5)** = safer odds, likely to stay high (low risk, low reward).

This makes the decision to gamble depend on both the current player and how much risk the user wants to take.

## Probability Matrix

Each row is the **current player value** (1–5). Each column is the **resulting value** (1–5). Values are percentages that sum to 100.

| Current value | → 1 | → 2 | → 3 | → 4 | → 5 |
| ------------- | --- | --- | --- | --- | --- |
| **1**         | 55% | 25% | 12% | 6%  | 2%  |
| **2**         | 30% | 40% | 20% | 7%  | 3%  |
| **3**         | 10% | 20% | 45% | 18% | 7%  |
| **4**         | 5%  | 8%  | 17% | 45% | 25% |
| **5**         | 2%  | 5%  | 8%  | 25% | 60% |

Interpretation:

- **Value 1**: 45% chance to upgrade (2–5); 55% stay at 1.
- **Value 5**: 60% stay at 5; 85% chance to keep 4 or 5.
- **Mid values**: Heavier weight on staying near current value, with some chance to move up or down.

## Implementation

### Odds configuration

Odds are defined as a map from current value (1–5) to an array of five weights: `[P(1), P(2), P(3), P(4), P(5)]`, summing to 100.

```typescript
const GAMBLE_ODDS: Record<number, number[]> = {
  // [chance of getting value: 1, 2, 3, 4, 5]
  1: [70, 15, 8, 6, 1], // 30% upgrade chance, mostly small gains
  2: [35, 45, 10, 7, 3], // 20% upgrade, 35% downgrade
  3: [9, 20, 50, 14, 7], // 21% upgrade, 29% downgrade - balanced
  4: [5, 8, 17, 45, 25], // 25% upgrade to 5, 30% downgrade
  5: [2, 5, 8, 25, 60], // 60% stay at 5, very safe
};
```

### Weighted random selection

A single target value (1–5) is chosen using the row for the current value:

```typescript
function selectWeightedValue(currentValue: number): number {
  const weights = GAMBLE_ODDS[currentValue];
  const random = Math.random() * 100;
  let cumulative = 0;

  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) return i + 1;
  }
  return currentValue; // fallback
}
```

### Mutation flow

1. **Resolve lineup and current player**  
   Load lineup by `lineupId`, ensure ownership, get the player at the given position and their `currentValue`.

2. **Choose target value**  
   `targetValue = selectWeightedValue(currentValue)`.

3. **Fetch one replacement player**  
   Query for a player with `value === targetValue` who is not already in the lineup (`_id` not in current lineup player IDs). Use `$sample: { size: 1 }` for a random eligible player.

4. **Fallback**  
   If no player exists at `targetValue`, expand to adjacent values (or a defined fallback strategy) and pick an eligible player.

5. **Update lineup**  
   Set the position to the new player’s ID and increment `timesGambled`.

6. **Return**  
   Return the updated lineup (transformed), previous player, new player, and outcome (previous value, new value, value change) so the UI can show the result.

### Return shape

The gamble mutation returns:

```typescript
{
  lineup: Lineup; // transformed updated lineup
  previousPlayer: Player; // player that was replaced
  newPlayer: Player; // player that was added
  outcome: {
    previousValue: number; // 1–5
    newValue: number; // 1–5
    valueChange: number; // newValue - previousValue
  }
}
```

This supports UI copy such as “You swapped a $2 for a $4 (+2)” or “You dropped from $4 to $2 (-2).”

## Efficiency

- **Single target value**: The matrix gives one target value, so the DB query uses `value: targetValue` (single value) instead of `value: { $in: possibleValues }`.
- **Index**: Queries use the existing index on `Player.value`.
- **One aggregate**: One aggregation (match + sample) is used to get a single replacement player; fallback only runs when that returns no document.

## API

- **Procedure**: `lineup.gamble` (protected mutation).
- **Input**: `{ lineupId: string, position: "pg" | "sg" | "sf" | "pf" | "c" }`.
- **Errors**: `NOT_FOUND` (lineup or current player), `FORBIDDEN` (not owner), `NOT_FOUND` (no eligible replacement after fallback).

## Optional future enhancements

- **Streaks**: Store `lastGambleResult` or similar to show win/loss or value-change streaks.
- **Limits**: Cooldowns or daily gamble limits per lineup.
- **Visual tiers**: Special feedback for big swings (e.g. “jackpot” for +3 value change).
