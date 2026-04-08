import mongoose from "mongoose";
import { PlayerModel } from "../player";

describe("PlayerModel", () => {
  describe("schema validation", () => {
    it("should validate a valid player", () => {
      const player = new PlayerModel({
        firstName: "LeBron",
        lastName: "James",
        imgUrl: "https://example.com/lebron.png",
        value: 5,
      });
      const error = player.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require firstName", () => {
      const player = new PlayerModel({
        lastName: "James",
        imgUrl: "https://example.com/lebron.png",
        value: 5,
      });
      const error = player.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.firstName).toBeDefined();
    });

    it("should require lastName", () => {
      const player = new PlayerModel({
        firstName: "LeBron",
        imgUrl: "https://example.com/lebron.png",
        value: 5,
      });
      const error = player.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.lastName).toBeDefined();
    });

    it("should require imgUrl", () => {
      const player = new PlayerModel({
        firstName: "LeBron",
        lastName: "James",
        value: 5,
      });
      const error = player.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.imgUrl).toBeDefined();
    });

    it("should require value", () => {
      const player = new PlayerModel({
        firstName: "LeBron",
        lastName: "James",
        imgUrl: "https://example.com/lebron.png",
      });
      const error = player.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.value).toBeDefined();
    });

    it("should reject value below 1", () => {
      const player = new PlayerModel({
        firstName: "LeBron",
        lastName: "James",
        imgUrl: "https://example.com/lebron.png",
        value: 0,
      });
      const error = player.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.value).toBeDefined();
    });

    it("should reject value above 5", () => {
      const player = new PlayerModel({
        firstName: "LeBron",
        lastName: "James",
        imgUrl: "https://example.com/lebron.png",
        value: 6,
      });
      const error = player.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.value).toBeDefined();
    });

    it("should accept value of 1 (minimum)", () => {
      const player = new PlayerModel({
        firstName: "Bench",
        lastName: "Player",
        imgUrl: "https://example.com/player.png",
        value: 1,
      });
      const error = player.validateSync();
      expect(error).toBeUndefined();
    });

    it("should accept value of 5 (maximum)", () => {
      const player = new PlayerModel({
        firstName: "Star",
        lastName: "Player",
        imgUrl: "https://example.com/player.png",
        value: 5,
      });
      const error = player.validateSync();
      expect(error).toBeUndefined();
    });

    it("should accept all valid values (1-5)", () => {
      for (let v = 1; v <= 5; v++) {
        const player = new PlayerModel({
          firstName: "Test",
          lastName: "Player",
          imgUrl: "https://example.com/player.png",
          value: v,
        });
        const error = player.validateSync();
        expect(error).toBeUndefined();
      }
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual that returns the hex string of _id", () => {
      const objectId = new mongoose.Types.ObjectId();
      const player = new PlayerModel({
        _id: objectId,
        firstName: "LeBron",
        lastName: "James",
        imgUrl: "https://example.com/lebron.png",
        value: 5,
      });
      expect((player as unknown as { id: string }).id).toBe(
        objectId.toHexString(),
      );
    });

    it("should include virtuals in toJSON output", () => {
      const player = new PlayerModel({
        firstName: "LeBron",
        lastName: "James",
        imgUrl: "https://example.com/lebron.png",
        value: 5,
      });
      const json = player.toJSON();
      expect(json).toHaveProperty("id");
    });

    it("should include virtuals in toObject output", () => {
      const player = new PlayerModel({
        firstName: "LeBron",
        lastName: "James",
        imgUrl: "https://example.com/lebron.png",
        value: 5,
      });
      const obj = player.toObject();
      expect(obj).toHaveProperty("id");
    });
  });
});
