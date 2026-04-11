import { z } from "zod";
import { TRPCError } from "@trpc/server";
import mongoose from "mongoose";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
  UserModel,
  PlayerModel,
  LineupModel,
  RatingModel,
  CommentModel,
  FeedbackModel,
  RequestedPlayerModel,
  FollowModel,
  ContentFlagModel,
  BannedEmailModel,
} from "~/server/models";
import { redis } from "~/server/redis";
import { objectIdFromDate } from "~/server/lib/objectId";
import {
  adminStatsOutput,
  adminFlaggedContentOutput,
  adminReviewFlagOutput,
  adminUsersOutput,
  adminUserDetailOutput,
  adminBanUserOutput,
  adminUnbanUserOutput,
  populated,
} from "~/server/api/schemas/output";
import { escapeRegex } from "~/server/lib/escape-regex";

export const adminRouter = createTRPCRouter({
  getStats: adminProcedure.output(adminStatsOutput).query(async () => {
    const cachedStats = await redis.get("admin:stats");
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sevenDayObjectId = objectIdFromDate(sevenDaysAgo);
    const thirtyDayObjectId = objectIdFromDate(thirtyDaysAgo);

    const [
      totalUsers,
      newUsersWeek,
      newUsersMonth,
      totalLineups,
      totalPlayers,
      totalRatings,
      totalComments,
      totalFollows,
      pendingFeedback,
      totalFeedback,
      totalRequestedPlayers,
      pendingFlags,
      recentUsers,
      recentFeedback,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ _id: { $gte: sevenDayObjectId } }),
      UserModel.countDocuments({ _id: { $gte: thirtyDayObjectId } }),
      LineupModel.countDocuments(),
      PlayerModel.countDocuments(),
      RatingModel.countDocuments(),
      CommentModel.countDocuments(),
      FollowModel.countDocuments(),
      FeedbackModel.countDocuments({ status: "new" }),
      FeedbackModel.countDocuments(),
      RequestedPlayerModel.countDocuments(),
      ContentFlagModel.countDocuments({ status: "pending" }),
      UserModel.find()
        .sort({ _id: -1 })
        .limit(5)
        .select("name email image username")
        .lean(),
      FeedbackModel.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    return populated({
      totalUsers,
      newUsersWeek,
      newUsersMonth,
      totalLineups,
      totalPlayers,
      totalRatings,
      totalComments,
      totalFollows,
      pendingFeedback,
      totalFeedback,
      totalRequestedPlayers,
      pendingFlags,
      recentUsers: recentUsers.map((u) => ({
        id: u._id.toHexString(),
        name: u.name,
        email: u.email,
        image: u.image ?? null,
        username: u.username ?? null,
        createdAt: u._id.getTimestamp(),
      })),
      recentFeedback: recentFeedback.map((f) => ({
        id: f._id.toHexString(),
        name: f.name,
        email: f.email,
        subject: f.subject,
        message: f.message,
        status: f.status,
        createdAt: f.createdAt,
      })),
    });
  }),

  getFlaggedContent: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "reviewed", "dismissed"]).default("pending"),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .output(adminFlaggedContentOutput)
    .query(async ({ input }) => {
      const query: Record<string, unknown> = { status: input.status };
      if (input.cursor) {
        query._id = { $lt: new mongoose.Types.ObjectId(input.cursor) };
      }

      const flags = await ContentFlagModel.find(query)
        .sort({ createdAt: -1 })
        .limit(input.limit + 1)
        .populate("userId", "name username email image profileImg")
        .populate("reviewedBy", "name")
        .lean();

      const hasMore = flags.length > input.limit;
      const items = hasMore ? flags.slice(0, input.limit) : flags;

      return {
        items: items.map((f) => ({
          id: f._id.toHexString(),
          contentType: f.contentType,
          contentId: f.contentId?.toHexString() ?? null,
          user: f.userId
            ? {
                id: (
                  f.userId as unknown as { _id: mongoose.Types.ObjectId }
                )._id.toHexString(),
                name: (f.userId as unknown as { name: string }).name,
                username:
                  (f.userId as unknown as { username?: string }).username ??
                  null,
                email: (f.userId as unknown as { email: string }).email,
                image:
                  (f.userId as unknown as { image?: string }).image ?? null,
                profileImg:
                  (f.userId as unknown as { profileImg?: string }).profileImg ??
                  null,
              }
            : null,
          originalText: f.originalText,
          censoredText: f.censoredText,
          flaggedWords: f.flaggedWords,
          status: f.status,
          action: f.action,
          reviewedBy: f.reviewedBy
            ? (f.reviewedBy as unknown as { name: string }).name
            : null,
          reviewedAt: f.reviewedAt,
          createdAt: f.createdAt,
        })),
        nextCursor: hasMore
          ? items[items.length - 1]?._id.toHexString()
          : undefined,
      };
    }),

  reviewFlag: adminProcedure
    .input(
      z.object({
        flagId: z.string(),
        action: z.enum(["dismiss", "warn", "suspend", "ban"]),
        reason: z.string().max(500).optional(),
        suspendDays: z.number().min(1).max(365).optional(),
      }),
    )
    .output(adminReviewFlagOutput)
    .mutation(async ({ ctx, input }) => {
      const flag = await ContentFlagModel.findById(input.flagId);
      if (!flag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Flag not found" });
      }

      flag.status = input.action === "dismiss" ? "dismissed" : "reviewed";
      flag.action = input.action === "dismiss" ? "none" : input.action;
      flag.reviewedBy = new mongoose.Types.ObjectId(ctx.session.user.id);
      flag.reviewedAt = new Date();
      await flag.save();

      if (input.action === "suspend" && flag.userId) {
        const suspendUntil = new Date();
        suspendUntil.setDate(suspendUntil.getDate() + (input.suspendDays ?? 7));
        await UserModel.updateOne(
          { _id: flag.userId },
          {
            suspendedUntil: suspendUntil,
            banReason: input.reason ?? "Content policy violation",
            $inc: { suspensionCount: 1 },
          },
        );
      }

      if (input.action === "ban" && flag.userId) {
        const user = await UserModel.findById(flag.userId)
          .select("email")
          .lean();
        await UserModel.updateOne(
          { _id: flag.userId },
          {
            banned: true,
            bannedAt: new Date(),
            banReason: input.reason ?? "Content policy violation",
          },
        );
        if (user?.email) {
          await BannedEmailModel.findOneAndUpdate(
            { email: user.email },
            {
              email: user.email,
              bannedBy: new mongoose.Types.ObjectId(ctx.session.user.id),
              reason: input.reason ?? "Content policy violation",
            },
            { upsert: true },
          );
        }
      }

      return { success: true };
    }),

  getUsers: adminProcedure
    .input(
      z.object({
        query: z.string().max(100).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        filter: z.enum(["all", "banned", "suspended"]).default("all"),
      }),
    )
    .output(adminUsersOutput)
    .query(async ({ input }) => {
      const match: Record<string, unknown> = {};

      if (input.query && input.query.trim().length > 0) {
        const regex = new RegExp(escapeRegex(input.query.trim()), "i");
        match.$or = [{ name: regex }, { username: regex }, { email: regex }];
      }

      if (input.filter === "banned") {
        match.banned = true;
      } else if (input.filter === "suspended") {
        match.suspendedUntil = { $gt: new Date() };
      }

      if (input.cursor) {
        match._id = { $lt: new mongoose.Types.ObjectId(input.cursor) };
      }

      const users = await UserModel.find(match)
        .sort({ _id: -1 })
        .limit(input.limit + 1)
        .select(
          "name username email image profileImg banned bannedAt banReason suspendedUntil admin",
        )
        .lean();

      const hasMore = users.length > input.limit;
      const items = hasMore ? users.slice(0, input.limit) : users;

      return {
        items: items.map((u) => ({
          id: u._id.toHexString(),
          name: u.name,
          username: u.username ?? null,
          email: u.email,
          image: u.image ?? null,
          profileImg: u.profileImg ?? null,
          banned: u.banned ?? false,
          bannedAt: u.bannedAt ?? null,
          banReason: u.banReason ?? null,
          suspendedUntil: u.suspendedUntil ?? null,
          admin: u.admin ?? false,
          createdAt: u._id.getTimestamp(),
        })),
        nextCursor: hasMore
          ? items[items.length - 1]?._id.toHexString()
          : undefined,
      };
    }),

  getUserDetail: adminProcedure
    .input(z.object({ userId: z.string() }))
    .output(adminUserDetailOutput)
    .query(async ({ input }) => {
      const user = await UserModel.findById(input.userId)
        .select(
          "name username email image profileImg bio banned bannedAt banReason suspendedUntil suspensionCount admin registrationIp lastLoginIp followerCount followingCount",
        )
        .lean();

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const [recentComments, flagCount] = await Promise.all([
        CommentModel.find({ user: user._id })
          .sort({ createdAt: -1 })
          .limit(10)
          .select("text createdAt lineup")
          .lean(),
        ContentFlagModel.countDocuments({ userId: user._id }),
      ]);

      return {
        id: user._id.toHexString(),
        name: user.name,
        username: user.username ?? null,
        email: user.email,
        image: user.image ?? null,
        profileImg: user.profileImg ?? null,
        bio: user.bio ?? null,
        banned: user.banned ?? false,
        bannedAt: user.bannedAt ?? null,
        banReason: user.banReason ?? null,
        suspendedUntil: user.suspendedUntil ?? null,
        suspensionCount: user.suspensionCount ?? 0,
        admin: user.admin ?? false,
        registrationIp: user.registrationIp ?? null,
        lastLoginIp: user.lastLoginIp ?? null,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        createdAt: user._id.getTimestamp(),
        flagCount,
        recentComments: recentComments.map((c) => ({
          id: c._id.toHexString(),
          text: c.text ?? "",
          createdAt: c.createdAt,
          lineupId: c.lineup.toHexString(),
        })),
      };
    }),

  banUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().min(1).max(500),
        suspendDays: z.number().min(1).max(365).optional(),
      }),
    )
    .output(adminBanUserOutput)
    .mutation(async ({ ctx, input }) => {
      const user = await UserModel.findById(input.userId)
        .select("email admin")
        .lean();

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      if (user.admin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot ban an admin user",
        });
      }

      if (input.suspendDays) {
        const suspendUntil = new Date();
        suspendUntil.setDate(suspendUntil.getDate() + input.suspendDays);
        await UserModel.updateOne(
          { _id: user._id },
          {
            suspendedUntil: suspendUntil,
            banReason: input.reason,
            $inc: { suspensionCount: 1 },
          },
        );
      } else {
        await UserModel.updateOne(
          { _id: user._id },
          {
            banned: true,
            bannedAt: new Date(),
            banReason: input.reason,
          },
        );
        await BannedEmailModel.findOneAndUpdate(
          { email: user.email },
          {
            email: user.email,
            bannedBy: new mongoose.Types.ObjectId(ctx.session.user.id),
            reason: input.reason,
          },
          { upsert: true },
        );
      }

      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .output(adminUnbanUserOutput)
    .mutation(async ({ input }) => {
      const user = await UserModel.findById(input.userId)
        .select("email")
        .lean();

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      await UserModel.updateOne(
        { _id: user._id },
        {
          banned: false,
          bannedAt: null,
          banReason: null,
          suspendedUntil: null,
        },
      );

      await BannedEmailModel.deleteOne({ email: user.email });

      return { success: true };
    }),
});
