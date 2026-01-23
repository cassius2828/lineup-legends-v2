import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const BUDGET_LIMIT = 15;

// Helper to calculate total votes
async function recalculateTotalVotes(db: any, lineupId: string) {
  const votes = await db.vote.findMany({
    where: { lineupId },
  });

  let total = 0;
  for (const vote of votes) {
    if (vote.type === "upvote") total += 1;
    if (vote.type === "downvote") total -= 1;
  }

  await db.lineup.update({
    where: { id: lineupId },
    data: { totalVotes: total },
  });

  return total;
}

// Helper to calculate average rating
async function recalculateAvgRating(db: any, lineupId: string) {
  const ratings = await db.rating.findMany({
    where: { lineupId },
  });

  if (ratings.length === 0) {
    await db.lineup.update({
      where: { id: lineupId },
      data: { avgRating: 0 },
    });
    return 0;
  }

  const sum = ratings.reduce((acc: number, r: { value: number }) => acc + r.value, 0);
  const avg = sum / ratings.length;

  await db.lineup.update({
    where: { id: lineupId },
    data: { avgRating: avg },
  });

  return avg;
}

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
        sort: z.enum(["newest", "oldest", "highest-rated", "most-votes"]).optional().default("newest"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let orderBy: any = { createdAt: "desc" };
      
      switch (input?.sort) {
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "highest-rated":
          orderBy = { avgRating: "desc" };
          break;
        case "most-votes":
          orderBy = { totalVotes: "desc" };
          break;
      }

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
          votes: {
            where: { userId: ctx.session.user.id },
          },
          ratings: {
            where: { userId: ctx.session.user.id },
          },
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
        sort: z.enum(["newest", "oldest", "highest-rated", "most-votes"]).optional().default("newest"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let orderBy: any = { createdAt: "desc" };
      
      switch (input?.sort) {
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "highest-rated":
          orderBy = { avgRating: "desc" };
          break;
        case "most-votes":
          orderBy = { totalVotes: "desc" };
          break;
      }

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

  // ============================================
  // VOTING SYSTEM
  // ============================================

  // Vote on a lineup (upvote or downvote)
  vote: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        type: z.enum(["upvote", "downvote"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await ctx.db.lineup.findUnique({
        where: { id: input.lineupId },
      });

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      // Can't vote on your own lineup
      if (lineup.ownerId === ctx.session.user.id) {
        throw new Error("You cannot vote on your own lineup.");
      }

      // Check for existing vote
      const existingVote = await ctx.db.vote.findUnique({
        where: {
          userId_lineupId: {
            userId: ctx.session.user.id,
            lineupId: input.lineupId,
          },
        },
      });

      if (existingVote) {
        if (existingVote.type === input.type) {
          // Same vote type - remove the vote
          await ctx.db.vote.delete({
            where: { id: existingVote.id },
          });
        } else {
          // Different vote type - update the vote
          await ctx.db.vote.update({
            where: { id: existingVote.id },
            data: { type: input.type },
          });
        }
      } else {
        // No existing vote - create new
        await ctx.db.vote.create({
          data: {
            type: input.type,
            userId: ctx.session.user.id,
            lineupId: input.lineupId,
          },
        });
      }

      // Recalculate total votes
      const newTotal = await recalculateTotalVotes(ctx.db, input.lineupId);

      return { totalVotes: newTotal };
    }),

  // Get current user's vote on a lineup
  getUserVote: protectedProcedure
    .input(z.object({ lineupId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.vote.findUnique({
        where: {
          userId_lineupId: {
            userId: ctx.session.user.id,
            lineupId: input.lineupId,
          },
        },
      });
    }),

  // ============================================
  // RATING SYSTEM
  // ============================================

  // Rate a lineup (1-10)
  rate: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        value: z.number().min(1).max(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await ctx.db.lineup.findUnique({
        where: { id: input.lineupId },
      });

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      // Can't rate your own lineup
      if (lineup.ownerId === ctx.session.user.id) {
        throw new Error("You cannot rate your own lineup.");
      }

      // Upsert rating
      await ctx.db.rating.upsert({
        where: {
          userId_lineupId: {
            userId: ctx.session.user.id,
            lineupId: input.lineupId,
          },
        },
        create: {
          value: input.value,
          userId: ctx.session.user.id,
          lineupId: input.lineupId,
        },
        update: {
          value: input.value,
        },
      });

      // Recalculate average rating
      const newAvg = await recalculateAvgRating(ctx.db, input.lineupId);

      return { avgRating: newAvg };
    }),

  // Get current user's rating on a lineup
  getUserRating: protectedProcedure
    .input(z.object({ lineupId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.rating.findUnique({
        where: {
          userId_lineupId: {
            userId: ctx.session.user.id,
            lineupId: input.lineupId,
          },
        },
      });
    }),

  // ============================================
  // REORDER LINEUP
  // ============================================

  // Reorder lineup positions
  reorder: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        pgId: z.string(),
        sgId: z.string(),
        sfId: z.string(),
        pfId: z.string(),
        cId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await ctx.db.lineup.findUnique({
        where: { id: input.lineupId },
        include: { pg: true, sg: true, sf: true, pf: true, c: true },
      });

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      if (lineup.ownerId !== ctx.session.user.id) {
        throw new Error("You do not have permission to edit this lineup.");
      }

      // Validate that all provided IDs are from the original lineup
      const originalIds = new Set([
        lineup.pgId,
        lineup.sgId,
        lineup.sfId,
        lineup.pfId,
        lineup.cId,
      ]);
      const newIds = [input.pgId, input.sgId, input.sfId, input.pfId, input.cId];

      // Check for duplicates
      const uniqueNewIds = new Set(newIds);
      if (uniqueNewIds.size !== 5) {
        throw new Error("Duplicate players found. Each position must have a unique player.");
      }

      // Check that we're only rearranging existing players
      for (const id of newIds) {
        if (!originalIds.has(id)) {
          throw new Error("You can only reorder existing players in the lineup.");
        }
      }

      return ctx.db.lineup.update({
        where: { id: input.lineupId },
        data: {
          pgId: input.pgId,
          sgId: input.sgId,
          sfId: input.sfId,
          pfId: input.pfId,
          cId: input.cId,
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

  // ============================================
  // GAMBLING MECHANICS
  // ============================================

  // Gamble a player for a random player of similar value
  gamble: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        position: z.enum(["pg", "sg", "sf", "pf", "c"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await ctx.db.lineup.findUnique({
        where: { id: input.lineupId },
        include: { pg: true, sg: true, sf: true, pf: true, c: true },
      });

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      if (lineup.ownerId !== ctx.session.user.id) {
        throw new Error("You do not have permission to gamble on this lineup.");
      }

      const currentPlayer = lineup[input.position];
      const currentValue = currentPlayer.value;

      // Determine possible values for the new player
      let possibleValues: number[];
      if (currentValue === 1) {
        // Value 1 can only get value 1
        possibleValues = [1];
      } else if (currentValue === 5) {
        // Value 5 can get 4 or 5
        possibleValues = [4, 5];
      } else {
        // Values 2-4 can get -1, same, or +1
        possibleValues = [currentValue - 1, currentValue, currentValue + 1];
      }

      // Get all player IDs currently in the lineup
      const currentLineupPlayerIds = [
        lineup.pgId,
        lineup.sgId,
        lineup.sfId,
        lineup.pfId,
        lineup.cId,
      ];

      // Find eligible players (matching value, not already in lineup)
      const eligiblePlayers = await ctx.db.player.findMany({
        where: {
          value: { in: possibleValues },
          id: { notIn: currentLineupPlayerIds },
        },
      });

      if (eligiblePlayers.length === 0) {
        throw new Error("No eligible players available for gambling.");
      }

      // Pick a random player
      const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
      const newPlayer = eligiblePlayers[randomIndex]!;

      // Update the lineup with the new player
      const positionField = `${input.position}Id`;
      const updatedLineup = await ctx.db.lineup.update({
        where: { id: input.lineupId },
        data: {
          [positionField]: newPlayer.id,
          timesGambled: { increment: 1 },
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

      return {
        lineup: updatedLineup,
        previousPlayer: currentPlayer,
        newPlayer: newPlayer,
      };
    }),
});
