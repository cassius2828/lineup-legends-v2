import { TRPCError } from "@trpc/server";
import { UserModel } from "~/server/models";

/** Load user by id or throw NOT_FOUND (for protected tRPC procedures). */
export async function requireUserById(userId: string, select: string) {
  const user = await UserModel.findById(userId).select(select).lean();
  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }
  return user;
}
