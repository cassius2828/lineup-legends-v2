import mongoose from "mongoose";
import { startOfDay, endOfDay } from "date-fns";
import { buildLineupSort, buildLineupFilter, applyCursor } from "../lineup";

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

  it("returns compound highest-rated sort with _id tiebreaker", () => {
    expect(buildLineupSort("highest-rated")).toEqual({
      avgRating: -1,
      _id: -1,
    });
  });

  it("returns compound most-rated sort with _id tiebreaker", () => {
    expect(buildLineupSort("most-rated")).toEqual({
      ratingCount: -1,
      _id: -1,
    });
  });

  it("falls back to newest for unknown sort values", () => {
    expect(buildLineupSort("invalid")).toEqual({ createdAt: -1 });
  });
});

describe("buildLineupFilter", () => {
  it("returns empty filter when no inputs provided", () => {
    expect(buildLineupFilter({})).toEqual({});
  });

  it("preserves base filter fields", () => {
    const base = { owner: "user123" };
    const result = buildLineupFilter({}, base);
    expect(result.owner).toBe("user123");
  });

  it("applies dateFrom as $gte on createdAt", () => {
    const from = new Date("2025-06-15T12:00:00Z");
    const result = buildLineupFilter({ dateFrom: from });
    const createdAt = result.createdAt as Record<string, Date>;
    expect(createdAt.$gte).toEqual(startOfDay(from));
  });

  it("applies dateTo as $lte on createdAt", () => {
    const to = new Date("2025-06-20T12:00:00Z");
    const result = buildLineupFilter({ dateTo: to });
    const createdAt = result.createdAt as Record<string, Date>;
    expect(createdAt.$lte).toEqual(endOfDay(to));
  });

  it("applies both dateFrom and dateTo together", () => {
    const from = new Date("2025-06-15");
    const to = new Date("2025-06-20");
    const result = buildLineupFilter({ dateFrom: from, dateTo: to });
    const createdAt = result.createdAt as Record<string, Date>;
    expect(createdAt.$gte).toEqual(startOfDay(from));
    expect(createdAt.$lte).toEqual(endOfDay(to));
  });

  it("applies minRating as $gte on avgRating", () => {
    const result = buildLineupFilter({ minRating: 5 });
    expect(result.avgRating).toEqual({ $gte: 5 });
  });

  it("applies minRating of 0", () => {
    const result = buildLineupFilter({ minRating: 0 });
    expect(result.avgRating).toEqual({ $gte: 0 });
  });

  it("applies filterUserId as ObjectId on owner", () => {
    const id = new mongoose.Types.ObjectId().toHexString();
    const result = buildLineupFilter({ filterUserId: id });
    expect(result.owner).toBeInstanceOf(mongoose.Types.ObjectId);
    expect((result.owner as mongoose.Types.ObjectId).toHexString()).toBe(id);
  });

  it("combines multiple filters", () => {
    const id = new mongoose.Types.ObjectId().toHexString();
    const result = buildLineupFilter({
      dateFrom: new Date("2025-01-01"),
      minRating: 7,
      filterUserId: id,
    });
    expect(result.createdAt).toBeDefined();
    expect(result.avgRating).toEqual({ $gte: 7 });
    expect(result.owner).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  it("does not overwrite base owner when filterUserId is set", () => {
    const id = new mongoose.Types.ObjectId().toHexString();
    const base = { owner: "original" };
    const result = buildLineupFilter({ filterUserId: id }, base);
    expect((result.owner as mongoose.Types.ObjectId).toHexString()).toBe(id);
  });
});

describe("applyCursor", () => {
  it("returns original filter when cursor is undefined", () => {
    const filter = { owner: "abc" };
    expect(applyCursor(filter, undefined, "newest")).toBe(filter);
  });

  it("returns original filter for rating sorts (offset-based)", () => {
    const filter = { owner: "abc" };
    const cursor = new mongoose.Types.ObjectId().toHexString();
    expect(applyCursor(filter, cursor, "highest-rated")).toBe(filter);
    expect(applyCursor(filter, cursor, "most-rated")).toBe(filter);
  });

  it("applies $lt on _id for newest sort", () => {
    const cursor = new mongoose.Types.ObjectId().toHexString();
    const result = applyCursor({}, cursor, "newest");
    expect(result._id).toBeDefined();
    const idFilter = result._id as { $lt: mongoose.Types.ObjectId };
    expect(idFilter.$lt.toHexString()).toBe(cursor);
  });

  it("applies $gt on _id for oldest sort", () => {
    const cursor = new mongoose.Types.ObjectId().toHexString();
    const result = applyCursor({}, cursor, "oldest");
    expect(result._id).toBeDefined();
    const idFilter = result._id as { $gt: mongoose.Types.ObjectId };
    expect(idFilter.$gt.toHexString()).toBe(cursor);
  });

  it("applies $lt on _id for default (undefined) sort", () => {
    const cursor = new mongoose.Types.ObjectId().toHexString();
    const result = applyCursor({}, cursor, undefined);
    const idFilter = result._id as { $lt: mongoose.Types.ObjectId };
    expect(idFilter.$lt.toHexString()).toBe(cursor);
  });

  it("preserves existing filter fields when adding cursor", () => {
    const cursor = new mongoose.Types.ObjectId().toHexString();
    const result = applyCursor({ owner: "user1" }, cursor, "newest");
    expect(result.owner).toBe("user1");
    expect(result._id).toBeDefined();
  });
});
