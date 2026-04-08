import { z } from "zod";
import { TRPCError } from "@trpc/server";
import mongoose from "mongoose";
import { lineupPopulateFields } from "~/server/lib/lineup-queries";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { LineupModel, UserModel } from "~/server/models";
import { redis } from "~/server/redis";
import {
  profileOutput,
  profileMeOutput,
  userOutput,
  lineupOutput,
  populated,
} from "~/server/api/schemas/output";

export const profileRouter = createTRPCRouter({
  // Get a user's profile by ID (includes lineups + stats)
  getById: publicProcedure
    .input(z.object({ userId: z.string() }))
    .output(profileOutput.nullable())
    .query(async ({ input }) => {
      const cachedUser = await redis.get(`user:${input.userId}`);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
      const user = await UserModel.findById(input.userId)
        .select(
          "name username image bio profileImg bannerImg socialMedia followerCount followingCount",
        )
        .lean();

      if (!user) return null;

      const ownerId = new mongoose.Types.ObjectId(input.userId);

      // Run lineup queries and stats aggregation in parallel
      const [lineups, totalLineups, statsAgg, featuredLineups] =
        await Promise.all([
          LineupModel.find({ owner: ownerId })
            .sort({ createdAt: -1 })
            .limit(6)
            .populate(lineupPopulateFields)
            .lean(),

          LineupModel.countDocuments({ owner: ownerId }),

          LineupModel.aggregate([
            { $match: { owner: ownerId, ratingCount: { $gt: 0 } } },
            {
              $group: {
                _id: null,
                avgRating: { $avg: "$avgRating" },
                highestRating: { $max: "$avgRating" },
              },
            },
          ]),

          LineupModel.find({ owner: ownerId, featured: true })
            .limit(3)
            .populate(lineupPopulateFields)
            .lean(),
        ]);

      // Get the highest rated lineup separately (need full doc)
      const aggResult = statsAgg[0] as
        | { avgRating: number; highestRating: number }
        | undefined;

      let highestRatedLineup = null;
      if (aggResult?.highestRating && aggResult.highestRating > 0) {
        highestRatedLineup = await LineupModel.findOne({
          owner: ownerId,
          avgRating: aggResult.highestRating,
        })
          .populate(lineupPopulateFields)
          .lean();
      }

      return populated({
        ...user,
        id: user._id?.toString(),
        lineups,
        featuredLineups,
        stats: {
          totalLineups,
          avgRating: Math.round((aggResult?.avgRating ?? 0) * 100) / 100,
          highestRatedLineup,
          featuredCount: featuredLineups.length,
        },
        _count: {
          lineups: totalLineups,
        },
      });
    }),

  // Get current user's profile
  getMe: protectedProcedure
    .output(profileMeOutput.nullable())
    .query(async ({ ctx }) => {
      const cachedUser = await redis.get(`user:${ctx.session.user.id}`);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
      const user = await UserModel.findById(ctx.session.user.id)
        .select(
          "name username email image bio profileImg bannerImg socialMedia followerCount followingCount",
        )
        .lean();

      if (!user) return null;

      return populated({
        ...user,
        id: user._id?.toString(),
      });
    }),

  // Update current user's profile
  update: protectedProcedure
    .output(userOutput.nullable())
    .input(
      z.object({
        username: z.string().min(3).max(30).optional(),
        bio: z.string().max(250).optional(),
        profileImg: z.string().url().optional().nullable(),
        bannerImg: z.string().url().optional().nullable(),
        socialMedia: z
          .object({
            twitter: z.string().optional().nullable(),
            instagram: z.string().optional().nullable(),
            facebook: z.string().optional().nullable(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if username is taken by another user
      if (input.username) {
        const existingUser = await UserModel.findOne({
          username: input.username,
        });

        if (
          existingUser &&
          existingUser._id.toString() !== ctx.session.user.id
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username is already taken.",
          });
        }
      }

      const updateData: {
        username?: string;
        bio?: string;
        profileImg?: string | null;
        bannerImg?: string | null;
        socialMedia?: {
          twitter?: string | null;
          instagram?: string | null;
          facebook?: string | null;
        };
      } = {};
      if (input.username !== undefined) updateData.username = input.username;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.profileImg !== undefined)
        updateData.profileImg = input.profileImg;
      if (input.bannerImg !== undefined) updateData.bannerImg = input.bannerImg;
      if (input.socialMedia !== undefined)
        updateData.socialMedia = input.socialMedia;

      const updatedUser = await UserModel.findByIdAndUpdate(
        ctx.session.user.id,
        updateData,
        { new: true },
      );
      await redis.del(`user:${ctx.session.user.id}`);
      return populated(updatedUser ?? null);
    }),

  // Get featured lineups for a user
  getFeaturedLineups: publicProcedure
    .input(z.object({ userId: z.string() }))
    .output(z.array(lineupOutput))
    .query(async ({ input }) => {
      return populated(
        await LineupModel.find({
          owner: input.userId,
          featured: true,
        })
          .limit(3)
          .populate(lineupPopulateFields)
          .lean(),
      );
    }),
});
