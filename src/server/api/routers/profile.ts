import { z } from "zod";
import { lineupPopulateFields } from "~/lib/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { LineupModel, UserModel } from "~/server/models";

export const profileRouter = createTRPCRouter({
  // Get a user's profile by ID
  getById: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await UserModel.findById(input.userId)
        .select(
          "name username image bio profileImg bannerImg socialMedia friends",
        )
        .populate("friends", "username name profileImg")
        .lean();

      if (!user) return null;

      // Get user's lineups (limited to 6)
      const lineups = await LineupModel.find({ ownerId: input.userId })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate([
          { path: "players.pg", model: "Player" },
          { path: "players.sg", model: "Player" },
          { path: "players.sf", model: "Player" },
          { path: "players.pf", model: "Player" },
          { path: "players.c", model: "Player" },
        ]);

      return {
        ...user,
        id: user._id?.toString(),
        lineups,
        _count: {
          lineups: lineups.length,
        },
      };
    }),

  // Get current user's profile
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await UserModel.findById(ctx.session.user.id)
      .select(
        "name username email image bio profileImg bannerImg socialMedia friends",
      )
      .populate("friends", "username name profileImg")
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
        ownerId: input.userId,
        featured: true,
      })
        .limit(3)
        .populate(lineupPopulateFields)
        .lean();
    }),
});
