import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  // Get a user's profile by ID
  getById: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          profileImg: true,
          bannerImg: true,
          lineups: {
            orderBy: { createdAt: "desc" },
            take: 6,
            include: {
              pg: true,
              sg: true,
              sf: true,
              pf: true,
              c: true,
            },
          },
          _count: {
            select: {
              lineups: true,
            },
          },
        },
      });

      return user;
    }),

  // Get current user's profile
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        profileImg: true,
        bannerImg: true,
      },
    });
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
        const existingUser = await ctx.db.user.findUnique({
          where: { username: input.username },
        });

        if (existingUser && existingUser.id !== ctx.session.user.id) {
          throw new Error("Username is already taken.");
        }
      }

      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          username: input.username,
          bio: input.bio,
          profileImg: input.profileImg,
          bannerImg: input.bannerImg,
        },
      });
    }),

  // Get featured lineups for a user
  getFeaturedLineups: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.lineup.findMany({
        where: {
          ownerId: input.userId,
          featured: true,
        },
        include: {
          pg: true,
          sg: true,
          sf: true,
          pf: true,
          c: true,
          owner: true,
        },
        take: 3,
      });
    }),
});

