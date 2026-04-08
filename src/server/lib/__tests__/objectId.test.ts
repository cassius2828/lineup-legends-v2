import mongoose from "mongoose";
import { objectIdFromDate } from "../objectId";

describe("objectIdFromDate", () => {
  it("returns a valid ObjectId", () => {
    const result = objectIdFromDate(new Date("2024-01-01T00:00:00Z"));
    expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  it("encodes the timestamp in the first 8 hex chars", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    const expectedHex = Math.floor(date.getTime() / 1000)
      .toString(16)
      .padStart(8, "0");
    const hex = objectIdFromDate(date).toHexString();
    expect(hex.slice(0, 8)).toBe(expectedHex);
  });

  it("pads the remaining 16 chars with zeros", () => {
    const hex = objectIdFromDate(new Date()).toHexString();
    expect(hex.slice(8)).toBe("0000000000000000");
  });

  it("produces different IDs for different dates", () => {
    const a = objectIdFromDate(new Date("2023-06-01T00:00:00Z"));
    const b = objectIdFromDate(new Date("2024-06-01T00:00:00Z"));
    expect(a.toHexString()).not.toBe(b.toHexString());
  });

  it("produces the same ID for the same date", () => {
    const date = new Date("2025-03-15T12:00:00Z");
    const a = objectIdFromDate(date);
    const b = objectIdFromDate(date);
    expect(a.toHexString()).toBe(b.toHexString());
  });
});
