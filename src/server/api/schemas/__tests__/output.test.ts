import mongoose from "mongoose";
import {
  playerOutput,
  userSummaryOutput,
  lineupPlayersOutput,
  commentOutput,
  populated,
} from "../output";

describe("mongoId preprocessor (via playerOutput._id)", () => {
  it("passes through a plain string", () => {
    const result = playerOutput.safeParse({
      _id: "abc123",
      firstName: "LeBron",
      lastName: "James",
      imgUrl: "https://example.com/img.png",
      value: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data._id).toBe("abc123");
  });

  it("converts an ObjectId via toHexString", () => {
    const oid = new mongoose.Types.ObjectId();
    const result = playerOutput.safeParse({
      _id: oid,
      firstName: "LeBron",
      lastName: "James",
      imgUrl: "https://example.com/img.png",
      value: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data._id).toBe(oid.toHexString());
  });

  it("coerces a number to string", () => {
    const result = playerOutput.safeParse({
      _id: 42,
      firstName: "LeBron",
      lastName: "James",
      imgUrl: "https://example.com/img.png",
      value: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data._id).toBe("42");
  });
});

describe("playerOutput", () => {
  const validPlayer = {
    _id: "abc",
    firstName: "Stephen",
    lastName: "Curry",
    imgUrl: "https://example.com/img.png",
    value: 4,
  };

  it("accepts a valid player", () => {
    expect(playerOutput.safeParse(validPlayer).success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const { firstName: _, ...noFirst } = validPlayer;
    expect(playerOutput.safeParse(noFirst).success).toBe(false);
  });

  it("allows optional id field", () => {
    const result = playerOutput.safeParse({ ...validPlayer, id: "virt-id" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe("virt-id");
  });

  it("strips unknown fields", () => {
    const result = playerOutput.safeParse({ ...validPlayer, extra: true });
    expect(result.success).toBe(true);
    if (result.success) expect("extra" in result.data).toBe(false);
  });
});

describe("userSummaryOutput", () => {
  it("accepts a valid user summary", () => {
    const result = userSummaryOutput.safeParse({
      _id: "user123",
      name: "Alice",
      username: "alice",
      image: null,
      profileImg: null,
    });
    expect(result.success).toBe(true);
  });

  it("allows nullable/optional username, image, profileImg", () => {
    const result = userSummaryOutput.safeParse({
      _id: "user123",
      name: "Alice",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = userSummaryOutput.safeParse({ _id: "user123" });
    expect(result.success).toBe(false);
  });
});

describe("commentOutput", () => {
  it("accepts a comment with optional image/gif missing", () => {
    const result = commentOutput.safeParse({
      _id: "c1",
      text: "Nice",
      user: { _id: "u1", name: "Bob" },
      totalVotes: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("defaults totalVotes and threadCount to 0 when missing", () => {
    const result = commentOutput.safeParse({
      _id: "c1",
      text: "Nice",
      user: { _id: "u1", name: "Bob" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalVotes).toBe(0);
      expect(result.data.threadCount).toBe(0);
    }
  });
});

describe("lineupPlayersOutput", () => {
  const player = {
    _id: "p1",
    firstName: "A",
    lastName: "B",
    imgUrl: "https://example.com/img.png",
    value: 3,
  };

  it("accepts five valid players", () => {
    const result = lineupPlayersOutput.safeParse({
      pg: player,
      sg: { ...player, _id: "p2" },
      sf: { ...player, _id: "p3" },
      pf: { ...player, _id: "p4" },
      c: { ...player, _id: "p5" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects when a position is missing", () => {
    const result = lineupPlayersOutput.safeParse({
      pg: player,
      sg: player,
      sf: player,
      pf: player,
    });
    expect(result.success).toBe(false);
  });
});

describe("populated helper", () => {
  it("returns the exact same value (identity function)", () => {
    const obj = { a: 1, b: [2, 3] };
    expect(populated(obj)).toBe(obj);
  });

  it("works with null", () => {
    expect(populated(null)).toBeNull();
  });

  it("works with arrays", () => {
    const arr = [1, 2, 3];
    expect(populated(arr)).toBe(arr);
  });
});
