import mongoose from "mongoose";
import { RatingModel } from "../rating";

describe("RatingModel", () => {
  const mockObjectId = () => new mongoose.Types.ObjectId();

  describe("schema validation", () => {
    it("should validate a valid rating", () => {
      const rating = new RatingModel({
        value: 8,
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const error = rating.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require value", () => {
      const rating = new RatingModel({
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const error = rating.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.value).toBeDefined();
    });

    it("should require user", () => {
      const rating = new RatingModel({
        value: 8,
        lineup: mockObjectId(),
      });
      const error = rating.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.user).toBeDefined();
    });

    it("should require lineup", () => {
      const rating = new RatingModel({
        value: 8,
        user: mockObjectId(),
      });
      const error = rating.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.lineup).toBeDefined();
    });

    it("should reject value below 1", () => {
      const rating = new RatingModel({
        value: 0,
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const error = rating.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.value).toBeDefined();
    });

    it("should reject value above 10", () => {
      const rating = new RatingModel({
        value: 11,
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const error = rating.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.value).toBeDefined();
    });

    it("should accept minimum value of 1", () => {
      const rating = new RatingModel({
        value: 1,
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const error = rating.validateSync();
      expect(error).toBeUndefined();
    });

    it("should accept maximum value of 10", () => {
      const rating = new RatingModel({
        value: 10,
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const error = rating.validateSync();
      expect(error).toBeUndefined();
    });

    it("should accept all valid values (1-10)", () => {
      for (let v = 1; v <= 10; v++) {
        const rating = new RatingModel({
          value: v,
          user: mockObjectId(),
          lineup: mockObjectId(),
        });
        const error = rating.validateSync();
        expect(error).toBeUndefined();
      }
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual", () => {
      const objectId = new mongoose.Types.ObjectId();
      const rating = new RatingModel({
        _id: objectId,
        value: 8,
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      expect((rating as unknown as { id: string }).id).toBe(
        objectId.toHexString(),
      );
    });

    it("should include virtuals in toJSON", () => {
      const rating = new RatingModel({
        value: 8,
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const json = rating.toJSON();
      expect(json).toHaveProperty("id");
    });

    it("should include virtuals in toObject", () => {
      const rating = new RatingModel({
        value: 8,
        user: mockObjectId(),
        lineup: mockObjectId(),
      });
      const obj = rating.toObject();
      expect(obj).toHaveProperty("id");
    });
  });

  describe("timestamps", () => {
    it("should have timestamps enabled", () => {
      const schema = RatingModel.schema;
      expect(schema.options.timestamps).toBe(true);
    });
  });
});
