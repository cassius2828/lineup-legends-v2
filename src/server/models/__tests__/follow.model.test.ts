import mongoose from "mongoose";
import { FollowModel } from "../follow";

describe("FollowModel", () => {
  const mockObjectId = () => new mongoose.Types.ObjectId();

  describe("schema validation", () => {
    it("should validate a valid follow relationship", () => {
      const follow = new FollowModel({
        follower: mockObjectId(),
        following: mockObjectId(),
      });
      const error = follow.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require follower", () => {
      const follow = new FollowModel({
        following: mockObjectId(),
      });
      const error = follow.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.follower).toBeDefined();
    });

    it("should require following", () => {
      const follow = new FollowModel({
        follower: mockObjectId(),
      });
      const error = follow.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.following).toBeDefined();
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual", () => {
      const objectId = new mongoose.Types.ObjectId();
      const follow = new FollowModel({
        _id: objectId,
        follower: mockObjectId(),
        following: mockObjectId(),
      });
      expect((follow as unknown as { id: string }).id).toBe(objectId.toHexString());
    });

    it("should include virtuals in toJSON", () => {
      const follow = new FollowModel({
        follower: mockObjectId(),
        following: mockObjectId(),
      });
      const json = follow.toJSON();
      expect(json).toHaveProperty('id');
    });

    it("should include virtuals in toObject", () => {
      const follow = new FollowModel({
        follower: mockObjectId(),
        following: mockObjectId(),
      });
      const obj = follow.toObject();
      expect(obj).toHaveProperty('id');
    });
  });

  describe("timestamps", () => {
    it("should have timestamps enabled", () => {
      const schema = FollowModel.schema;
      expect(schema.options.timestamps).toBe(true);
    });
  });
});
