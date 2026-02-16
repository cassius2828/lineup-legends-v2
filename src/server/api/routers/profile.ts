import { z } from "zod";
import mongoose from "mongoose";
import { lineupPopulateFields } from "~/lib/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { LineupModel, UserModel } from "~/server/models";

export const profileRouter = createTRPCRouter({
  // Get a user's profile by ID (includes lineups + stats)
  getById: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
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
            { $match: { owner: ownerId } },
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

      return {
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
      };
    }),

  // Get current user's profile
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await UserModel.findById(ctx.session.user.id)
      .select(
        "name username email image bio profileImg bannerImg socialMedia followerCount followingCount",
      )
      .lean();

    if (!user) return null;

    return {
      ...user,
      id: user._id?.toString(),
    };
  }),

  // Update current user's profile
  update: protectedProcedure
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
          throw new Error("Username is already taken.");
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

      return updatedUser ?? null;
    }),

  // Get featured lineups for a user
  getFeaturedLineups: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await LineupModel.find({
        owner: input.userId,
        featured: true,
      })
        .limit(3)
        .populate(lineupPopulateFields)
        .lean();
    }),
});
