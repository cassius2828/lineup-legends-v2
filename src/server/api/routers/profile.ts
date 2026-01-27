import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { User, Lineup } from "~/server/models";

// Population fields for lineup queries
const lineupPopulateFields = [
  { path: "pgId", model: "Player" },
  { path: "sgId", model: "Player" },
  { path: "sfId", model: "Player" },
  { path: "pfId", model: "Player" },
  { path: "cId", model: "Player" },
  { path: "ownerId", model: "User" },
];

// Helper to transform lineup for API response
function transformLineup(lineup: any) {
  if (!lineup) return null;
  const obj = lineup.toObject ? lineup.toObject() : lineup;
  return {
    ...obj,
    id: obj._id?.toString() ?? obj.id,
    pg: obj.pgId,
    sg: obj.sgId,
    sf: obj.sfId,
    pf: obj.pfId,
    c: obj.cId,
    owner: obj.ownerId,
  };
}

export const profileRouter = createTRPCRouter({
  // Get a user's profile by ID
  getById: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await User.findById(input.userId)
        .select("name username image bio profileImg bannerImg")
        .lean();

      if (!user) return null;

      // Get user's lineups (limited to 6)
      const lineups = await Lineup.find({ ownerId: input.userId })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate([
          { path: "pgId", model: "Player" },
          { path: "sgId", model: "Player" },
          { path: "sfId", model: "Player" },
          { path: "pfId", model: "Player" },
          { path: "cId", model: "Player" },
        ]);

      // Get total lineup count
      const lineupCount = await Lineup.countDocuments({ ownerId: input.userId });

      // Transform lineups
      const transformedLineups = lineups.map(lineup => {
        const obj = lineup.toObject();
        return {
          ...obj,
          id: obj._id?.toString(),
          pg: obj.pgId,
          sg: obj.sgId,
          sf: obj.sfId,
          pf: obj.pfId,
          c: obj.cId,
        };
      });

      return {
        ...user,
        id: (user as any)._id?.toString(),
        lineups: transformedLineups,
        _count: {
          lineups: lineupCount,
        },
      };
    }),

  // Get current user's profile
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await User.findById(ctx.session.user.id)
      .select("name username email image bio profileImg bannerImg")
      .lean();

    if (!user) return null;

    return {
      ...user,
      id: (user as any)._id?.toString(),
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if username is taken by another user
      if (input.username) {
        const existingUser = await User.findOne({ username: input.username });

        if (existingUser && existingUser._id.toString() !== ctx.session.user.id) {
          throw new Error("Username is already taken.");
        }
      }

      const updateData: any = {};
      if (input.username !== undefined) updateData.username = input.username;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.profileImg !== undefined) updateData.profileImg = input.profileImg;
      if (input.bannerImg !== undefined) updateData.bannerImg = input.bannerImg;

      const updatedUser = await User.findByIdAndUpdate(
        ctx.session.user.id,
        updateData,
        { new: true }
      );

      return updatedUser ? updatedUser.toObject() : null;
    }),

  // Get featured lineups for a user
  getFeaturedLineups: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const lineups = await Lineup.find({
        ownerId: input.userId,
        featured: true,
      })
        .limit(3)
        .populate(lineupPopulateFields);

      return lineups.map(transformLineup);
    }),
});
