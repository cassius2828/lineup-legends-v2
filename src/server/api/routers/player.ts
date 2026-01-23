import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const playerRouter = createTRPCRouter({
  // Get all players, optionally filtered by value
  getAll: publicProcedure
    .input(z.object({ value: z.number().min(1).max(5).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const where = input?.value ? { value: input.value } : {};
      return ctx.db.player.findMany({
        where,
        orderBy: { value: "desc" },
      });
    }),

  // Get a single player by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.player.findUnique({
        where: { id: input.id },
      });
    }),

  // Get random players grouped by value tier (for lineup creation)
  // Returns 5 random players for each value tier (1-5)
  getRandomByValue: publicProcedure.query(async ({ ctx }) => {
    // MongoDB doesn't have native random sampling in Prisma, 
    // so we fetch all and sample in JS
    const allPlayers = await ctx.db.player.findMany();
    
    const playersByValue: Record<number, typeof allPlayers> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };

    // Group players by value
    for (const player of allPlayers) {
      if (player.value >= 1 && player.value <= 5) {
        playersByValue[player.value]!.push(player);
      }
    }

    // Shuffle and take 5 from each tier
    const shuffleAndTake = (arr: typeof allPlayers, count: number) => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    return {
      value1Players: shuffleAndTake(playersByValue[1]!, 5),
      value2Players: shuffleAndTake(playersByValue[2]!, 5),
      value3Players: shuffleAndTake(playersByValue[3]!, 5),
      value4Players: shuffleAndTake(playersByValue[4]!, 5),
      value5Players: shuffleAndTake(playersByValue[5]!, 5),
    };
  }),

  // Search players by name
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!input.query.trim()) {
        return ctx.db.player.findMany({
          take: 10,
          orderBy: { value: "desc" },
        });
      }

      // Case-insensitive search on firstName or lastName
      return ctx.db.player.findMany({
        where: {
          OR: [
            { firstName: { contains: input.query, mode: "insensitive" } },
            { lastName: { contains: input.query, mode: "insensitive" } },
          ],
        },
        orderBy: { value: "desc" },
      });
    }),
});

