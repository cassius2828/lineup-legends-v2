import { TRPCError } from "@trpc/server";
import mongoose, { type SortOrder } from "mongoose";
import { z } from "zod";
import { getVoteDelta, lineupPopulateFields } from "~/lib/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  CommentModel,
  CommentVoteModel,
  LineupModel,
  PlayerModel,
  RatingModel,
  type GambleOutcomeTier,
  type Lineup,
  type Player,
  type PlayerDoc,
} from "~/server/models";
import { ThreadModel } from "~/server/models/threads";
import { ThreadVoteModel } from "~/server/models/threadVotes";
const playerSchema = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  imgUrl: z.string(),
  value: z.number(),
});
const BUDGET_LIMIT = 15;

// ============================================
// GAMBLING CONFIGURATION
// ============================================

/**
 * Weighted probability matrix for gambling outcomes.
 * Each row represents the current player value (1-5).
 * Each column represents the probability (%) of getting a player of that value.
 *
 * Design philosophy:
 * - Lower value players = higher risk, small upside potential (hail mary)
 * - Higher value players = safer odds, maintain value (low risk, low reward)
 */
const GAMBLE_ODDS: Record<number, number[]> = {
  // [chance of getting value: 1, 2, 3, 4, 5]
  1: [70, 15, 8, 6, 1], // 45% upgrade chance, mostly small gains
  2: [35, 45, 10, 7, 3], // 30% upgrade, 30% downgrade
  3: [9, 20, 50, 14, 7], // 25% upgrade, 30% downgrade - balanced
  4: [5, 8, 17, 45, 25], // 25% upgrade to 5, 30% downgrade
  5: [2, 5, 8, 25, 60], // 60% stay at 5, very safe
};

/** Maximum gambles allowed per day per lineup */
const DAILY_GAMBLE_LIMIT = 5;

/** Cooldown between gambles in milliseconds (30 seconds) */
const GAMBLE_COOLDOWN_MS = 30 * 1000;

/**
 * Selects a target player value based on weighted probabilities.
 * Uses cumulative probability distribution for selection.
 */
function selectWeightedValue(currentValue: number): number {
  const weights = GAMBLE_ODDS[currentValue];
  if (!weights) return currentValue;

  const random = Math.random() * 100;
  let cumulative = 0;

  for (let i = 0; i < weights.length; i++) {
    const weight = weights[i] ?? 0;
    cumulative += weight;
    if (random < cumulative) {
      return i + 1; // Values are 1-indexed
    }
  }

  return currentValue; // Fallback
}

/**
 * Determines the outcome tier based on value change.
 * Used for visual feedback in the UI.
 */
function getOutcomeTier(valueChange: number): GambleOutcomeTier {
  if (valueChange >= 3) return "jackpot";
  if (valueChange === 2) return "big_win";
  if (valueChange === 1) return "upgrade";
  if (valueChange === 0) return "neutral";
  if (valueChange === -1) return "downgrade";
  if (valueChange === -2) return "big_loss";
  return "disaster"; // -3 or worse
}

/**
 * Calculates streak change based on outcome.
 * Positive outcomes continue/start positive streak.
 * Negative outcomes continue/start negative streak.
 * Neutral resets streak.
 */
function calculateStreakChange(
  currentStreak: number,
  valueChange: number,
): number {
  if (valueChange > 0) {
    // Upgrade: continue positive streak or start new one
    return currentStreak >= 0 ? currentStreak + 1 : 1;
  } else if (valueChange < 0) {
    // Downgrade: continue negative streak or start new one
    return currentStreak <= 0 ? currentStreak - 1 : -1;
  }
  // Neutral: reset streak
  return 0;
}

/**
 * Checks if the daily gamble limit should reset (new day).
 */
function shouldResetDailyGambles(resetAt: Date | undefined): boolean {
  if (!resetAt) return true;
  const now = new Date();
  const resetDate = new Date(resetAt);
  return (
    now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
    now.getUTCMonth() !== resetDate.getUTCMonth() ||
    now.getUTCDate() !== resetDate.getUTCDate()
  );
}

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

      if (Object.values(players).length !== 5) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more selected players not found.",
        });
      }

      const totalValue = Object.values(players).reduce(
        (sum, player) => sum + player.value,
        0,
      );
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

      // Populate and return
      return await LineupModel.findById(lineup._id)
        .populate(lineupPopulateFields)
        .lean();
    }),

  // Get current user's lineups (protected)
  getLineupsByCurrentUser: protectedProcedure
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
    .query(async ({ ctx, input }) => {
      let sortOption: Record<string, SortOrder> = { createdAt: -1 };

      switch (input?.sort) {
        case "oldest":
          sortOption = { createdAt: 1 };
          break;
        case "highest-rated":
          sortOption = { avgRating: -1 };
          break;
      }

      const data = await LineupModel.find({ owner: ctx.session.user.id })
        .sort(sortOption)
        .populate(lineupPopulateFields)
        .lean();
      return data;
    }),

  // Get a specific user's lineups (public)
  // look into adding pagination similar to players router
  getLineupsByOtherUsers: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        sort: z
          .enum(["newest", "oldest", "highest-rated"])
          .optional()
          .default("newest"),
      }),
    )
    .query(async ({ input }) => {
      let sortOption: Record<string, SortOrder> = { createdAt: -1 };

      switch (input?.sort) {
        case "oldest":
          sortOption = { createdAt: 1 };
          break;
        case "highest-rated":
          sortOption = { avgRating: -1 };
          break;
      }
      // may need to check if we need to map ratings here
      return await LineupModel.find({
        owner: { $ne: new mongoose.Types.ObjectId(input.userId) },
      })
        .sort(sortOption)
        .populate(lineupPopulateFields)
        .lean();
    }),

  // Get all lineups (explore - public)
  getAllLineups: publicProcedure
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
      let sortOption: Record<string, SortOrder> = { createdAt: -1 };

      switch (input?.sort) {
        case "oldest":
          sortOption = { createdAt: 1 };
          break;
        case "highest-rated":
          sortOption = { avgRating: -1 };
          break;
      }
      // may need to check if we need to map ratings here
      return await LineupModel.find()
        .sort(sortOption)
        .populate(lineupPopulateFields)
        .lean();
    }),

  // Get a single lineup by ID
  getLineupById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await LineupModel.findById(input.id)
        .populate(lineupPopulateFields)
        .lean();
    }),

  // Delete a lineup (protected - only owner can delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
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

      return await LineupModel.findByIdAndUpdate(
        input.id,
        { featured: !lineup.featured },
        { new: true },
      )
        .populate(lineupPopulateFields)
        .lean();
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
    // look up the projection to ensure we are not fetching anything extra
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
      console.log(updatedLineup, " <-- updatedLineup\n\n");
      return { avgRating: updatedLineup?.avgRating };
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

      return await LineupModel.findByIdAndUpdate(
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
        .lean();
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

      // Check cooldown
      const now = new Date();
      const lastGambleAt = lineup.lastGambleAt;
      if (lastGambleAt) {
        const timeSinceLastGamble = now.getTime() - lastGambleAt.getTime();
        if (timeSinceLastGamble < GAMBLE_COOLDOWN_MS) {
          const remainingSeconds = Math.ceil(
            (GAMBLE_COOLDOWN_MS - timeSinceLastGamble) / 1000,
          );
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Please wait ${remainingSeconds} seconds before gambling again.`,
          });
        }
      }

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
      const positionFieldMap: Record<
        "pg" | "sg" | "sf" | "pf" | "c",
        keyof Lineup["players"]
      > = {
        pg: "pg",
        sg: "sg",
        sf: "sf",
        pf: "pf",
        c: "c",
      };
      const positionField = positionFieldMap[input.position];
      // After population, players are Player objects, not ObjectIds
      const currentPlayer = lineup.players[positionField] as unknown as Player;

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
            lastGambleAt: now,
            dailyGamblesUsed: dailyGamblesUsed + 1,
            dailyGamblesResetAt,
          },
        },
        { new: true },
      ).populate(lineupPopulateFields);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      return {
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
          cooldownSeconds: GAMBLE_COOLDOWN_MS / 1000,
        },
      };
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    }),

  // ============================================
  // COMMENT SYSTEM
  // ============================================

  // Get comments for a lineup
  getComments: publicProcedure
    .input(
      z.object({
        lineupId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      // allows for null value of cursor
      const matchStage: Record<string, unknown> = {
        lineupId: new mongoose.Types.ObjectId(input.lineupId),
      };
      if (input.cursor) {
        matchStage._id = { $lt: new mongoose.Types.ObjectId(input.cursor) };
      }
      const comments = await CommentModel.find(matchStage).lean();
      const hasMore = comments.length > (input.limit ?? 10);
      if (hasMore) comments.pop();
      return {
        comments,
        hasMore,
        cursor: comments[comments.length - 1]?._id?.toString(),
      };
    }),

  // Add a comment to a lineup
  addComment: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        text: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await CommentModel.create({
        text: input.text,
        user: ctx.session.user.id,
        lineup: input.lineupId,
      });

      // return the comment with the user data
      return {
        ...comment.toObject(),
        user: {
          username: ctx.session.user.username,
          name: ctx.session.user.name,
          profileImg: ctx.session.user.profileImg,
          image: ctx.session.user.image,
        },
      };
    }),

  // Add a thread reply to a comment
  addThreadReply: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        commentId: z.string(),
        text: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await CommentModel.findOne({
        _id: input.commentId,
        lineup: new mongoose.Types.ObjectId(input.lineupId),
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found.",
        });
      }
      const newThreadReply = await ThreadModel.create({
        text: input.text,
        user: ctx.session.user.id,
        comment: new mongoose.Types.ObjectId(input.commentId),
      });

      // return the thread reply with the user data
      return {
        ...newThreadReply.toObject(),
        user: {
          username: ctx.session.user.username,
          name: ctx.session.user.name,
          profileImg: ctx.session.user.profileImg,
          image: ctx.session.user.image,
        },
      };
    }),

  // Vote on a comment (upvote or downvote)
  // TODO: must be refactored to use the new comment vote schema
  voteComment: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        commentId: z.string(),
        type: z.enum(["upvote", "downvote"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await CommentModel.findOne({
        _id: input.commentId,
        lineup: input.lineupId,
      })
        .select({ user: 1, _id: 0 })
        .lean();

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found.",
        });
      }

      // Can't vote on your own comment
      if (comment.user.toString() === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot vote on your own comment.",
        });
      }
      // upsert the vote
      const existingVote = await CommentVoteModel.findOneAndUpdate(
        {
          user: ctx.session.user.id,
          comment: input.commentId,
        },
        {
          type: input.type,
        },
        {
          upsert: true,
        },
      );
      // atomically update the total votes by the vote delta
      const oldVote = existingVote?.type ?? null;
      const voteDelta = getVoteDelta(input.type, oldVote);
      const updatedComment = await CommentModel.findByIdAndUpdate(
        input.commentId,
        {
          $inc: { totalVotes: voteDelta },
        },
        { new: true, projection: { totalVotes: 1 } },
      );

      return { totalVotes: updatedComment?.totalVotes ?? 0 };
    }),

  // Vote on a thread reply
  voteThread: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        commentId: z.string(),
        threadId: z.string(),
        type: z.enum(["upvote", "downvote"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await CommentModel.findOne({
        _id: input.commentId,
        lineupId: input.lineupId,
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found.",
        });
      }

      const existingThread = await ThreadModel.findById(input.threadId)
        .select("user votes totalVotes")
        .lean();
      if (!existingThread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread reply not found.",
        });
      }
      // Can't vote on your own thread
      if (existingThread?.user.toString() === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot vote on your own reply.",
        });
      }

      const existingVote = await ThreadVoteModel.findOneAndUpdate(
        {
          user: ctx.session.user.id,
          thread: input.threadId,
        },
        {
          type: input.type,
        },
        {
          upsert: true,
        },
      );
      const oldVote = existingVote?.type ?? null;
      const voteDelta = getVoteDelta(input.type, oldVote);
      const updatedThread = await ThreadModel.findByIdAndUpdate(
        input.threadId,
        {
          $inc: { totalVotes: voteDelta },
        },
        { new: true, projection: { totalVotes: 1 } },
      );
      // await comment.save();

      return { totalVotes: updatedThread?.totalVotes ?? 0 };
    }),
});
