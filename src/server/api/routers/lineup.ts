import { TRPCError } from "@trpc/server";
import mongoose, { type SortOrder } from "mongoose";
import { z } from "zod";
import {
  getIdString,
  incrementTotalVotes,
  lineupPopulateFields,
  processCommentVote,
  transformLineup,
} from "~/lib/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  CommentModel,
  LineupModel,
  PlayerModel,
  RatingModel,
  VoteModel as LineupVoteModel,
  type Lineup,
  CommentVoteModel,
} from "~/server/models";
import { ThreadModel } from "~/server/models/threads";
const playerSchema = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  imgUrl: z.string(),
  value: z.number(),
});
const BUDGET_LIMIT = 15;

export const lineupRouter = createTRPCRouter({
  // Create a new lineup (protected - requires auth)
  create: protectedProcedure
    .input(
      z.object({
        pg: playerSchema,
        sg: playerSchema,
        sf: playerSchema,
        pf: playerSchema,
        c: playerSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { pg, sg, sf, pf, c } = input;
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

      // Fetch all selected players and validate budget
      const selectedPlayers = await PlayerModel.find({
        _id: { $in: playerIds },
      });

      if (selectedPlayers.length !== 5) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more selected players not found.",
        });
      }

      const totalValue = selectedPlayers.reduce(
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
          pg: selectedPlayers[0]?._id,
          sg: selectedPlayers[1]?._id,
          sf: selectedPlayers[2]?._id,
          pf: selectedPlayers[3]?._id,
          c: selectedPlayers[4]?._id,
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
            .enum(["newest", "oldest", "highest-rated", "most-votes"])
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
        case "most-votes":
          sortOption = { totalVotes: -1 };
          break;
      }

      return await LineupModel.find({ ownerId: ctx.session.user.id })
        .sort(sortOption)
        .populate(lineupPopulateFields)
        .lean();
    }),

  // Get a specific user's lineups (public)
  getLineupsByOtherUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      // may need to check if we need to map votes and ratings here
      return await LineupModel.find({ ownerId: input.userId })
        .sort({ createdAt: -1 })
        .populate(lineupPopulateFields)
        .lean();
    }),

  // Get all lineups (explore - public)
  getAllLineups: publicProcedure
    .input(
      z
        .object({
          sort: z
            .enum(["newest", "oldest", "highest-rated", "most-votes"])
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
        case "most-votes":
          sortOption = { totalVotes: -1 };
          break;
      }
      // may need to check if we need to map votes and ratings here
      return await LineupModel.find()
        .sort(sortOption)
        .populate(lineupPopulateFields)
        .lean();
    }),

  // Get a single lineup by ID
  getLineupById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await LineupModel.findById(input.id).populate(
        lineupPopulateFields,
      );
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
      const [deletedLineup, _deletedVotes, _deletedRatings] = await Promise.all(
        [
          LineupModel.findByIdAndDelete(input.id).lean(),
          LineupVoteModel.deleteMany({ lineupId: input.id }),
          RatingModel.deleteMany({ lineupId: input.id }),
        ],
      );
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
  // VOTING SYSTEM
  // ============================================

  // Vote on a lineup (upvote or downvote)
  lineupVote: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        type: z.enum(["upvote", "downvote"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await LineupModel.findById(input.lineupId)
        .select("owner totalVotes")
        .lean();

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      // Can't vote on your own lineup
      if (lineup.owner._id.toString() === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot vote on your own lineup.",
        });
      }

      // Check for existing vote
      const existingVote = await LineupVoteModel.findOneAndUpdate(
        {
          user: ctx.session.user.id,
          lineup: input.lineupId,
        },

        {
          $setOnInsert: {
            user: ctx.session.user.id,
            lineup: input.lineupId,
            type: input.type,
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          new: false,
        },
      )
        .select("type")
        .lean();

      // Calculate vote delta - O(1) instead of scanning all votes
      const amountToIncrementVotesBy = incrementTotalVotes(
        input.type,
        existingVote?.type ?? null,
      );

      return await LineupModel.findByIdAndUpdate(
        input.lineupId,
        {
          $inc: { totalVotes: amountToIncrementVotesBy },
        },
        { new: true },
      );
    }),

  // Get current user's vote on a lineup
  getUserVote: protectedProcedure
    .input(z.object({ lineupId: z.string() }))
    .query(async ({ ctx, input }) => {
      return LineupVoteModel.findOne({
        user: ctx.session.user.id,
        lineup: input.lineupId,
      }).lean();
      //* chance we only need the type, will review later
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
        value: z.number().min(1).max(10),
      }),
    )
    // look up the projection to ensure we are not fetching anything extra
    // can also do a mongodb lookup to get just the field we need
    // our db is very relationship oriented so it may be better for sql tables and fk
    // mongo is better when the data coming in can be unpredictable vs knowing exactly what is needed
    .mutation(async ({ ctx, input }) => {
      const lineup = await LineupModel.findById(input.lineupId)
        .select({ owner: 1, _id: 0 })
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
          // step one: update the rating sum and count
          {
            $set: {
              ratingSum: { $add: ["$ratingSum", sumDelta] },
              ratingCount: { $add: ["$ratingCount", countDelta] },
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
        { new: true },
      );
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
        pg: playerSchema,
        sg: playerSchema,
        sf: playerSchema,
        pf: playerSchema,
        c: playerSchema,
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
        getIdString(lineup.players.pg._id),
        getIdString(lineup.players.sg._id),
        getIdString(lineup.players.sf._id),
        getIdString(lineup.players.pf._id),
        getIdString(lineup.players.c._id),
      ]);
      const newIds = [
        input.pg._id,
        input.sg._id,
        input.sf._id,
        input.pf._id,
        input.c._id,
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
          pg: input.pg,
          sg: input.sg,
          sf: input.sf,
          pf: input.pf,
          c: input.c,
        },
        { new: true },
      )
        .populate(lineupPopulateFields)
        .lean();
    }),

  // ============================================
  // GAMBLING MECHANICS
  // ============================================

  // Gamble a player for a random player of similar value
  // TODO: Create a more robust gambling mechanic that offers a wider range of players to gamble with
  gamble: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        position: z.enum(["pg", "sg", "sf", "pf", "c"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await LineupModel.findById(input.lineupId).populate(
        lineupPopulateFields,
      );

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
      // revisit to tighten this type
      const currentPlayer = lineup.players[positionField];

      if (!currentPlayer?.value) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Current player not found.",
        });
      }

      const currentValue = currentPlayer?.value;

      // Determine possible values for the new player
      let possibleValues: number[];
      if (currentValue === 1) {
        possibleValues = [1];
      } else if (currentValue === 5) {
        possibleValues = [4, 5];
      } else {
        possibleValues = [currentValue - 1, currentValue, currentValue + 1];
      }

      // Convert string IDs to ObjectIds for proper MongoDB $nin comparison
      const currentLineupPlayerIds = [
        getIdString(lineup.pgId),
        getIdString(lineup.sgId),
        getIdString(lineup.sfId),
        getIdString(lineup.pfId),
        getIdString(lineup.cId),
      ]
        .filter((id): id is string => Boolean(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      // Find eligible players (matching value, not already in lineup)
      const [newPlayer] = await PlayerModel.aggregate<IPlayer>([
        {
          $match: {
            value: { $in: possibleValues },
            _id: { $nin: currentLineupPlayerIds },
          },
        },
        { $sample: { size: 1 } },
      ]);

      if (!newPlayer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No eligible players available for gambling.",
        });
      }

      // Update the lineup with the new player
      const updateData = {
        [positionField]: newPlayer._id,
        $inc: { timesGambled: 1 },
      };

      const updatedLineup = await LineupModel.findByIdAndUpdate(
        input.lineupId,
        updateData,
        { new: true },
      ).populate(lineupPopulateFields);

      return {
        lineup: transformLineup(updatedLineup),
        previousPlayer: currentPlayer,
        newPlayer,
      };
    }),

  // ============================================
  // COMMENT SYSTEM
  // ============================================

  // Get comments for a lineup
  // TODO: must be refactored to use the new comment schema
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

      // Populate and return
      return await CommentModel.findById(comment._id)
        .populate("user", "username name profileImg")
        .lean();
    }),

  // Add a thread reply to a comment
  // TODO: must be refactored to use the new thread schema
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

      // Populate and return
      return await ThreadModel.findById(newThreadReply._id)
        .populate("user", "username name profileImg")
        .lean();
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
        // * the types are not helping here, will review later
        lineup: input.lineupId,
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found.",
        });
      }

      // Can't vote on your own comment
      if (comment.user._id.toString() === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot vote on your own comment.",
        });
      }
      // i am sleepy zzzzzzzzz

      // Process vote using shared helper (O(1) delta calculation)
      // const { totalVotes } = processCommentVote(
      //   comment.totalVotes,
      //   ctx.session.user.id,
      //   input.type,
      //   comment.totalVotes,
      // );
      // comment.totalVotes = totalVotes;

      // await comment.save();

      return { totalVotes };
    }),

  // Vote on a thread reply
  // TODO: must be refactored to use the new thread vote schema
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

      const thread = comment.thread.find(
        (t) => t._id.toString() === input.threadId,
      );

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread reply not found.",
        });
      }

      // Can't vote on your own thread
      if (thread.userId.toString() === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot vote on your own reply.",
        });
      }

      // Process vote using shared helper (O(1) delta calculation)
      const { totalVotes } = processCommentVote(
        thread.votes,
        ctx.session.user.id,
        input.type,
        thread.totalVotes,
      );
      thread.totalVotes = totalVotes;

      await comment.save();

      return { totalVotes };
    }),
});
