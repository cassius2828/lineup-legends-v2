import { mongoIdString, lineupFilterInput } from "../lineup-filter";

describe("mongoIdString", () => {
  it("accepts a valid 24-char hex string", () => {
    const result = mongoIdString.safeParse("507f1f77bcf86cd799439011");
    expect(result.success).toBe(true);
  });

  it("accepts uppercase hex", () => {
    const result = mongoIdString.safeParse("507F1F77BCF86CD799439011");
    expect(result.success).toBe(true);
  });

  it("rejects a string that is too short", () => {
    const result = mongoIdString.safeParse("507f1f77bcf86cd79943901");
    expect(result.success).toBe(false);
  });

  it("rejects a string that is too long", () => {
    const result = mongoIdString.safeParse("507f1f77bcf86cd7994390111");
    expect(result.success).toBe(false);
  });

  it("rejects non-hex characters", () => {
    const result = mongoIdString.safeParse("507f1f77bcf86cd79943901g");
    expect(result.success).toBe(false);
  });

  it("rejects __proto__", () => {
    const result = mongoIdString.safeParse("__proto__");
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = mongoIdString.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("lineupFilterInput", () => {
  it("applies defaults for sort and limit", () => {
    const result = lineupFilterInput.parse({});
    expect(result.sort).toBe("newest");
    expect(result.limit).toBe(50);
  });

  it("accepts all valid sort values", () => {
    for (const sort of [
      "newest",
      "oldest",
      "highest-rated",
      "most-rated",
    ] as const) {
      const result = lineupFilterInput.safeParse({ sort });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid sort values", () => {
    const result = lineupFilterInput.safeParse({ sort: "random" });
    expect(result.success).toBe(false);
  });

  it("rejects limit below 1", () => {
    const result = lineupFilterInput.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit above 100", () => {
    const result = lineupFilterInput.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("accepts valid filterUserId", () => {
    const result = lineupFilterInput.safeParse({
      filterUserId: "507f1f77bcf86cd799439011",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid filterUserId", () => {
    const result = lineupFilterInput.safeParse({
      filterUserId: "not-an-objectid",
    });
    expect(result.success).toBe(false);
  });

  it("coerces dateFrom string to Date", () => {
    const result = lineupFilterInput.parse({ dateFrom: "2025-06-15" });
    expect(result.dateFrom).toBeInstanceOf(Date);
  });

  it("accepts minRating of 0", () => {
    const result = lineupFilterInput.safeParse({ minRating: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects minRating below 0", () => {
    const result = lineupFilterInput.safeParse({ minRating: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects minRating above 10", () => {
    const result = lineupFilterInput.safeParse({ minRating: 11 });
    expect(result.success).toBe(false);
  });

  it("accepts cursor as any string (offset for rating sorts)", () => {
    const result = lineupFilterInput.safeParse({ cursor: "50" });
    expect(result.success).toBe(true);
  });
});
