import { TRPCError } from "@trpc/server";
import { assertOwnership, assertFound } from "../assertions";

describe("assertOwnership", () => {
  it("does not throw when IDs match", () => {
    expect(() => assertOwnership("abc", "abc")).not.toThrow();
  });

  it("throws FORBIDDEN when IDs differ", () => {
    expect(() => assertOwnership("abc", "xyz")).toThrow(TRPCError);
    try {
      assertOwnership("abc", "xyz");
    } catch (e) {
      expect((e as TRPCError).code).toBe("FORBIDDEN");
    }
  });

  it("includes custom resource name in error message", () => {
    try {
      assertOwnership("a", "b", "lineup");
    } catch (e) {
      expect((e as TRPCError).message).toContain("lineup");
    }
  });
});

describe("assertFound", () => {
  it("does not throw for truthy values", () => {
    expect(() => assertFound({ id: "1" })).not.toThrow();
    expect(() => assertFound("value")).not.toThrow();
    expect(() => assertFound(1)).not.toThrow();
  });

  it("throws NOT_FOUND for null", () => {
    expect(() => assertFound(null)).toThrow(TRPCError);
    try {
      assertFound(null);
    } catch (e) {
      expect((e as TRPCError).code).toBe("NOT_FOUND");
    }
  });

  it("throws NOT_FOUND for undefined", () => {
    expect(() => assertFound(undefined)).toThrow(TRPCError);
  });

  it("includes custom resource name in error message", () => {
    try {
      assertFound(null, "Player");
    } catch (e) {
      expect((e as TRPCError).message).toContain("Player");
    }
  });
});
