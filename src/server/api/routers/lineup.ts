import { TRPCError } from "@trpc/server";
import mongoose from "mongoose";
import { z } from "zod";
import { lineupPopulateFields } from "~/server/lib/lineup-queries";
import { buildLineupSort } from "~/server/services/lineup";
import { logger } from "~/lib/logger";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const log = logger.child({ module: "lineup" });
import {
  LineupModel,
  PlayerModel,
  RatingModel,
  type PlayerDoc,
} from "~/server/models";
import {
  lineupOutput,
  gambleResultOutput,
  populated,
} from "~/server/api/schemas/output";
import {
  BUDGET_LIMIT,
  DAILY_GAMBLE_LIMIT,
  selectWeightedValue,
  getOutcomeTier,
  calculateStreakChange,
  shouldResetDailyGambles,
} from "./lineup-utils";

import { playerSchema } from "~/server/api/schemas/lineup";

export const lineupRouter = createTRPCRouter({
  // Create a new lineup (protected - requires auth)
  create: protectedProcedure
    .input(
      z.object({
        players: z.object({
          pg: playerSchema,
          sg: playerSchema,
          sf: playerSchema,
          pf: playerSchema,
          c: playerSchema,
        }),
      }),
    )
    .output(lineupOutput.nullable())
    .mutation(async ({ ctx, input }) => {
      const { players } = input;
      const { pg, sg, sf, pf, c } = players;
      const playerIds = [pg._id, sg._id, sf._id, pf._id, c._id];
      // Check for duplicate players
      const uniqueIds = new Set(playerIds);
      if (uniqueIds.size !== playerIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Duplicate players found. Each position must have a unique player.",
        });
      }

      const dbPlayers = await PlayerModel.find({
        _id: { $in: playerIds },
      }).lean();
      if (dbPlayers.length !== 5) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more selected players not found.",
        });
      }

      const totalValue = dbPlayers.reduce((sum, p) => sum + p.value, 0);
      if (totalValue > BUDGET_LIMIT) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Lineup exceeds $${BUDGET_LIMIT} budget. Total value: $${totalValue}`,
        });
      }

      // Create the lineup
      const lineup = await LineupModel.create({
        players: {
          pg: players.pg._id,
          sg: players.sg._id,
          sf: players.sf._id,
          pf: players.pf._id,
          c: players.c._id,
        },
        owner: ctx.session.user.id,
      });

      return populated(
        await LineupModel.findById(lineup._id)
          .populate(lineupPopulateFields)
          .lean(),
      );
    }),

  // Get current user's lineups (protected)
  getLineupsByCurrentUser: protectedProcedure
    .output(z.array(lineupOutput))
    .input(
      z
        .object({
          sort: z
            .enum(["newest", "oldest", "highest-rated", "most-rated"])
            .optional()
            .default("newest"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const data = await LineupModel.find({ owner: ctx.session.user.id })
        .sort(buildLineupSort(input?.sort))
        .populate(lineupPopulateFields)
        .lean();
      return populated(data);
    }),

  // Get a specific user's lineups (public)
  // look into adding pagination similar to players router
  getLineupsByOtherUsers: publicProcedure
    .output(z.array(lineupOutput))
    .input(
      z.object({
        userId: z.string().optional(),
        sort: z
          .enum(["newest", "oldest", "highest-rated", "most-rated"])
          .optional()
          .default("newest"),
      }),
    )
    .query(async ({ input }) => {
      const filter = input.userId
        ? { owner: { $ne: new mongoose.Types.ObjectId(input.userId) } }
        : {};

      return populated(
        await LineupModel.find(filter)
          .sort(buildLineupSort(input?.sort))
          .populate(lineupPopulateFields)
          .lean(),
      );
    }),

  getAllLineups: publicProcedure
    .output(z.array(lineupOutput))
    .input(
      z
        .object({
          sort: z
            .enum(["newest", "oldest", "highest-rated"])
            .optional()
            .default("newest"),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return populated(
        await LineupModel.find()
          .sort(buildLineupSort(input?.sort))
          .populate(lineupPopulateFields)
          .lean(),
      );
    }),

  getLineupById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(lineupOutput.nullable())
    .query(async ({ input }) => {
      return populated(
        await LineupModel.findById(input.id)
          .populate(lineupPopulateFields)
          .lean(),
      );
    }),

  // Delete a lineup (protected - only owner can delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.unknown().nullable())
    .mutation(async ({ ctx, input }) => {
      const lineup = await LineupModel.findById(input.id)
        .select("owner")
        .lean();

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      if (lineup.owner._id.toString() !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this lineup.",
        });
      }

      // Delete related votes and ratings
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [deletedLineup, _deletedRatings] = await Promise.all([
        LineupModel.findByIdAndDelete(input.id).lean(),
        RatingModel.deleteMany({ lineupId: input.id }),
      ]);
      return deletedLineup;
    }),

  // Toggle featured status (protected - only owner)
  toggleFeatured: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(lineupOutput.nullable())
    .mutation(async ({ ctx, input }) => {
      const lineup = await LineupModel.findById(input.id)
        .select("owner featured")
        .lean();

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      if (lineup.owner._id.toString() !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to modify this lineup.",
        });
      }

      // Check if user already has 3 featured lineups
      if (!lineup.featured) {
        const featuredCount = await LineupModel.countDocuments({
          owner: ctx.session.user.id,
          featured: true,
        });

        if (featuredCount >= 3) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Maximum 3 featured lineups allowed. Remove one to add another.",
          });
        }
      }

      return populated(
        await LineupModel.findByIdAndUpdate(
          input.id,
          { featured: !lineup.featured },
          { new: true },
        )
          .populate(lineupPopulateFields)
          .lean(),
      );
    }),

  // ============================================
  // RATING SYSTEM
  // ============================================

  // Rate a lineup (1-10)
  // look at the way we handle async and try to use this pattern more
  // when we have stuff that does not deepend on other things, we can fire without await and use await at the end.
  rate: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        value: z.number().min(0.01).max(10),
      }),
    )
    .output(z.object({ avgRating: z.number() }))
    // can also do a mongodb lookup to get just the field we need
    // our db is very relationship oriented so it may be better for sql tables and fk
    // mongo is better when the data coming in can be unpredictable vs knowing exactly what is needed
    .mutation(async ({ ctx, input }) => {
      const lineup = await LineupModel.findById(input.lineupId)
        .select({ owner: 1 })
        .lean();

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      // Can't rate your own lineup
      if (lineup.owner.toString() === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot rate your own lineup.",
        });
      }
      // look into have a .then to consolidate the awaits on the functions
      // Upsert rating

      const newRating = input.value;
      // upsert the rating, await the values so we can use them to update the lineup
      const existingRating = await RatingModel.findOneAndUpdate(
        {
          user: ctx.session.user.id,
          lineup: input.lineupId,
        },
        {
          value: newRating,
        },
      );

      const isNewRating = !existingRating;
      const oldRating = existingRating?.value ?? 0;
      const sumDelta = newRating - oldRating;
      const countDelta = isNewRating ? 1 : 0;

      // update the lineup with the new rating atomically and in one pass
      const updatedLineup = await LineupModel.findByIdAndUpdate(
        lineup._id,

        [
          // step one: update the rating sum and count (treat missing/null as 0)
          {
            $set: {
              ratingSum: {
                $add: [{ $ifNull: ["$ratingSum", 0] }, sumDelta],
              },
              ratingCount: {
                $add: [{ $ifNull: ["$ratingCount", 0] }, countDelta],
              },
            },
          },
          // step two: update the average rating
          {
            $set: {
              avgRating: {
                $cond: {
                  if: {
                    $gt: ["$ratingCount", 0],
                  },
                  then: {
                    $divide: ["$ratingSum", "$ratingCount"],
                  },
                  else: 0,
                },
              },
            },
          },
        ],
        // { new: true },
        { updatePipeline: true, new: true },
      );
      log.debug({ updatedLineup }, "updatedLineup");
      return { avgRating: updatedLineup?.avgRating ?? 0 };
    }),

  // ============================================
  // REORDER LINEUP
  // ============================================

  // Reorder lineup positions
  reorder: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        players: z.object({
          pg: playerSchema,
          sg: playerSchema,
          sf: playerSchema,
          pf: playerSchema,
          c: playerSchema,
        }),
      }),
    )
    .output(lineupOutput.nullable())
    .mutation(async ({ ctx, input }) => {
      const lineup = await LineupModel.findById(input.lineupId)
        .populate(lineupPopulateFields)
        .lean();

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      if (lineup.owner._id.toString() !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this lineup.",
        });
      }

      const originalIds = new Set([
        lineup.players.pg._id.toString(),
        lineup.players.sg._id.toString(),
        lineup.players.sf._id.toString(),
        lineup.players.pf._id.toString(),
        lineup.players.c._id.toString(),
      ]);
      const newIds = [
        input.players.pg._id.toString(),
        input.players.sg._id.toString(),
        input.players.sf._id.toString(),
        input.players.pf._id.toString(),
        input.players.c._id.toString(),
      ];

      // Check for duplicates
      const uniqueNewIds = new Set(newIds);
      if (uniqueNewIds.size !== 5) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Duplicate players found. Each position must have a unique player.",
        });
      }

      // Check that we're only rearranging existing players
      for (const id of newIds) {
        if (!originalIds.has(id)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You can only reorder existing players in the lineup.",
          });
        }
      }

      return populated(
        await LineupModel.findByIdAndUpdate(
          input.lineupId,
          {
            players: {
              pg: input.players.pg,
              sg: input.players.sg,
              sf: input.players.sf,
              pf: input.players.pf,
              c: input.players.c,
            },
          },
          { new: true },
        )
          .populate(lineupPopulateFields)
          .lean(),
      );
    }),

  // ============================================
  // GAMBLING MECHANICS
  // ============================================

  /**
   * Gamble a player for a random player with weighted probability.
   *
   * Probability system:
   * - Lower value players have lower chance of upgrade (high risk, high reward potential)
   * - Higher value players have higher chance of maintaining value (low risk, low reward)
   *
   * Features:
   * - Weighted probability matrix for fair risk/reward
   * - Daily gamble limit (5 per day per lineup)
   * - Cooldown between gambles (30 seconds)
   * - Streak tracking for consecutive upgrades/downgrades
   * - Outcome tiers for visual feedback (jackpot, upgrade, neutral, downgrade, etc.)
   */
  gamble: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        position: z.enum(["pg", "sg", "sf", "pf", "c"]),
      }),
    )
    .output(gambleResultOutput)
    .mutation(async ({ ctx, input }) => {
      const lineup = await LineupModel.findById(input.lineupId).populate([
        { path: "players.pg", model: "Player" },
        { path: "players.sg", model: "Player" },
        { path: "players.sf", model: "Player" },
        { path: "players.pf", model: "Player" },
        { path: "players.c", model: "Player" },
        { path: "owner", model: "User", select: "_id" },
      ]);

      //       const {owner} = await LineupModel.findById(input.lineupId).select("owner").lean();
      // const ownerId = owner._id.toString();
      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      if (lineup.owner._id.toString() !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to gamble on this lineup.",
        });
      }

      const now = new Date();

      // Check and reset daily gamble limit if needed
      let dailyGamblesUsed = lineup.dailyGamblesUsed ?? 0;
      let dailyGamblesResetAt = lineup.dailyGamblesResetAt;

      if (shouldResetDailyGambles(dailyGamblesResetAt)) {
        dailyGamblesUsed = 0;
        dailyGamblesResetAt = now;
      }

      if (dailyGamblesUsed >= DAILY_GAMBLE_LIMIT) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Daily gamble limit reached (${DAILY_GAMBLE_LIMIT}). Try again tomorrow!`,
        });
      }

      // Get the current player at the position
      const positionField = input.position;
      // After population, players are Player objects, not ObjectIds
      const currentPlayer = lineup.players[
        positionField
      ] as unknown as PlayerDoc;

      if (!currentPlayer?.value) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Current player not found.",
        });
      }

      const currentValue = currentPlayer.value;

      // Use weighted probability to determine target value
      const targetValue = selectWeightedValue(currentValue);

      // Convert string IDs to ObjectIds for proper MongoDB $nin comparison
      const currentLineupPlayerIds = [
        lineup.players.pg._id.toString(),
        lineup.players.sg._id.toString(),
        lineup.players.sf._id.toString(),
        lineup.players.pf._id.toString(),
        lineup.players.c._id.toString(),
      ]
        .filter((id): id is string => Boolean(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      // Find a random player at the target value (not already in lineup)
      let [newPlayer] = await PlayerModel.aggregate<PlayerDoc>([
        {
          $match: {
            value: targetValue,
            _id: { $nin: currentLineupPlayerIds },
          },
        },
        { $sample: { size: 1 } },
      ]);

      // Fallback: if no player found at target value, try adjacent values
      if (!newPlayer) {
        const fallbackValues = [1, 2, 3, 4, 5].filter((v) => v !== targetValue);
        [newPlayer] = await PlayerModel.aggregate<PlayerDoc>([
          {
            $match: {
              value: { $in: fallbackValues },
              _id: { $nin: currentLineupPlayerIds },
            },
          },
          { $sample: { size: 1 } },
        ]);
      }

      if (!newPlayer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No eligible players available for gambling.",
        });
      }

      // Calculate outcome metrics
      const newPlayerValue = newPlayer.value;
      const valueChange = newPlayerValue - currentValue;
      const outcomeTier = getOutcomeTier(valueChange);
      const currentStreak = lineup.gambleStreak ?? 0;
      const newStreak = calculateStreakChange(currentStreak, valueChange);

      // Build the last gamble result
      const lastGambleResult = {
        previousValue: currentValue,
        newValue: newPlayerValue,
        valueChange,
        outcomeTier,
        position: input.position,
        timestamp: now,
      };

      // Update the lineup with the new player and gambling stats
      const updatedLineup = await LineupModel.findByIdAndUpdate(
        input.lineupId,
        {
          [`players.${positionField}`]: newPlayer._id,
          $inc: { timesGambled: 1 },
          $set: {
            lastGambleResult,
            gambleStreak: newStreak,
            dailyGamblesUsed: dailyGamblesUsed + 1,
            dailyGamblesResetAt,
          },
        },
        { new: true },
      ).populate(lineupPopulateFields);

      return populated({
        lineup: updatedLineup,
        previousPlayer: currentPlayer,
        newPlayer,
        outcome: {
          previousValue: currentValue,
          newValue: newPlayerValue,
          valueChange,
          outcomeTier,
          streak: newStreak,
          dailyGamblesRemaining: DAILY_GAMBLE_LIMIT - (dailyGamblesUsed + 1),
        },
      });
    }),
});
