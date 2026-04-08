import { getPaginationRange } from "../pagination";

describe("getPaginationRange", () => {
  it("returns all pages when total <= 7", () => {
    expect(getPaginationRange(1, 1)).toEqual([1]);
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("shows ellipsis after start when current is far from page 1", () => {
    const result = getPaginationRange(5, 10);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe("...");
  });

  it("shows ellipsis before end when current is far from last page", () => {
    const result = getPaginationRange(3, 10);
    expect(result[result.length - 1]).toBe(10);
    expect(result[result.length - 2]).toBe("...");
  });

  it("shows both ellipses when current is in the middle", () => {
    const result = getPaginationRange(5, 10);
    expect(result).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });

  it("omits leading ellipsis when current is near start", () => {
    const result = getPaginationRange(2, 10);
    expect(result).toEqual([1, 2, 3, "...", 10]);
  });

  it("omits trailing ellipsis when current is near end", () => {
    const result = getPaginationRange(9, 10);
    expect(result).toEqual([1, "...", 8, 9, 10]);
  });

  it("handles first page of a large set", () => {
    const result = getPaginationRange(1, 20);
    expect(result[0]).toBe(1);
    expect(result).toContain(2);
    expect(result[result.length - 1]).toBe(20);
  });

  it("handles last page of a large set", () => {
    const result = getPaginationRange(20, 20);
    expect(result[0]).toBe(1);
    expect(result[result.length - 1]).toBe(20);
    expect(result).toContain(19);
  });
});
