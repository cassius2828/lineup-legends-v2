import { z } from "zod";
import type { Player } from "~/server/models";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { PlayerModel } from "~/server/models";
import { redis } from "~/server/redis";

export const playerRouter = createTRPCRouter({
  // Get all players, optionally filtered by value
  getAll: publicProcedure
    .input(z.object({ value: z.number().min(1).max(5).optional() }).optional())
    .query(async ({ input }) => {
      const filter = input?.value ? { value: input.value } : {};
      const cachedPlayers = await redis.get("players");
      if (cachedPlayers) {
        return JSON.parse(cachedPlayers);
      }
      const players = await PlayerModel.find(filter).sort({ value: -1 }).lean();
      await redis.set("players", JSON.stringify(players));
      // ttl 24 hours
      await redis.expire("players", 84600);
      return players;
    }),

  // Get a single player by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const cachedPlayers = await redis.get("players");
      if (cachedPlayers) {
        return JSON.parse(cachedPlayers).find((player: Player) => player.id === input.id);
      }
      return await PlayerModel.findById(input.id).lean();


    }),

  // Get random players grouped by value tier (for lineup creation)
  // Returns 5 random players for each value tier (1-5)
  getRandomByValue: publicProcedure.query(async () => {
    const twentyFiveRandomPlayers: {
      value1Players: Player[];
      value2Players: Player[];
      value3Players: Player[];
      value4Players: Player[];
      value5Players: Player[];
    }[] = await PlayerModel.aggregate([
      {
        $facet: {
          value1Players: [{ $match: { value: 1 } }, { $sample: { size: 5 } }],
          value2Players: [{ $match: { value: 2 } }, { $sample: { size: 5 } }],
          value3Players: [{ $match: { value: 3 } }, { $sample: { size: 5 } }],
          value4Players: [{ $match: { value: 4 } }, { $sample: { size: 5 } }],
          value5Players: [{ $match: { value: 5 } }, { $sample: { size: 5 } }],
        },
      },
    ]);

    return twentyFiveRandomPlayers[0];
  }),

  // Search players by name
  // Are we even using this anymore, since we leverage the client side search and redis? 
  // we can keep as a fallback for now
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      if (!input.query.trim()) {
        return await PlayerModel.find().limit(10).sort({ value: -1 }).lean();
      }

      // Case-insensitive search on firstName or lastName using regex
      const searchRegex = new RegExp(input.query, "i");
      const players = await PlayerModel.find({
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

      const updatedPlayer = await PlayerModel.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
        },
      );

      if (!updatedPlayer) {
        throw new Error("Player not found");
      }
      await redis.del("players");
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
      const existingPlayer = await PlayerModel.findOne({
        firstName: { $regex: new RegExp(`^${firstName}$`, "i") },
        lastName: { $regex: new RegExp(`^${lastName}$`, "i") },
      });

      if (existingPlayer) {
        throw new Error(
          `Player "${firstName} ${lastName}" already exists in the database.`,
        );
      }

      // Create new player
      const newPlayer = await PlayerModel.create({
        firstName,
        lastName,
        value: input.value,
        imgUrl: input.imgUrl,
      });

      await redis.del("players");
      return newPlayer.toObject();
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await PlayerModel.findByIdAndDelete(input.id);
      await redis.del("players");
      return { success: true };
    }),
});
