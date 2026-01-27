import { TRPCError } from "@trpc/server";
import mongoose, { type SortOrder } from "mongoose";
import { z } from "zod";
import {
  getIdString,
  lineupPopulateFields,
  processCommentVote,
  recalculateAvgRating,
  incrementTotalVotes,
  transformLineup,
} from "~/lib/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  Comment,
  Lineup,
  Player,
  Rating,
  Vote,
  type IComment,
  type ILineup,
  type IPlayer,
  type IThread,
} from "~/server/models";

const BUDGET_LIMIT = 15;

export const lineupRouter = createTRPCRouter({
  // Create a new lineup (protected - requires auth)
  create: protectedProcedure
    .input(
      z.object({
        pgId: z.string(),
        sgId: z.string(),
        sfId: z.string(),
        pfId: z.string(),
        cId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { pgId, sgId, sfId, pfId, cId } = input;
      const playerIds = [pgId, sgId, sfId, pfId, cId];

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
      const players = await Player.find({ _id: { $in: playerIds } });

      if (players.length !== 5) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more selected players not found.",
        });
      }

      const totalValue = players.reduce((sum, player) => sum + player.value, 0);
      if (totalValue > BUDGET_LIMIT) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Lineup exceeds $${BUDGET_LIMIT} budget. Total value: $${totalValue}`,
        });
      }

      // Create the lineup
      const lineup = await Lineup.create({
        pgId,
        sgId,
        sfId,
        pfId,
        cId,
        ownerId: ctx.session.user.id,
        featured: false,
      });

      // Populate and return
      const populatedLineup = await Lineup.findById(lineup._id).populate(
        lineupPopulateFields,
      );

      return transformLineup(populatedLineup);
    }),

  // Get current user's lineups (protected)
  getByCurrentUser: protectedProcedure
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

      const lineups = await Lineup.find({ ownerId: ctx.session.user.id })
        .sort(sortOption)
        .populate(lineupPopulateFields);

      // Get user's votes and ratings for these lineups
      const lineupIds = lineups.map((l) => l._id);
      const userVotes = await Vote.find({
        userId: ctx.session.user.id,
        lineupId: { $in: lineupIds },
      });
      const userRatings = await Rating.find({
        userId: ctx.session.user.id,
        lineupId: { $in: lineupIds },
      });

      // Map votes and ratings to lineups
      const voteMap = new Map(userVotes.map((v) => [v.lineupId.toString(), v]));
      const ratingMap = new Map(
        userRatings.map((r) => [r.lineupId.toString(), r]),
      );

      return lineups.map((lineup) => {
        const transformed = transformLineup(lineup);
        const lineupIdStr = lineup._id.toString();
        return {
          ...transformed,
          votes: voteMap.has(lineupIdStr) ? [voteMap.get(lineupIdStr)] : [],
          ratings: ratingMap.has(lineupIdStr)
            ? [ratingMap.get(lineupIdStr)]
            : [],
        };
      });
    }),

  // Get a specific user's lineups (public)
  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const lineups = await Lineup.find({ ownerId: input.userId })
        .sort({ createdAt: -1 })
        .populate(lineupPopulateFields);

      return lineups.map(transformLineup);
    }),

  // Get all lineups (explore - public)
  getAll: publicProcedure
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

      const lineups = await Lineup.find()
        .sort(sortOption)
        .populate(lineupPopulateFields);

      return lineups.map(transformLineup);
    }),

  // Get a single lineup by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const lineup = await Lineup.findById(input.id).populate(
        lineupPopulateFields,
      );

      return transformLineup(lineup);
    }),

  // Delete a lineup (protected - only owner can delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lineup = await Lineup.findById(input.id);

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      if (lineup.ownerId.toString() !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this lineup.",
        });
      }

      // Delete related votes and ratings
      await Vote.deleteMany({ lineupId: input.id });
      await Rating.deleteMany({ lineupId: input.id });

      return Lineup.findByIdAndDelete(input.id);
    }),

  // Toggle featured status (protected - only owner)
  toggleFeatured: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lineup = await Lineup.findById(input.id);

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      if (lineup.ownerId.toString() !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to modify this lineup.",
        });
      }

      // Check if user already has 3 featured lineups
      if (!lineup.featured) {
        const featuredCount = await Lineup.countDocuments({
          ownerId: ctx.session.user.id,
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

      const updatedLineup = await Lineup.findByIdAndUpdate(
        input.id,
        { featured: !lineup.featured },
        { new: true },
      ).populate(lineupPopulateFields);

      return transformLineup(updatedLineup);
    }),

  // ============================================
  // VOTING SYSTEM
  // ============================================

  // Vote on a lineup (upvote or downvote)
  vote: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        type: z.enum(["upvote", "downvote"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = new mongoose.Types.ObjectId(ctx.session.user.id);
      const lineupId = new mongoose.Types.ObjectId(input.lineupId);

      const lineup = await Lineup.findById(input.lineupId)
        .select("ownerId totalVotes")
        // * if you are doing reads or only need certain values, always select and lean the mongo doc
        .lean();

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      // Can't vote on your own lineup
      if (lineup.ownerId.toString() === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot vote on your own lineup.",
        });
      }

      // Check for existing vote
      const existingVote = await Vote.findOneAndUpdate(
        {
          userId,
          lineupId,
        },

        {
          $setOnInsert: {
            userId,
            lineupId,
            type: input.type,
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          new: false,
        },
      );

      // Recalculate total votes -- cal increment instead of scanning all votes again
      const amountToIncrementVotesBy = await incrementTotalVotes(
        input.type,
        existingVote,
      );

      return await Lineup.findByIdAndUpdate(
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
      return Vote.findOne({
        userId: ctx.session.user.id,
        lineupId: input.lineupId,
      });
    }),

  // ============================================
  // RATING SYSTEM
  // ============================================

  // Rate a lineup (1-10)
  rate: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        value: z.number().min(1).max(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await Lineup.findById(input.lineupId);

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      // Can't rate your own lineup
      if (lineup.ownerId.toString() === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot rate your own lineup.",
        });
      }

      // Upsert rating
      await Rating.findOneAndUpdate(
        {
          userId: ctx.session.user.id,
          lineupId: input.lineupId,
        },
        {
          value: input.value,
          userId: ctx.session.user.id,
          lineupId: input.lineupId,
        },
        { upsert: true, new: true },
      );

      // Recalculate average rating
      const newAvg = await recalculateAvgRating(input.lineupId);

      return { avgRating: newAvg };
    }),

  // Get current user's rating on a lineup
  getUserRating: protectedProcedure
    .input(z.object({ lineupId: z.string() }))
    .query(async ({ ctx, input }) => {
      return Rating.findOne({
        userId: ctx.session.user.id,
        lineupId: input.lineupId,
      });
    }),

  // ============================================
  // REORDER LINEUP
  // ============================================

  // Reorder lineup positions
  reorder: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        pgId: z.string(),
        sgId: z.string(),
        sfId: z.string(),
        pfId: z.string(),
        cId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await Lineup.findById(input.lineupId).populate(
        lineupPopulateFields,
      );

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      if (lineup.ownerId.toString() !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this lineup.",
        });
      }

      const originalIds = new Set([
        getIdString(lineup.pgId),
        getIdString(lineup.sgId),
        getIdString(lineup.sfId),
        getIdString(lineup.pfId),
        getIdString(lineup.cId),
      ]);
      const newIds = [
        input.pgId,
        input.sgId,
        input.sfId,
        input.pfId,
        input.cId,
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

      const updatedLineup = await Lineup.findByIdAndUpdate(
        input.lineupId,
        {
          pgId: input.pgId,
          sgId: input.sgId,
          sfId: input.sfId,
          pfId: input.pfId,
          cId: input.cId,
        },
        { new: true },
      ).populate(lineupPopulateFields);

      return transformLineup(updatedLineup);
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
      const lineup = await Lineup.findById(input.lineupId).populate(
        lineupPopulateFields,
      );

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      if (lineup.ownerId.toString() !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to gamble on this lineup.",
        });
      }

      // Get the current player at the position
      const positionFieldMap: Record<
        "pg" | "sg" | "sf" | "pf" | "c",
        keyof ILineup
      > = {
        pg: "pgId",
        sg: "sgId",
        sf: "sfId",
        pf: "pfId",
        c: "cId",
      };
      const positionField = positionFieldMap[input.position];
      // revisit to tighten this type
      const currentPlayer = lineup[positionField] as IPlayer;

      if (!currentPlayer?.value) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Current player not found.",
        });
      }

      const currentValue = currentPlayer.value;

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
      const [newPlayer] = await Player.aggregate<IPlayer>([
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

      const updatedLineup = await Lineup.findByIdAndUpdate(
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
      const comments = await Comment.aggregate<IComment>([
        {
          $match: matchStage,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        { $limit: (input.limit ?? 10) + 1 },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [
              {
                $project: {
                  username: 1,
                  profileImg: 1,
                  name: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            id: { $toString: "$_id" },
            text: 1,
            user: 1,
            totalVotes: 1,
            votes: 1,
            createdAt: 1,
            thread: {
              $map: {
                input: "$thread",
                as: "t",
                in: {
                  id: { $toString: "$$t._id" },
                  text: "$$t.text",
                  userId: "$$t.userId",
                  votes: "$$t.votes",
                  totalVotes: "$$t.totalVotes",
                },
              },
            },
          },
        },
      ]);
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
      const lineup = await Lineup.findById(input.lineupId);

      if (!lineup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lineup not found.",
        });
      }

      const comment = await Comment.create({
        text: input.text,
        userId: ctx.session.user.id,
        lineupId: input.lineupId,
        votes: [],
        totalVotes: 0,
        thread: [],
      });

      // Populate and return
      const populatedComment = await Comment.findById(comment._id).populate(
        "userId",
        "username name profileImg",
      );

      if (!populatedComment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create comment.",
        });
      }

      const obj = populatedComment.toObject();
      return {
        ...obj,
        id: obj._id?.toString(),
        user: obj.userId,
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
      const comment = await Comment.findOne({
        _id: input.commentId,
        lineupId: input.lineupId,
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found.",
        });
      }
      const userId = new mongoose.Types.ObjectId(ctx.session.user.id);
      comment.thread.push({
        text: input.text,
        userId,
        votes: [],
        totalVotes: 0,
        // _id, userId, createdAt, updatedAt are automatically generated by Mongoose
      } as unknown as IThread);

      await comment.save();

      // Populate and return
      const populatedComment = await Comment.findById(comment._id).populate(
        "userId",
        "username name profileImg",
      );

      if (!populatedComment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add reply.",
        });
      }

      const obj = populatedComment.toObject();
      return {
        ...obj,
        id: obj._id?.toString(),
        user: obj.userId,
        thread: obj.thread?.map((t) => ({
          ...t,
          id: t._id?.toString(),
        })),
      };
    }),

  // Vote on a comment (upvote or downvote)
  voteComment: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        commentId: z.string(),
        type: z.enum(["upvote", "downvote"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await Comment.findOne({
        _id: input.commentId,
        lineupId: input.lineupId,
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found.",
        });
      }

      // Can't vote on your own comment
      if (comment.userId.toString() === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot vote on your own comment.",
        });
      }

      // Process vote using shared helper
      const { totalVotes } = processCommentVote(
        comment.votes,
        ctx.session.user.id,
        input.type,
      );
      comment.totalVotes = totalVotes;

      await comment.save();

      return { totalVotes };
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
      const comment = await Comment.findOne({
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

      // Process vote using shared helper
      const { totalVotes } = processCommentVote(
        thread.votes,
        ctx.session.user.id,
        input.type,
      );
      thread.totalVotes = totalVotes;

      await comment.save();

      return { totalVotes };
    }),
});
