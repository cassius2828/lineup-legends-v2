import mongoose from "mongoose";
import { RequestedPlayerModel } from "../requestedPlayer";

describe("RequestedPlayerModel", () => {
  const mockObjectId = () => new mongoose.Types.ObjectId();

  const validData = () => ({
    firstName: "Kobe",
    lastName: "Bryant",
    descriptions: [],
  });

  describe("schema validation", () => {
    it("should validate a valid requested player", () => {
      const rp = new RequestedPlayerModel(validData());
      const error = rp.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require firstName", () => {
      const rp = new RequestedPlayerModel({
        lastName: "Bryant",
        descriptions: [],
      });
      const error = rp.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.firstName).toBeDefined();
    });

    it("should require lastName", () => {
      const rp = new RequestedPlayerModel({
        firstName: "Kobe",
        descriptions: [],
      });
      const error = rp.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.lastName).toBeDefined();
    });

    it("should accept descriptions with valid data", () => {
      const rp = new RequestedPlayerModel({
        ...validData(),
        descriptions: [
          {
            user: mockObjectId(),
            suggestedValue: 5,
            createdAt: new Date(),
          },
        ],
      });
      const error = rp.validateSync();
      expect(error).toBeUndefined();
    });

    it("should reject suggestedValue below 1", () => {
      const rp = new RequestedPlayerModel({
        ...validData(),
        descriptions: [
          {
            user: mockObjectId(),
            suggestedValue: 0,
            createdAt: new Date(),
          },
        ],
      });
      const error = rp.validateSync();
      expect(error).toBeDefined();
    });

    it("should reject suggestedValue above 5", () => {
      const rp = new RequestedPlayerModel({
        ...validData(),
        descriptions: [
          {
            user: mockObjectId(),
            suggestedValue: 6,
            createdAt: new Date(),
          },
        ],
      });
      const error = rp.validateSync();
      expect(error).toBeDefined();
    });

    it("should accept multiple descriptions", () => {
      const rp = new RequestedPlayerModel({
        ...validData(),
        descriptions: [
          {
            user: mockObjectId(),
            suggestedValue: 5,
            createdAt: new Date(),
          },
          {
            user: mockObjectId(),
            suggestedValue: 4,
            createdAt: new Date(),
          },
          {
            user: mockObjectId(),
            suggestedValue: 3,
            createdAt: new Date(),
          },
        ],
      });
      const error = rp.validateSync();
      expect(error).toBeUndefined();
      expect(rp.descriptions).toHaveLength(3);
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual", () => {
      const objectId = new mongoose.Types.ObjectId();
      const rp = new RequestedPlayerModel({ _id: objectId, ...validData() });
      expect((rp as unknown as { id: string }).id).toBe(objectId.toHexString());
    });

    it("should include virtuals in toJSON", () => {
      const rp = new RequestedPlayerModel(validData());
      const json = rp.toJSON();
      expect(json).toHaveProperty('id');
    });

    it("should include virtuals in toObject", () => {
      const rp = new RequestedPlayerModel(validData());
      const obj = rp.toObject();
      expect(obj).toHaveProperty('id');
    });
  });

  describe("timestamps", () => {
    it("should have timestamps enabled", () => {
      const schema = RequestedPlayerModel.schema;
      expect(schema.options.timestamps).toBe(true);
    });
  });
});
