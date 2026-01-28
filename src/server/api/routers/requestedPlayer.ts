import { z } from "zod";
import { TRPCError } from "@trpc/server";
import mongoose from "mongoose";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { RequestedPlayer, User } from "~/server/models";

export const requestedPlayerRouter = createTRPCRouter({
  // Get all requested players with description counts
  getAll: publicProcedure.query(async () => {
    const requestedPlayers = await RequestedPlayer.find()
      .sort({ updatedAt: -1 })
      .lean();

    return requestedPlayers.map((rp) => ({
      ...rp,
      id: rp._id.toHexString(),
      descriptionCount: rp.descriptions.length,
    }));
  }),

  // Get a single requested player by ID with populated user info
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const requestedPlayer = await RequestedPlayer.findById(input.id).lean();

      if (!requestedPlayer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requested player not found",
        });
      }

      // Populate user info for each description
      const userIds = requestedPlayer.descriptions.map((d) => d.userId);
      const users = await User.find({ _id: { $in: userIds } }).lean();
      const userMap = new Map(users.map((u) => [u._id.toHexString(), u]));

      const descriptionsWithUsers = requestedPlayer.descriptions.map((d) => {
        const user = userMap.get(d.userId.toHexString());
        return {
          ...d,
          id: d._id.toHexString(),
          user: user
            ? {
                id: user._id.toHexString(),
                name: user.name,
                email: user.email,
                image: user.image,
              }
            : null,
        };
      });

      return {
        ...requestedPlayer,
        id: requestedPlayer._id.toHexString(),
        descriptions: descriptionsWithUsers,
      };
    }),

  // Create or add description to existing requested player
  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        suggestedValue: z.number().min(1).max(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();
      const userId = new mongoose.Types.ObjectId(ctx.session.user.id);

      // Upsert: find by name or create, then push description
      const result = await RequestedPlayer.findOneAndUpdate(
        {
          firstName: { $regex: new RegExp(`^${firstName}$`, "i") },
          lastName: { $regex: new RegExp(`^${lastName}$`, "i") },
        },
        {
          $setOnInsert: { firstName, lastName },
          $push: {
            descriptions: {
              _id: new mongoose.Types.ObjectId(),
              userId,
              suggestedValue: input.suggestedValue,
              createdAt: new Date(),
            },
          },
        },
        { upsert: true, new: true },
      );

      return {
        ...result.toObject(),
        id: result._id.toHexString(),
      };
    }),

  // Delete a requested player entirely
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const requestedPlayer = await RequestedPlayer.findById(input.id);

      if (!requestedPlayer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requested player not found",
        });
      }

      await RequestedPlayer.findByIdAndDelete(input.id);

      return { success: true, id: input.id };
    }),
});
