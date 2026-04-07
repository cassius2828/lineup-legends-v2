import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { PlayerModel } from "~/server/models";
import {
  getPlayersFromCacheOrDb,
  invalidatePlayersCache,
} from "~/server/services/player-cache";
import {
  playerOutput,
  playersByValueOutput,
  populated,
} from "~/server/api/schemas/output";

export const playerRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ value: z.number().min(1).max(5).optional() }).optional())
    .output(z.array(playerOutput))
    .query(async () => {
      return populated(await getPlayersFromCacheOrDb());
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(playerOutput.optional())
    .query(async ({ input }) => {
      const players = await getPlayersFromCacheOrDb();
      return players.find(
        (player: { id?: string; _id?: { toString(): string } }) =>
          (player.id ?? player._id?.toString()) === input.id,
      );
    }),

  getRandomByValue: publicProcedure
    .output(playersByValueOutput)
    .query(async () => {
      const results = await PlayerModel.aggregate([
        {
          $facet: {
            value1Players: [
              { $match: { value: 1 } },
              { $sample: { size: 5 } },
            ],
            value2Players: [
              { $match: { value: 2 } },
              { $sample: { size: 5 } },
            ],
            value3Players: [
              { $match: { value: 3 } },
              { $sample: { size: 5 } },
            ],
            value4Players: [
              { $match: { value: 4 } },
              { $sample: { size: 5 } },
            ],
            value5Players: [
              { $match: { value: 5 } },
              { $sample: { size: 5 } },
            ],
          },
        },
      ]);

      return populated(results[0]);
    }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .output(z.array(playerOutput))
    .query(async ({ input }) => {
      if (!input.query.trim()) {
        return populated(
          await PlayerModel.find().limit(10).sort({ value: -1 }).lean(),
        );
      }

      const searchRegex = new RegExp(input.query, "i");
      const players = await PlayerModel.find({
        $or: [
          { firstName: { $regex: searchRegex } },
          { lastName: { $regex: searchRegex } },
        ],
      }).sort({ value: -1 });

      return populated(players.map((p) => p.toObject()));
    }),

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
    .output(playerOutput)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const updatedPlayer = await PlayerModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true },
      );

      if (!updatedPlayer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }
      await invalidatePlayersCache();
      return populated(updatedPlayer.toObject());
    }),

  create: adminProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        value: z.number().min(1).max(5),
        imgUrl: z.string().url(),
      }),
    )
    .output(playerOutput)
    .mutation(async ({ input }) => {
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();

      const existingPlayer = await PlayerModel.findOne({
        firstName: { $regex: new RegExp(`^${firstName}$`, "i") },
        lastName: { $regex: new RegExp(`^${lastName}$`, "i") },
      });

      if (existingPlayer) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Player "${firstName} ${lastName}" already exists in the database.`,
        });
      }

      const newPlayer = await PlayerModel.create({
        firstName,
        lastName,
        value: input.value,
        imgUrl: input.imgUrl,
      });

      await invalidatePlayersCache();
      return populated(newPlayer.toObject());
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await PlayerModel.findByIdAndDelete(input.id);
      await invalidatePlayersCache();
      return { success: true };
    }),
});
