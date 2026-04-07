import { commentBodySchema, threadBodySchema } from "../comment";

describe("commentBodySchema", () => {
  it("accepts valid comment with text only", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "Nice lineup!",
    });
    expect(result.success).toBe(true);
  });

  it("accepts comment with image and no text", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "",
      image: "https://example.com/img.png",
    });
    expect(result.success).toBe(true);
  });

  it("accepts comment with gif and no text", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "",
      gif: "https://example.com/gif.gif",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when no text and no attachment", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only text with no attachment", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects both image and gif", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "hi",
      image: "https://example.com/img.png",
      gif: "https://example.com/gif.gif",
    });
    expect(result.success).toBe(false);
  });

  it("rejects text longer than 1000 characters", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts text of exactly 1000 characters", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "a".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it("requires lineupId", () => {
    const result = commentBodySchema.safeParse({ text: "hello" });
    expect(result.success).toBe(false);
  });
});

describe("threadBodySchema", () => {
  it("accepts a valid thread reply", () => {
    const result = threadBodySchema.safeParse({
      lineupId: "abc",
      commentId: "def",
      text: "I agree!",
    });
    expect(result.success).toBe(true);
  });

  it("requires commentId", () => {
    const result = threadBodySchema.safeParse({
      lineupId: "abc",
      text: "I agree!",
    });
    expect(result.success).toBe(false);
  });

  it("applies the same attachment refinements as comments", () => {
    const result = threadBodySchema.safeParse({
      lineupId: "abc",
      commentId: "def",
      text: "",
    });
    expect(result.success).toBe(false);
  });
});
