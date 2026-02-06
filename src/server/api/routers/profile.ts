import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { UserModel, LineupModel, type LineupDoc } from "~/server/models";
import type { Document, Types } from "mongoose";

// Population fields for lineup queries
const lineupPopulateFields = [
  { path: "pg", model: "Player" },
  { path: "sg", model: "Player" },
  { path: "sf", model: "Player" },
  { path: "pf", model: "Player" },
  { path: "c", model: "Player" },
  { path: "ownerId", model: "User" },
];

// Type for lineup plain object after toObject()
interface LineupObject {
  _id?: Types.ObjectId;
  id?: string;
  pg: unknown;
  sg: unknown;
  sf: unknown;
  pf: unknown;
  c: unknown;
  ownerId: unknown;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  totalVotes: number;
  avgRating: number;
  timesGambled: number;
}

// Helper to transform lineup for API response
function transformLineup(lineup: (Document & LineupDoc) | null) {
  if (!lineup) return null;
  const obj = lineup.toObject() as LineupObject;
  return {
    ...obj,
    id: obj._id?.toString() ?? obj.id,
    pg: obj.pg,
    sg: obj.sg,
    sf: obj.sf,
    pf: obj.pf,
    c: obj.c,
    owner: obj.ownerId,
  };
}

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
          { path: "pgId", model: "Player" },
          { path: "sgId", model: "Player" },
          { path: "sfId", model: "Player" },
          { path: "pfId", model: "Player" },
          { path: "cId", model: "Player" },
        ]);

      // Get total lineup count
      const lineupCount = await LineupModel.countDocuments({
        ownerId: input.userId,
      });

      // Transform lineups
      const transformedLineups = lineups.map((lineup) => {
        const obj = lineup.toObject();
        return {
          ...obj,
          id: obj._id?.toString(),
          pg: obj.pg,
          sg: obj.sg,
          sf: obj.sf,
          pf: obj.pf,
          c: obj.c,
        };
      });

      return {
        ...user,
        id: user._id?.toString(),
        lineups: transformedLineups,
        _count: {
          lineups: lineupCount,
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
          existingUserModel._id.toString() !== ctx.session.user.id
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

      return updatedUser ? updatedUserModel.toObject() : null;
    }),

  // Get featured lineups for a user
  getFeaturedLineups: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const lineups = await LineupModel.find({
        ownerId: input.userId,
        featured: true,
      })
        .limit(3)
        .populate(lineupPopulateFields);

      return lineups.map(transformLineup);
    }),
});
