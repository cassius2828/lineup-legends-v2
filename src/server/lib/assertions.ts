import { TRPCError } from "@trpc/server";

export function assertOwnership(
  ownerId: string,
  userId: string,
  resourceName = "resource",
): void {
  if (ownerId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You can only modify your own ${resourceName}.`,
    });
  }
}

export function assertFound<T>(
  value: T | null | undefined,
  resourceName = "Resource",
): asserts value is T {
  if (!value) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `${resourceName} not found.`,
    });
  }
}
