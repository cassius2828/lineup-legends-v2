import { getRatingColor } from "../rating-color";

describe("getRatingColor", () => {
  it("returns the lowest color at RATING_MIN", () => {
    expect(getRatingColor(0.01)).toBe("#7f1d1d");
  });

  it("returns the highest color at RATING_MAX", () => {
    expect(getRatingColor(10)).toBe("#99fcff");
  });

  it("clamps below RATING_MIN to the lowest color", () => {
    expect(getRatingColor(-5)).toBe("#7f1d1d");
    expect(getRatingColor(0)).toBe("#7f1d1d");
  });

  it("clamps above RATING_MAX to the highest color", () => {
    expect(getRatingColor(15)).toBe("#99fcff");
  });

  it("returns an interpolated color at the midpoint (5)", () => {
    const color = getRatingColor(5);
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
    expect(color).toBe("#eab308");
  });

  it("returns a valid hex color for arbitrary ratings", () => {
    for (const r of [1, 2.5, 3.7, 7.5, 9.9]) {
      expect(getRatingColor(r)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("returns green-ish color at 7.5", () => {
    expect(getRatingColor(7.5)).toBe("#22c55e");
  });

  it("returns orange at 2.5", () => {
    expect(getRatingColor(2.5)).toBe("#ea580c");
  });
});
