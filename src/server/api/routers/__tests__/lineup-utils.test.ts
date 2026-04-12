import {
  BUDGET_LIMIT,
  GAMBLE_ODDS,
  selectWeightedValue,
  getOutcomeTier,
  calculateStreakChange,
} from "../lineup-utils";

// ============================================
// Constants
// ============================================
describe("lineup constants", () => {
  it("should have a budget limit of 15", () => {
    expect(BUDGET_LIMIT).toBe(15);
  });
});

// ============================================
// GAMBLE_ODDS
// ============================================
describe("GAMBLE_ODDS", () => {
  it("should have odds defined for all player values (1-5)", () => {
    for (let value = 1; value <= 5; value++) {
      expect(GAMBLE_ODDS[value]).toBeDefined();
    }
  });

  it("should have exactly 5 weights per value tier", () => {
    for (let value = 1; value <= 5; value++) {
      expect(GAMBLE_ODDS[value]).toHaveLength(5);
    }
  });

  it("should have weights that sum to 100 for each value tier", () => {
    for (let value = 1; value <= 5; value++) {
      const sum = GAMBLE_ODDS[value]!.reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
    }
  });

  it("should have all non-negative weights", () => {
    for (let value = 1; value <= 5; value++) {
      GAMBLE_ODDS[value]!.forEach((weight) => {
        expect(weight).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it("should have higher self-retention for higher value players", () => {
    // Value 5 players have 60% to stay at 5, value 1 players have 70% to stay at 1
    expect(GAMBLE_ODDS[5]![4]).toBe(60); // 60% chance of staying value 5
    expect(GAMBLE_ODDS[1]![0]).toBe(70); // 70% chance of staying value 1
  });
});

// ============================================
// selectWeightedValue()
// ============================================
describe("selectWeightedValue", () => {
  it("should return a value between 1 and 5", () => {
    for (let i = 0; i < 100; i++) {
      const result = selectWeightedValue(3);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(5);
    }
  });

  it("should return the current value for unknown value tiers", () => {
    expect(selectWeightedValue(0)).toBe(0);
    expect(selectWeightedValue(6)).toBe(6);
    expect(selectWeightedValue(-1)).toBe(-1);
  });

  it("should always return 1 when random is very low for value 1 player", () => {
    // When random < 70 (first weight for value 1), should return 1
    jest.spyOn(Math, "random").mockReturnValue(0); // 0 * 100 = 0 < 70
    expect(selectWeightedValue(1)).toBe(1);
    jest.restoreAllMocks();
  });

  it("should return 2 when random falls in second weight range for value 1", () => {
    // Value 1: [70, 15, 8, 6, 1] -> cumulative: [70, 85, 93, 99, 100]
    // random needs to be >= 70 and < 85 -> Math.random() = 0.72 -> 72
    jest.spyOn(Math, "random").mockReturnValue(0.72);
    expect(selectWeightedValue(1)).toBe(2);
    jest.restoreAllMocks();
  });

  it("should return 5 when random is near maximum for value 1", () => {
    // Value 1: [70, 15, 8, 6, 1] -> cumulative: [70, 85, 93, 99, 100]
    // random needs to be >= 99 and < 100 -> Math.random() = 0.995 -> 99.5
    jest.spyOn(Math, "random").mockReturnValue(0.995);
    expect(selectWeightedValue(1)).toBe(5);
    jest.restoreAllMocks();
  });

  it("should return 5 with high probability for value 5 players", () => {
    // Value 5: [2, 5, 8, 25, 60] -> 60% chance of 5
    jest.spyOn(Math, "random").mockReturnValue(0.5); // 50 -> cumulative 2+5+8+25=40, 50 < 100
    expect(selectWeightedValue(5)).toBe(5);
    jest.restoreAllMocks();
  });

  it("should return 3 for value 3 when random falls in middle range", () => {
    // Value 3: [9, 20, 50, 14, 7] -> cumulative: [9, 29, 79, 93, 100]
    // random needs to be >= 29 and < 79 -> Math.random() = 0.5 -> 50
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    expect(selectWeightedValue(3)).toBe(3);
    jest.restoreAllMocks();
  });

  it("should statistically follow the probability distribution", () => {
    // Run many iterations and check distribution roughly matches odds
    const iterations = 10000;
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (let i = 0; i < iterations; i++) {
      const result = selectWeightedValue(3);
      counts[result] = (counts[result] ?? 0) + 1;
    }

    // Value 3 odds: [9, 20, 50, 14, 7]
    // Allow ±5% tolerance
    const tolerance = 0.05;
    expect(counts[1]! / iterations).toBeCloseTo(0.09, 1);
    expect(counts[3]! / iterations).toBeGreaterThan(0.5 - tolerance);
    expect(counts[3]! / iterations).toBeLessThan(0.5 + tolerance);
  });
});

// ============================================
// getOutcomeTier()
// ============================================
describe("getOutcomeTier", () => {
  it("should return 'jackpot' for +3 or higher value change", () => {
    expect(getOutcomeTier(3)).toBe("jackpot");
    expect(getOutcomeTier(4)).toBe("jackpot");
    expect(getOutcomeTier(10)).toBe("jackpot");
  });

  it("should return 'big_win' for +2 value change", () => {
    expect(getOutcomeTier(2)).toBe("big_win");
  });

  it("should return 'upgrade' for +1 value change", () => {
    expect(getOutcomeTier(1)).toBe("upgrade");
  });

  it("should return 'neutral' for 0 value change", () => {
    expect(getOutcomeTier(0)).toBe("neutral");
  });

  it("should return 'downgrade' for -1 value change", () => {
    expect(getOutcomeTier(-1)).toBe("downgrade");
  });

  it("should return 'big_loss' for -2 value change", () => {
    expect(getOutcomeTier(-2)).toBe("big_loss");
  });

  it("should return 'disaster' for -3 or worse value change", () => {
    expect(getOutcomeTier(-3)).toBe("disaster");
    expect(getOutcomeTier(-4)).toBe("disaster");
    expect(getOutcomeTier(-10)).toBe("disaster");
  });
});

// ============================================
// calculateStreakChange()
// ============================================
describe("calculateStreakChange", () => {
  describe("positive value change (upgrade)", () => {
    it("should start a new positive streak from 0", () => {
      expect(calculateStreakChange(0, 1)).toBe(1);
    });

    it("should continue an existing positive streak", () => {
      expect(calculateStreakChange(1, 1)).toBe(2);
      expect(calculateStreakChange(3, 2)).toBe(4);
    });

    it("should reset to 1 when coming from a negative streak", () => {
      expect(calculateStreakChange(-2, 1)).toBe(1);
      expect(calculateStreakChange(-5, 3)).toBe(1);
    });
  });

  describe("negative value change (downgrade)", () => {
    it("should start a new negative streak from 0", () => {
      expect(calculateStreakChange(0, -1)).toBe(-1);
    });

    it("should continue an existing negative streak", () => {
      expect(calculateStreakChange(-1, -1)).toBe(-2);
      expect(calculateStreakChange(-3, -2)).toBe(-4);
    });

    it("should reset to -1 when coming from a positive streak", () => {
      expect(calculateStreakChange(2, -1)).toBe(-1);
      expect(calculateStreakChange(5, -3)).toBe(-1);
    });
  });

  describe("zero value change (neutral)", () => {
    it("should reset streak to 0 from positive", () => {
      expect(calculateStreakChange(3, 0)).toBe(0);
    });

    it("should reset streak to 0 from negative", () => {
      expect(calculateStreakChange(-3, 0)).toBe(0);
    });

    it("should remain 0 when already at 0", () => {
      expect(calculateStreakChange(0, 0)).toBe(0);
    });
  });
});
