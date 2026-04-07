import mongoose from "mongoose";
import { ThreadModel } from "../threads";

describe("ThreadModel", () => {
  const mockObjectId = () => new mongoose.Types.ObjectId();

  describe("schema validation", () => {
    it("should validate a valid thread reply", () => {
      const thread = new ThreadModel({
        text: "I agree with this!",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const error = thread.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require text", () => {
      const thread = new ThreadModel({
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const error = thread.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.text).toBeDefined();
    });

    it("should require user", () => {
      const thread = new ThreadModel({
        text: "I agree with this!",
        comment: mockObjectId(),
      });
      const error = thread.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.user).toBeDefined();
    });

    it("should require comment", () => {
      const thread = new ThreadModel({
        text: "I agree with this!",
        user: mockObjectId(),
      });
      const error = thread.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.comment).toBeDefined();
    });
  });

  describe("default values", () => {
    it("should default totalVotes to 0", () => {
      const thread = new ThreadModel({
        text: "I agree!",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      expect(thread.totalVotes).toBe(0);
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual", () => {
      const objectId = new mongoose.Types.ObjectId();
      const thread = new ThreadModel({
        _id: objectId,
        text: "I agree!",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      expect((thread as unknown as { id: string }).id).toBe(objectId.toHexString());
    });

    it("should include virtuals in toJSON", () => {
      const thread = new ThreadModel({
        text: "I agree!",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const json = thread.toJSON();
      expect(json).toHaveProperty('id');
    });

    it("should include virtuals in toObject", () => {
      const thread = new ThreadModel({
        text: "I agree!",
        user: mockObjectId(),
        comment: mockObjectId(),
      });
      const obj = thread.toObject();
      expect(obj).toHaveProperty('id');
    });
  });

  describe("timestamps", () => {
    it("should have timestamps enabled", () => {
      const schema = ThreadModel.schema;
      expect(schema.options.timestamps).toBeTruthy();
    });
  });
});
