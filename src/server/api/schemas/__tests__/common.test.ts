import { voteTypeSchema } from "../common";

describe("voteTypeSchema", () => {
  it("accepts 'upvote'", () => {
    expect(voteTypeSchema.safeParse("upvote").success).toBe(true);
  });

  it("accepts 'downvote'", () => {
    expect(voteTypeSchema.safeParse("downvote").success).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(voteTypeSchema.safeParse("like").success).toBe(false);
    expect(voteTypeSchema.safeParse("").success).toBe(false);
    expect(voteTypeSchema.safeParse(1).success).toBe(false);
    expect(voteTypeSchema.safeParse(null).success).toBe(false);
  });
});
