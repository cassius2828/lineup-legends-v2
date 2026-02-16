import mongoose from "mongoose";
import { CommentModel } from "../comment";

describe("CommentModel", () => {
  const mockObjectId = () => new mongoose.Types.ObjectId();

  describe("schema validation", () => {
    it("should validate a valid comment", () => {
      const comment = new CommentModel({
        text: "Great lineup!",
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const error = comment.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require text", () => {
      const comment = new CommentModel({
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const error = comment.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.text).toBeDefined();
    });

    it("should require user", () => {
      const comment = new CommentModel({
        text: "Great lineup!",
        lineup: mockObjectId(),
      });
      const error = comment.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.user).toBeDefined();
    });

    it("should require lineup", () => {
      const comment = new CommentModel({
        text: "Great lineup!",
        user: mockObjectId(),
      });
      const error = comment.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.lineup).toBeDefined();
    });
  });

  describe("default values", () => {
    it("should default totalVotes to 0", () => {
      const comment = new CommentModel({
        text: "Great lineup!",
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      expect(comment.totalVotes).toBe(0);
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual", () => {
      const objectId = new mongoose.Types.ObjectId();
      const comment = new CommentModel({
        _id: objectId,
        text: "Great lineup!",
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      expect((comment as unknown as { id: string }).id).toBe(objectId.toHexString());
    });

    it("should include virtuals in toJSON", () => {
      const comment = new CommentModel({
        text: "Great lineup!",
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const json = comment.toJSON();
      expect(json).toHaveProperty('id');
    });

    it("should include virtuals in toObject", () => {
      const comment = new CommentModel({
        text: "Great lineup!",
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const obj = comment.toObject();
      expect(obj).toHaveProperty('id');
    });
  });

  describe("timestamps", () => {
    it("should have timestamps enabled", () => {
      const schema = CommentModel.schema;
      expect(schema.options.timestamps).toBe(true);
    });
  });
});
