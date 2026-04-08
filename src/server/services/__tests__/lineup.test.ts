import { buildLineupSort } from "../lineup";

describe("buildLineupSort", () => {
  it("returns newest (createdAt desc) by default", () => {
    expect(buildLineupSort()).toEqual({ createdAt: -1 });
  });

  it("returns newest for 'newest'", () => {
    expect(buildLineupSort("newest")).toEqual({ createdAt: -1 });
  });

  it("returns oldest for 'oldest'", () => {
    expect(buildLineupSort("oldest")).toEqual({ createdAt: 1 });
  });

  it("returns highest-rated sort", () => {
    expect(buildLineupSort("highest-rated")).toEqual({ avgRating: -1 });
  });

  it("returns most-rated sort", () => {
    expect(buildLineupSort("most-rated")).toEqual({ ratingCount: -1 });
  });

  it("falls back to newest for unknown sort values", () => {
    expect(buildLineupSort("invalid")).toEqual({ createdAt: -1 });
  });
});
