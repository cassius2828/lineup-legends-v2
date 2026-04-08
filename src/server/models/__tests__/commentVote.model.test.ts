import mongoose from "mongoose";
import { CommentVoteModel } from "../commentVote";

describe("CommentVoteModel", () => {
  const mockObjectId = () => new mongoose.Types.ObjectId();

  describe("schema validation", () => {
    it("should validate a valid upvote", () => {
      const vote = new CommentVoteModel({
        type: "upvote",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeUndefined();
    });

    it("should validate a valid downvote", () => {
      const vote = new CommentVoteModel({
        type: "downvote",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require type", () => {
      const vote = new CommentVoteModel({
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.type).toBeDefined();
    });

    it("should require user", () => {
      const vote = new CommentVoteModel({
        type: "upvote",
        comment: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.user).toBeDefined();
    });

    it("should require comment", () => {
      const vote = new CommentVoteModel({
        type: "upvote",
        user: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.comment).toBeDefined();
    });

    it("should reject invalid vote types", () => {
      const vote = new CommentVoteModel({
        type: "invalid",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const error = vote.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.type).toBeDefined();
    });

    it("should only accept 'upvote' and 'downvote' as valid types", () => {
      const invalidTypes = ["like", "dislike", "up", "down", "vote", "neutral"];
      for (const type of invalidTypes) {
        const vote = new CommentVoteModel({
          type,
          user: mockObjectId(),
          comment: mockObjectId(),
        });
        const error = vote.validateSync();
        expect(error).toBeDefined();
      }
    });
  });

  describe("default values", () => {
    it("should default createdAt to current date", () => {
      const before = Date.now();
      const vote = new CommentVoteModel({
        type: "upvote",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const after = Date.now();
      expect(vote.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(vote.createdAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual", () => {
      const objectId = new mongoose.Types.ObjectId();
      const vote = new CommentVoteModel({
        _id: objectId,
        type: "upvote",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      expect((vote as unknown as { id: string }).id).toBe(
        objectId.toHexString(),
      );
    });

    it("should include virtuals in toJSON", () => {
      const vote = new CommentVoteModel({
        type: "upvote",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const json = vote.toJSON();
      expect(json).toHaveProperty("id");
    });

    it("should include virtuals in toObject", () => {
      const vote = new CommentVoteModel({
        type: "upvote",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const obj = vote.toObject();
      expect(obj).toHaveProperty("id");
    });
  });
});
