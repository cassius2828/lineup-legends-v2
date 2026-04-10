import { z } from "zod";
import { TRPCError } from "@trpc/server";
import Fuse from "fuse.js";
import mongoose from "mongoose";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { PlayerModel, RequestedPlayerModel, UserModel } from "~/server/models";
import { getPlayersFromCacheOrDb } from "~/server/services/player-cache";
import {
  requestedPlayerListItemOutput,
  requestedPlayerDetailOutput,
  populated,
} from "~/server/api/schemas/output";

export const requestedPlayerRouter = createTRPCRouter({
  searchDuplicates: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      }),
    )
    .output(
      z.array(
        z.object({
          firstName: z.string(),
          lastName: z.string(),
          value: z.number(),
          imgUrl: z.string(),
          source: z.literal("pool"),
          matchPercent: z.number(),
        }),
      ),
    )
    .query(async ({ input }) => {
      const query = `${input.firstName.trim()} ${input.lastName.trim()}`;

      const players = await getPlayersFromCacheOrDb();

      const poolItems = players.map((p) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        fullName: `${p.firstName} ${p.lastName}`,
        value: p.value,
        imgUrl: p.imgUrl,
      }));

      const fuse = new Fuse(poolItems, {
        keys: ["fullName"],
        threshold: 0.4,
        includeScore: true,
      });

      const results = fuse.search(query);

      return results
        .map((r) => ({
          firstName: r.item.firstName,
          lastName: r.item.lastName,
          value: r.item.value,
          imgUrl: r.item.imgUrl,
          source: "pool" as const,
          matchPercent: Math.round((1 - (r.score ?? 1)) * 100),
        }))
        .filter((r) => r.matchPercent >= 60);
    }),

  // Get all requested players with description counts
  getAll: publicProcedure
    .output(z.array(requestedPlayerListItemOutput))
    .query(async () => {
      const requestedPlayers = await RequestedPlayerModel.find()
        .sort({ updatedAt: -1 })
        .lean();

      return populated(
        requestedPlayers.map((rp) => ({
          ...rp,
          id: rp._id,
          descriptionCount: rp.descriptions.length,
        })),
      );
    }),

  // Get a single requested player by ID with populated user info
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(requestedPlayerDetailOutput)
    .query(async ({ input }) => {
      const requestedPlayer = await RequestedPlayerModel.findById(
        input.id,
      ).lean();

      if (!requestedPlayer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requested player not found",
        });
      }

      // Populate user info for each description
      // Support both `user` and legacy `userId` field for pre-migration documents
      const userIds = requestedPlayer.descriptions.map(
        (d) => d.user ?? (d as unknown as Record<string, unknown>).userId,
      );
      const users = await UserModel.find({ _id: { $in: userIds } }).lean();
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      const descriptionsWithUsers = requestedPlayer.descriptions.map((d) => {
        const uid = d.user ?? (d as unknown as Record<string, unknown>).userId;
        const user = uid ? userMap.get(uid.toString()) : undefined;
        return {
          ...d,
          id: d._id,
          user: user
            ? {
                id: user._id.toString(),
                name: user.name,
                image: user.image,
              }
            : null,
        };
      });

      return populated({
        ...requestedPlayer,
        id: requestedPlayer._id,
        descriptions: descriptionsWithUsers,
      });
    }),

  // Create or add description to existing requested player
  create: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        suggestedValue: z.number().min(1).max(5),
        note: z.string().max(500).optional(),
      }),
    )
    .output(
      requestedPlayerListItemOutput.extend({
        descriptionCount: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();
      const userId = ctx.session?.user?.id
        ? new mongoose.Types.ObjectId(ctx.session.user.id)
        : null;

      // Upsert: find by name or create, then push description
      const result = await RequestedPlayerModel.findOneAndUpdate(
        {
          firstName: { $regex: new RegExp(`^${firstName}$`, "i") },
          lastName: { $regex: new RegExp(`^${lastName}$`, "i") },
        },
        {
          $setOnInsert: { firstName, lastName },
          $push: {
            descriptions: {
              _id: new mongoose.Types.ObjectId(),
              ...(userId ? { user: userId } : {}),
              suggestedValue: input.suggestedValue,
              note: input.note?.trim() || null,
              createdAt: new Date(),
            },
          },
        },
        { upsert: true, new: true },
      );

      return populated({
        ...result.toObject(),
        id: result._id,
      });
    }),

  // Delete a requested player entirely
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean(), id: z.string() }))
    .mutation(async ({ input }) => {
      const requestedPlayer = await RequestedPlayerModel.findById(input.id);

      if (!requestedPlayer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Requested player not found",
        });
      }

      await RequestedPlayerModel.findByIdAndDelete(input.id);

      return { success: true, id: input.id };
    }),
});
