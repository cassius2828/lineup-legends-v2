import mongoose from "mongoose";
import { UserModel } from "../user";

describe("UserModel", () => {
  describe("schema validation", () => {
    it("should validate a valid user with required fields", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it("should require name", () => {
      const user = new UserModel({
        email: "john@example.com",
      });
      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.name).toBeDefined();
    });

    it("should require email", () => {
      const user = new UserModel({
        name: "John Doe",
      });
      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.email).toBeDefined();
    });

    it("should validate with all optional fields populated", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe",
        password: "hashed_password",
        bio: "Basketball fan",
        image: "https://example.com/avatar.png",
        profileImg: "https://example.com/profile.png",
        bannerImg: "https://example.com/banner.png",
        socialMedia: {
          twitter: "johndoe",
          instagram: "johndoe",
          facebook: "johndoe",
        },
        admin: true,
      });
      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it("should reject bio longer than 250 characters", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
        bio: "a".repeat(251),
      });
      const error = user.validateSync();
      expect(error).toBeDefined();
      expect(error!.errors.bio).toBeDefined();
    });

    it("should accept bio of exactly 250 characters", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
        bio: "a".repeat(250),
      });
      const error = user.validateSync();
      expect(error).toBeUndefined();
    });
  });

  describe("default values", () => {
    it("should default password to null", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(user.password).toBeNull();
    });

    it("should default followerCount to 0", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(user.followerCount).toBe(0);
    });

    it("should default followingCount to 0", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(user.followingCount).toBe(0);
    });

    it("should default admin to false", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(user.admin).toBe(false);
    });

    it("should default image to null", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(user.image).toBeNull();
    });

    it("should default bio to null", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(user.bio).toBeNull();
    });

    it("should default profileImg to null", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(user.profileImg).toBeNull();
    });

    it("should default bannerImg to null", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(user.bannerImg).toBeNull();
    });

    it("should default emailVerified to null", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(user.emailVerified).toBeNull();
    });
  });

  describe("virtuals", () => {
    it("should have an id virtual that returns hex string", () => {
      const objectId = new mongoose.Types.ObjectId();
      const user = new UserModel({
        _id: objectId,
        name: "John Doe",
        email: "john@example.com",
      });
      expect((user as unknown as { id: string }).id).toBe(
        objectId.toHexString(),
      );
    });

    it("should include virtuals in toJSON output", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      const json = user.toJSON();
      expect(json).toHaveProperty("id");
    });

    it("should include virtuals in toObject output", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      const obj = user.toObject();
      expect(obj).toHaveProperty("id");
    });
  });

  describe("socialMedia subdocument", () => {
    it("should accept valid social media fields", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
        socialMedia: {
          twitter: "@johndoe",
          instagram: "johndoe",
          facebook: "john.doe",
        },
      });
      const error = user.validateSync();
      expect(error).toBeUndefined();
      expect(user.socialMedia?.twitter).toBe("@johndoe");
      expect(user.socialMedia?.instagram).toBe("johndoe");
      expect(user.socialMedia?.facebook).toBe("john.doe");
    });

    it("should allow partial social media (only some fields)", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
        socialMedia: {
          twitter: "@johndoe",
        },
      });
      const error = user.validateSync();
      expect(error).toBeUndefined();
    });

    it("should default socialMedia to null", () => {
      const user = new UserModel({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(user.socialMedia).toBeNull();
    });
  });
});
