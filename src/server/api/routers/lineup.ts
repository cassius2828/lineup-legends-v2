import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const BUDGET_LIMIT = 15;

export const lineupRouter = createTRPCRouter({
  // Create a new lineup (protected - requires auth)
  create: protectedProcedure
    .input(
      z.object({
        pgId: z.string(),
        sgId: z.string(),
        sfId: z.string(),
        pfId: z.string(),
        cId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { pgId, sgId, sfId, pfId, cId } = input;
      const playerIds = [pgId, sgId, sfId, pfId, cId];

      // Check for duplicate players
      const uniqueIds = new Set(playerIds);
      if (uniqueIds.size !== playerIds.length) {
        throw new Error("Duplicate players found. Each position must have a unique player.");
      }

      // Fetch all selected players and validate budget
      const players = await ctx.db.player.findMany({
        where: { id: { in: playerIds } },
      });

      if (players.length !== 5) {
        throw new Error("One or more selected players not found.");
      }

      const totalValue = players.reduce((sum, player) => sum + player.value, 0);
      if (totalValue > BUDGET_LIMIT) {
        throw new Error(
          `Lineup exceeds $${BUDGET_LIMIT} budget. Total value: $${totalValue}`
        );
      }

      // Create the lineup
      return ctx.db.lineup.create({
        data: {
          pgId,
          sgId,
          sfId,
          pfId,
          cId,
          ownerId: ctx.session.user.id,
          featured: false,
        },
        include: {
          pg: true,
          sg: true,
          sf: true,
          pf: true,
          c: true,
          owner: true,
        },
      });
    }),

  // Get current user's lineups (protected)
  getByCurrentUser: protectedProcedure
    .input(
      z.object({
        sort: z.enum(["newest", "oldest"]).optional().default("newest"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const orderBy = input?.sort === "oldest" 
        ? { createdAt: "asc" as const }
        : { createdAt: "desc" as const };

      return ctx.db.lineup.findMany({
        where: { ownerId: ctx.session.user.id },
        orderBy,
        include: {
          pg: true,
          sg: true,
          sf: true,
          pf: true,
          c: true,
          owner: true,
        },
      });
    }),

  // Get a specific user's lineups (public)
  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.lineup.findMany({
        where: { ownerId: input.userId },
        orderBy: { createdAt: "desc" },
        include: {
          pg: true,
          sg: true,
          sf: true,
          pf: true,
          c: true,
          owner: true,
        },
      });
    }),

  // Get all lineups (explore - public)
  getAll: publicProcedure
    .input(
      z.object({
        sort: z.enum(["newest", "oldest"]).optional().default("newest"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const orderBy = input?.sort === "oldest"
        ? { createdAt: "asc" as const }
        : { createdAt: "desc" as const };

      return ctx.db.lineup.findMany({
        orderBy,
        include: {
          pg: true,
          sg: true,
          sf: true,
          pf: true,
          c: true,
          owner: true,
        },
      });
    }),

  // Get a single lineup by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.lineup.findUnique({
        where: { id: input.id },
        include: {
          pg: true,
          sg: true,
          sf: true,
          pf: true,
          c: true,
          owner: true,
        },
      });
    }),

  // Delete a lineup (protected - only owner can delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lineup = await ctx.db.lineup.findUnique({
        where: { id: input.id },
      });

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      if (lineup.ownerId !== ctx.session.user.id) {
        throw new Error("You do not have permission to delete this lineup.");
      }

      return ctx.db.lineup.delete({
        where: { id: input.id },
      });
    }),

  // Toggle featured status (protected - only owner)
  toggleFeatured: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lineup = await ctx.db.lineup.findUnique({
        where: { id: input.id },
      });

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      if (lineup.ownerId !== ctx.session.user.id) {
        throw new Error("You do not have permission to modify this lineup.");
      }

      // Check if user already has 3 featured lineups
      if (!lineup.featured) {
        const featuredCount = await ctx.db.lineup.count({
          where: { ownerId: ctx.session.user.id, featured: true },
        });

        if (featuredCount >= 3) {
          throw new Error(
            "Maximum 3 featured lineups allowed. Remove one to add another."
          );
        }
      }

      return ctx.db.lineup.update({
        where: { id: input.id },
        data: { featured: !lineup.featured },
        include: {
          pg: true,
          sg: true,
          sf: true,
          pf: true,
          c: true,
          owner: true,
        },
      });
    }),
});

