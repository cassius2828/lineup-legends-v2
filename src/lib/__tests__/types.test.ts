import { getId } from "../types";

describe("getId", () => {
  describe("with null/undefined inputs", () => {
    it("should return empty string for null", () => {
      expect(getId(null)).toBe("");
    });

    it("should return empty string for undefined", () => {
      expect(getId(undefined)).toBe("");
    });
  });

  describe("with id field", () => {
    it("should return the id string when id is present", () => {
      expect(getId({ id: "abc123" })).toBe("abc123");
    });

    it("should prefer id over _id when both are present", () => {
      expect(getId({ id: "id-value", _id: "underscore-id-value" })).toBe(
        "id-value",
      );
    });
  });

  describe("with _id field only", () => {
    it("should return _id when it is a string", () => {
      expect(getId({ _id: "abc123" })).toBe("abc123");
    });

    it("should call toString() on _id when it is an object", () => {
      const objectId = { toString: () => "object-id-string" };
      expect(getId({ _id: objectId })).toBe("object-id-string");
    });
  });

  describe("with empty object", () => {
    it("should return empty string when object has no id or _id", () => {
      expect(getId({})).toBe("");
    });
  });

  describe("with falsy id values", () => {
    it("should return empty string when id is empty string", () => {
      expect(getId({ id: "" })).toBe("");
    });

    it("should fall through to _id when id is empty string", () => {
      expect(getId({ id: "", _id: "fallback" })).toBe("fallback");
    });
  });
});
