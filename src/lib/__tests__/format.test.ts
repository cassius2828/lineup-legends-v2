import { getDisplayName, pluralize } from "../format";

describe("getDisplayName", () => {
  it("returns name when present", () => {
    expect(getDisplayName({ name: "Alice", username: "alice99" })).toBe("Alice");
  });

  it("falls back to username when name is null", () => {
    expect(getDisplayName({ name: null, username: "alice99" })).toBe("alice99");
  });

  it("falls back to username when name is undefined", () => {
    expect(getDisplayName({ username: "bob" })).toBe("bob");
  });

  it("returns Anonymous when both are null", () => {
    expect(getDisplayName({ name: null, username: null })).toBe("Anonymous");
  });

  it("returns Anonymous when both are undefined", () => {
    expect(getDisplayName({})).toBe("Anonymous");
  });
});

describe("pluralize", () => {
  it("returns singular for count of 1", () => {
    expect(pluralize(1, "lineup")).toBe("lineup");
  });

  it("appends s for count of 0", () => {
    expect(pluralize(0, "lineup")).toBe("lineups");
  });

  it("appends s for count > 1", () => {
    expect(pluralize(5, "player")).toBe("players");
  });

  it("uses custom plural when provided", () => {
    expect(pluralize(2, "person", "people")).toBe("people");
  });

  it("uses singular with custom plural when count is 1", () => {
    expect(pluralize(1, "person", "people")).toBe("person");
  });
});
