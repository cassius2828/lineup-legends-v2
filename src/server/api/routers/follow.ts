import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { FollowModel, UserModel } from "~/server/models";

export const followRouter = createTRPCRouter({
  toggleFollow: protectedProcedure
    .input(z.object({ targetUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;
      const { targetUserId } = input;

      if (currentUserId === targetUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot follow yourself.",
        });
      }

      const targetUser = await UserModel.findById(targetUserId)
        .select("_id")
        .lean();
      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      const existingFollow = await FollowModel.findOne({
        follower: currentUserId,
        following: targetUserId,
      }).lean();

      if (existingFollow) {
        await FollowModel.deleteOne({ _id: existingFollow._id });

        await Promise.all([
          UserModel.findByIdAndUpdate(currentUserId, {
            $inc: { followingCount: -1 },
          }),
          UserModel.findByIdAndUpdate(targetUserId, {
            $inc: { followerCount: -1 },
          }),
        ]);

        return { following: false };
      }

      await FollowModel.create({
        follower: currentUserId,
        following: targetUserId,
      });

      await Promise.all([
        UserModel.findByIdAndUpdate(currentUserId, {
          $inc: { followingCount: 1 },
        }),
        UserModel.findByIdAndUpdate(targetUserId, {
          $inc: { followerCount: 1 },
        }),
      ]);

      return { following: true };
    }),

  isFollowing: protectedProcedure
    .input(z.object({ targetUserId: z.string() }))
    .query(async ({ ctx, input }) => {
      const existing = await FollowModel.findOne({
        follower: ctx.session.user.id,
        following: input.targetUserId,
      }).lean();

      return { following: !!existing };
    }),

  getFollowers: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      const query: Record<string, unknown> = {
        following: input.userId,
      };

      if (input.cursor) {
        query._id = { $lt: input.cursor };
      }

      const follows = await FollowModel.find(query)
        .sort({ createdAt: -1 })
        .limit(input.limit + 1)
        .populate("follower", "name username profileImg image followerCount")
        .lean();

      const hasMore = follows.length > input.limit;
      const items = hasMore ? follows.slice(0, input.limit) : follows;

      return {
        items: items.map((f) => ({
          id: f._id.toString(),
          user: f.follower,
          createdAt: f.createdAt,
        })),
        nextCursor: hasMore
          ? items[items.length - 1]?._id.toString()
          : undefined,
      };
    }),

  getFollowing: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      const query: Record<string, unknown> = {
        follower: input.userId,
      };

      if (input.cursor) {
        query._id = { $lt: input.cursor };
      }

      const follows = await FollowModel.find(query)
        .sort({ createdAt: -1 })
        .limit(input.limit + 1)
        .populate("following", "name username profileImg image followerCount")
        .lean();

      const hasMore = follows.length > input.limit;
      const items = hasMore ? follows.slice(0, input.limit) : follows;

      return {
        items: items.map((f) => ({
          id: f._id.toString(),
          user: f.following,
          createdAt: f.createdAt,
        })),
        nextCursor: hasMore
          ? items[items.length - 1]?._id.toString()
          : undefined,
      };
    }),

  searchUsers: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(30).default(20),
      }),
    )
    .query(async ({ input }) => {
      const searchRegex = new RegExp(input.query, "i");

      const users = await UserModel.find({
        $or: [{ name: searchRegex }, { username: searchRegex }],
      })
        .select("name username profileImg image bio followerCount")
        .limit(input.limit)
        .lean();

      return users.map((u) => ({
        ...u,
        id: u._id.toString(),
      }));
    }),
});
