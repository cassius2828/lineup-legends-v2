import { playerSchema, lineupSortSchema } from "../lineup";

describe("playerSchema", () => {
  const validPlayer = {
    _id: "player123",
    firstName: "Kevin",
    lastName: "Durant",
    imgUrl: "https://example.com/kd.png",
    value: 5,
  };

  it("accepts a valid player", () => {
    expect(playerSchema.safeParse(validPlayer).success).toBe(true);
  });

  it("rejects missing _id", () => {
    const { _id: _, ...rest } = validPlayer;
    expect(playerSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing firstName", () => {
    const { firstName: _, ...rest } = validPlayer;
    expect(playerSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing lastName", () => {
    const { lastName: _, ...rest } = validPlayer;
    expect(playerSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing imgUrl", () => {
    const { imgUrl: _, ...rest } = validPlayer;
    expect(playerSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing value", () => {
    const { value: _, ...rest } = validPlayer;
    expect(playerSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects non-number value", () => {
    expect(
      playerSchema.safeParse({ ...validPlayer, value: "five" }).success,
    ).toBe(false);
  });
});

describe("lineupSortSchema", () => {
  it("accepts valid sort options", () => {
    for (const v of ["newest", "oldest", "highest-rated", "most-rated"]) {
      expect(lineupSortSchema.safeParse(v).success).toBe(true);
    }
  });

  it("accepts undefined (optional)", () => {
    expect(lineupSortSchema.safeParse(undefined).success).toBe(true);
  });

  it("rejects invalid sort option", () => {
    expect(lineupSortSchema.safeParse("random").success).toBe(false);
  });
});
