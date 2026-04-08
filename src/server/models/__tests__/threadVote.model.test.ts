import mongoose from "mongoose";
import { ThreadVoteModel } from "../threadVotes";

describe("ThreadVoteModel", () => {
  const mockObjectId = () => new mongoose.Types.ObjectId();

  describe("schema validation", () => {
    it("should validate a valid upvote", () => {
      const vote = new ThreadVoteModel({
        type: "upvote",
        user: mockObjectId(),
        thread: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeUndefined();
    });

    it("should validate a valid downvote", () => {
      const vote = new ThreadVoteModel({
        type: "downvote",
        user: mockObjectId(),
        thread: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require type", () => {
      const vote = new ThreadVoteModel({
        user: mockObjectId(),
        thread: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.type).toBeDefined();
    });

    it("should require user", () => {
      const vote = new ThreadVoteModel({
        type: "upvote",
        thread: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.user).toBeDefined();
    });

    it("should require thread", () => {
      const vote = new ThreadVoteModel({
        type: "upvote",
        user: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.thread).toBeDefined();
    });

    it("should reject invalid vote types", () => {
      const vote = new ThreadVoteModel({
        type: "invalid",
        user: mockObjectId(),
        thread: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.type).toBeDefined();
    });

    it("should only accept 'upvote' and 'downvote'", () => {
      const invalidTypes = ["like", "dislike", "neutral", "up", "down"];
      for (const type of invalidTypes) {
        const vote = new ThreadVoteModel({
          type,
          user: mockObjectId(),
          thread: mockObjectId(),
        });
        const error = vote.validateSync();
        expect(error).toBeDefined();
      }
    });
  });

  describe("default values", () => {
    it("should default createdAt to current date", () => {
      const before = Date.now();
      const vote = new ThreadVoteModel({
        type: "upvote",
        user: mockObjectId(),
        thread: mockObjectId(),
      });
      const after = Date.now();
      expect(vote.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(vote.createdAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual", () => {
      const objectId = new mongoose.Types.ObjectId();
      const vote = new ThreadVoteModel({
        _id: objectId,
        type: "upvote",
        user: mockObjectId(),
        thread: mockObjectId(),
      });
      expect((vote as unknown as { id: string }).id).toBe(
        objectId.toHexString(),
      );
    });

    it("should include virtuals in toJSON", () => {
      const vote = new ThreadVoteModel({
        type: "upvote",
        user: mockObjectId(),
        thread: mockObjectId(),
      });
      const json = vote.toJSON();
      expect(json).toHaveProperty("id");
    });

    it("should include virtuals in toObject", () => {
      const vote = new ThreadVoteModel({
        type: "upvote",
        user: mockObjectId(),
        thread: mockObjectId(),
      });
      const obj = vote.toObject();
      expect(obj).toHaveProperty("id");
    });
  });
});
