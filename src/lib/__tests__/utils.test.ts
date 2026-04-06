import { cn, getVoteDelta } from "../utils";
import { lineupPopulateFields } from "~/server/lib/lineup-queries";

// ============================================
// cn() - class name merging utility
// ============================================
describe("cn", () => {
  it("should merge single class names", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("should merge multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe(
      "base visible",
    );
  });

  it("should handle undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("should merge conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("should handle empty arguments", () => {
    expect(cn()).toBe("");
  });

  it("should handle array of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("should handle object syntax for conditional classes", () => {
    expect(cn({ hidden: false, visible: true })).toBe("visible");
  });
});

// ============================================
// getVoteDelta() - vote delta calculator
// ============================================
describe("getVoteDelta", () => {
  describe("new vote (no existing vote)", () => {
    it("should return +1 for a new upvote", () => {
      expect(getVoteDelta("upvote", null)).toBe(1);
    });

    it("should return -1 for a new downvote", () => {
      expect(getVoteDelta("downvote", null)).toBe(-1);
    });
  });

  describe("toggle off (same vote type)", () => {
    it("should return -1 when toggling off an existing upvote", () => {
      expect(getVoteDelta("upvote", "upvote")).toBe(-1);
    });

    it("should return +1 when toggling off an existing downvote", () => {
      expect(getVoteDelta("downvote", "downvote")).toBe(1);
    });
  });

  describe("switch vote type", () => {
    it("should return +2 when switching from downvote to upvote", () => {
      expect(getVoteDelta("upvote", "downvote")).toBe(2);
    });

    it("should return -2 when switching from upvote to downvote", () => {
      expect(getVoteDelta("downvote", "upvote")).toBe(-2);
    });
  });
});

// ============================================
// lineupPopulateFields - constant definition
// ============================================
describe("lineupPopulateFields", () => {
  it("should have 6 populate fields", () => {
    expect(lineupPopulateFields).toHaveLength(6);
  });

  it("should include all 5 player positions", () => {
    const positions = ["pg", "sg", "sf", "pf", "c"];
    positions.forEach((pos) => {
      expect(lineupPopulateFields).toContainEqual({
        path: `players.${pos}`,
        model: "Player",
      });
    });
  });

  it("should include the owner field", () => {
    expect(lineupPopulateFields).toContainEqual({
      path: "owner",
      model: "User",
    });
  });

  it("should reference correct model names", () => {
    const models = lineupPopulateFields.map((f) => f.model);
    const playerModels = models.filter((m) => m === "Player");
    const userModels = models.filter((m) => m === "User");
    expect(playerModels).toHaveLength(5);
    expect(userModels).toHaveLength(1);
  });
});
