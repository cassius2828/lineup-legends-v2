import { commentBodySchema, threadBodySchema } from "../comment";

const VALID_IMAGE = "https://d1234abcd.cloudfront.net/uploads/img.png";
const VALID_GIF = "https://media.giphy.com/media/abc123/giphy.gif";

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
      image: VALID_IMAGE,
    });
    expect(result.success).toBe(true);
  });

  it("accepts comment with gif and no text", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "",
      gif: VALID_GIF,
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
      image: VALID_IMAGE,
      gif: VALID_GIF,
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

describe("commentBodySchema — URL domain validation", () => {
  it("rejects image from untrusted domain", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "hi",
      image: "https://evil.com/hack.png",
    });
    expect(result.success).toBe(false);
  });

  it("rejects gif from untrusted domain", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "hi",
      gif: "https://evil.com/hack.gif",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-https image URL", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "hi",
      image: "http://d1234abcd.cloudfront.net/img.png",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-https gif URL", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "hi",
      gif: "http://media.giphy.com/media/abc/giphy.gif",
    });
    expect(result.success).toBe(false);
  });

  it("accepts gif from numbered giphy CDN subdomain", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "",
      gif: "https://media4.giphy.com/media/abc123/giphy.gif",
    });
    expect(result.success).toBe(true);
  });

  it("accepts gif from i.giphy.com", () => {
    const result = commentBodySchema.safeParse({
      lineupId: "abc",
      text: "",
      gif: "https://i.giphy.com/media/abc123/200.gif",
    });
    expect(result.success).toBe(true);
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

  it("rejects thread reply with untrusted gif domain", () => {
    const result = threadBodySchema.safeParse({
      lineupId: "abc",
      commentId: "def",
      text: "hi",
      gif: "https://evil.com/hack.gif",
    });
    expect(result.success).toBe(false);
  });

  it("accepts thread reply with valid gif", () => {
    const result = threadBodySchema.safeParse({
      lineupId: "abc",
      commentId: "def",
      text: "",
      gif: VALID_GIF,
    });
    expect(result.success).toBe(true);
  });
});
