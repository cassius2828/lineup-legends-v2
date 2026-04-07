import mongoose from "mongoose";
import { LineupModel } from "../lineup";

describe("LineupModel", () => {
  const mockPlayerId = () => new mongoose.Types.ObjectId();
  const mockOwnerId = () => new mongoose.Types.ObjectId();

  const validLineupData = () => ({
    players: {
      pg: mockPlayerId(),
      sg: mockPlayerId(),
      sf: mockPlayerId(),
      pf: mockPlayerId(),
      c: mockPlayerId(),
    },
    owner: mockOwnerId(),
  });

  describe("schema validation", () => {
    it("should validate a valid lineup with required fields", () => {
      const lineup = new LineupModel(validLineupData());
      const error = lineup.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require all player positions", () => {
      const positions = ["pg", "sg", "sf", "pf", "c"] as const;
      for (const pos of positions) {
        const data = validLineupData();
        // @ts-expect-error - intentionally setting to undefined for validation test
        data.players[pos] = undefined;
        const lineup = new LineupModel(data);
        const error = lineup.validateSync();
        expect(error).toBeDefined();
      }
    });

    it("should require owner", () => {
      const data = validLineupData();
      // @ts-expect-error - intentionally removing owner for validation test
      delete data.owner;
      const lineup = new LineupModel(data);
      const error = lineup.validateSync();
      expect(error).toBeDefined();
    });
  });

  describe("default values", () => {
    it("should default featured to false", () => {
      const lineup = new LineupModel(validLineupData());
      expect(lineup.featured).toBe(false);
    });

    it("should default avgRating to 0", () => {
      const lineup = new LineupModel(validLineupData());
      expect(lineup.avgRating).toBe(0);
    });

    it("should default timesGambled to 0", () => {
      const lineup = new LineupModel(validLineupData());
      expect(lineup.timesGambled).toBe(0);
    });

    it("should default gambleStreak to 0", () => {
      const lineup = new LineupModel(validLineupData());
      expect(lineup.gambleStreak).toBe(0);
    });

    it("should default dailyGamblesUsed to 0", () => {
      const lineup = new LineupModel(validLineupData());
      expect(lineup.dailyGamblesUsed).toBe(0);
    });

    it("should default lastGambleResult to undefined", () => {
      const lineup = new LineupModel(validLineupData());
      expect(lineup.lastGambleResult).toBeUndefined();
    });

    it("should default lastGambleAt to undefined", () => {
      const lineup = new LineupModel(validLineupData());
      expect(lineup.lastGambleAt).toBeUndefined();
    });

    it("should default dailyGamblesResetAt to undefined", () => {
      const lineup = new LineupModel(validLineupData());
      expect(lineup.dailyGamblesResetAt).toBeUndefined();
    });
  });

  describe("lastGambleResult subdocument", () => {
    it("should accept a valid lastGambleResult", () => {
      const data = {
        ...validLineupData(),
        lastGambleResult: {
          previousValue: 3,
          newValue: 5,
          valueChange: 2,
          outcomeTier: "big_win" as const,
          position: "pg" as const,
          timestamp: new Date(),
        },
      };
      const lineup = new LineupModel(data);
      const error = lineup.validateSync();
      expect(error).toBeUndefined();
      expect(lineup.lastGambleResult?.valueChange).toBe(2);
      expect(lineup.lastGambleResult?.outcomeTier).toBe("big_win");
    });

    it("should validate outcomeTier enum values", () => {
      const validTiers = [
        "jackpot",
        "big_win",
        "upgrade",
        "neutral",
        "downgrade",
        "big_loss",
        "disaster",
      ];
      for (const tier of validTiers) {
        const data = {
          ...validLineupData(),
          lastGambleResult: {
            previousValue: 3,
            newValue: 4,
            valueChange: 1,
            outcomeTier: tier,
            position: "pg",
            timestamp: new Date(),
          },
        };
        const lineup = new LineupModel(data);
        const error = lineup.validateSync();
        expect(error).toBeUndefined();
      }
    });

    it("should validate position enum values", () => {
      const validPositions = ["pg", "sg", "sf", "pf", "c"];
      for (const pos of validPositions) {
        const data = {
          ...validLineupData(),
          lastGambleResult: {
            previousValue: 3,
            newValue: 4,
            valueChange: 1,
            outcomeTier: "upgrade",
            position: pos,
            timestamp: new Date(),
          },
        };
        const lineup = new LineupModel(data);
        const error = lineup.validateSync();
        expect(error).toBeUndefined();
      }
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual", () => {
      const objectId = new mongoose.Types.ObjectId();
      const lineup = new LineupModel({ _id: objectId, ...validLineupData() });
      expect((lineup as unknown as { id: string }).id).toBe(objectId.toHexString());
    });

    it("should include virtuals in toJSON output", () => {
      const lineup = new LineupModel(validLineupData());
      const json = lineup.toJSON();
      expect(json).toHaveProperty('id');
    });

    it("should include virtuals in toObject output", () => {
      const lineup = new LineupModel(validLineupData());
      const obj = lineup.toObject();
      expect(obj).toHaveProperty('id');
    });
  });

  describe("timestamps", () => {
    it("should have timestamps option enabled", () => {
      const schema = LineupModel.schema;
      expect(schema.options.timestamps).toBe(true);
    });
  });
});
