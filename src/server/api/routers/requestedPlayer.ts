import { z } from "zod";
import { TRPCError } from "@trpc/server";
import Fuse from "fuse.js";
import mongoose from "mongoose";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { PlayerModel, RequestedPlayerModel, UserModel } from "~/server/models";
import { redis } from "~/server/redis";

export const requestedPlayerRouter = createTRPCRouter({
  searchDuplicates: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const query = `${input.firstName.trim()} ${input.lastName.trim()}`;

      // Load players (prefer Redis cache)
      let players: Array<{
        firstName: string;
        lastName: string;
        value?: number;
        imgUrl?: string;
      }>;
      const cached = await redis.get("players");
      if (cached) {
        players = JSON.parse(cached) as typeof players;
      } else {
        players = await PlayerModel.find()
          .select("firstName lastName value imgUrl")
          .lean();
      }

      const requestedPlayers = await RequestedPlayerModel.find()
        .select("firstName lastName")
        .lean();

      interface FuseItem {
        firstName: string;
        lastName: string;
        value?: number;
        imgUrl?: string;
        source: "pool" | "requested";
      }

      const combined: FuseItem[] = [
        ...players.map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          value: p.value,
          imgUrl: p.imgUrl,
          source: "pool" as const,
        })),
        ...requestedPlayers.map((rp) => ({
          firstName: rp.firstName,
          lastName: rp.lastName,
          source: "requested" as const,
        })),
      ];

      const fuse = new Fuse(combined, {
        keys: ["firstName", "lastName"],
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
          source: r.item.source,
          matchPercent: Math.round((1 - (r.score ?? 1)) * 100),
        }))
        .filter((r) => r.matchPercent >= 60);
    }),

  // Get all requested players with description counts
  getAll: publicProcedure.query(async () => {
    const requestedPlayers = await RequestedPlayerModel.find()
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
      const userIds = requestedPlayer.descriptions.map((d) => d.user);
      const users = await UserModel.find({ _id: { $in: userIds } }).lean();
      const userMap = new Map(users.map((u) => [u._id.toHexString(), u]));

      const descriptionsWithUsers = requestedPlayer.descriptions.map((d) => {
        const user = userMap.get(d.user.toHexString());
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
        note: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();
      const userId = new mongoose.Types.ObjectId(ctx.session.user.id);

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
              user: userId,
              suggestedValue: input.suggestedValue,
              note: input.note?.trim() || null,
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
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
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
