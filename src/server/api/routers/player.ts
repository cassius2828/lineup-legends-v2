import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { Player } from "~/server/models";

export const playerRouter = createTRPCRouter({
  // Get all players, optionally filtered by value
  getAll: publicProcedure
    .input(z.object({ value: z.number().min(1).max(5).optional() }).optional())
    .query(async ({ input }) => {
      const filter = input?.value ? { value: input.value } : {};
      const players = await Player.find(filter).sort({ value: -1 });
      return players.map((p) => p.toObject());
    }),

  // Get a single player by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const player = await Player.findById(input.id);
      return player ? player.toObject() : null;
    }),

  // Get random players grouped by value tier (for lineup creation)
  // Returns 5 random players for each value tier (1-5)
  getRandomByValue: publicProcedure.query(async () => {
    // MongoDB doesn't have native random sampling easily,
    // so we fetch all and sample in JS (same as before)
    const allPlayers = await Player.find();

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
      return shuffled.slice(0, count).map((p) => p.toObject());
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
    .query(async ({ input }) => {
      if (!input.query.trim()) {
        const players = await Player.find().limit(10).sort({ value: -1 });
        return players.map((p) => p.toObject());
      }

      // Case-insensitive search on firstName or lastName using regex
      const searchRegex = new RegExp(input.query, "i");
      const players = await Player.find({
        $or: [
          { firstName: { $regex: searchRegex } },
          { lastName: { $regex: searchRegex } },
        ],
      }).sort({ value: -1 });

      return players.map((p) => p.toObject());
    }),

  // Update a player (admin only - should add proper auth check)
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        value: z.number().min(1).max(5),
        imgUrl: z.string().url(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const updatedPlayer = await Player.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      if (!updatedPlayer) {
        throw new Error("Player not found");
      }

      return updatedPlayer.toObject();
    }),

  // Create a new player (admin only)
  create: adminProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        value: z.number().min(1).max(5),
        imgUrl: z.string().url(),
      }),
    )
    .mutation(async ({ input }) => {
      // Trim whitespace from names
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();

      // Check if player with same name already exists (case-insensitive)
      const existingPlayer = await Player.findOne({
        firstName: { $regex: new RegExp(`^${firstName}$`, "i") },
        lastName: { $regex: new RegExp(`^${lastName}$`, "i") },
      });

      if (existingPlayer) {
        throw new Error(
          `Player "${firstName} ${lastName}" already exists in the database.`,
        );
      }

      // Create new player
      const newPlayer = await Player.create({
        firstName,
        lastName,
        value: input.value,
        imgUrl: input.imgUrl,
      });

      return newPlayer.toObject();
    }),
});
