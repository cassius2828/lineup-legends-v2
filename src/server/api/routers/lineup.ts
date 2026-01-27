import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { Lineup, Player, Vote, Rating, Comment } from "~/server/models";

const BUDGET_LIMIT = 15;

// Population fields for lineup queries
const lineupPopulateFields = [
  { path: "pgId", model: "Player" },
  { path: "sgId", model: "Player" },
  { path: "sfId", model: "Player" },
  { path: "pfId", model: "Player" },
  { path: "cId", model: "Player" },
  { path: "ownerId", model: "User" },
];

// Helper to transform lineup for API response (rename populated fields)
function transformLineup(lineup: any) {
  if (!lineup) return null;
  const obj = lineup.toObject ? lineup.toObject() : lineup;
  return {
    ...obj,
    id: obj._id?.toString() ?? obj.id,
    pg: obj.pgId,
    sg: obj.sgId,
    sf: obj.sfId,
    pf: obj.pfId,
    c: obj.cId,
    owner: obj.ownerId,
    pgId: obj.pgId?._id?.toString() ?? obj.pgId,
    sgId: obj.sgId?._id?.toString() ?? obj.sgId,
    sfId: obj.sfId?._id?.toString() ?? obj.sfId,
    pfId: obj.pfId?._id?.toString() ?? obj.pfId,
    cId: obj.cId?._id?.toString() ?? obj.cId,
    ownerId: obj.ownerId?._id?.toString() ?? obj.ownerId,
  };
}

// Helper to calculate total votes
async function recalculateTotalVotes(lineupId: string) {
  const votes = await Vote.find({ lineupId });

  let total = 0;
  for (const vote of votes) {
    if (vote.type === "upvote") total += 1;
    if (vote.type === "downvote") total -= 1;
  }

  await Lineup.findByIdAndUpdate(lineupId, { totalVotes: total });

  return total;
}

// Helper to calculate average rating
async function recalculateAvgRating(lineupId: string) {
  const ratings = await Rating.find({ lineupId });

  if (ratings.length === 0) {
    await Lineup.findByIdAndUpdate(lineupId, { avgRating: 0 });
    return 0;
  }

  const sum = ratings.reduce((acc: number, r) => acc + r.value, 0);
  const avg = sum / ratings.length;

  await Lineup.findByIdAndUpdate(lineupId, { avgRating: avg });

  return avg;
}

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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { pgId, sgId, sfId, pfId, cId } = input;
      const playerIds = [pgId, sgId, sfId, pfId, cId];

      // Check for duplicate players
      const uniqueIds = new Set(playerIds);
      if (uniqueIds.size !== playerIds.length) {
        throw new Error("Duplicate players found. Each position must have a unique player.");
      }

      // Fetch all selected players and validate budget
      const players = await Player.find({ _id: { $in: playerIds } });

      if (players.length !== 5) {
        throw new Error("One or more selected players not found.");
      }

      const totalValue = players.reduce((sum, player) => sum + player.value, 0);
      if (totalValue > BUDGET_LIMIT) {
        throw new Error(
          `Lineup exceeds $${BUDGET_LIMIT} budget. Total value: $${totalValue}`
        );
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
      const populatedLineup = await Lineup.findById(lineup._id)
        .populate(lineupPopulateFields);

      return transformLineup(populatedLineup);
    }),

  // Get current user's lineups (protected)
  getByCurrentUser: protectedProcedure
    .input(
      z.object({
        sort: z.enum(["newest", "oldest", "highest-rated", "most-votes"]).optional().default("newest"),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let sortOption: any = { createdAt: -1 };
      
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
      const lineupIds = lineups.map(l => l._id);
      const userVotes = await Vote.find({
        userId: ctx.session.user.id,
        lineupId: { $in: lineupIds },
      });
      const userRatings = await Rating.find({
        userId: ctx.session.user.id,
        lineupId: { $in: lineupIds },
      });

      // Map votes and ratings to lineups
      const voteMap = new Map(userVotes.map(v => [v.lineupId.toString(), v]));
      const ratingMap = new Map(userRatings.map(r => [r.lineupId.toString(), r]));

      return lineups.map(lineup => {
        const transformed = transformLineup(lineup);
        const lineupIdStr = lineup._id.toString();
        return {
          ...transformed,
          votes: voteMap.has(lineupIdStr) ? [voteMap.get(lineupIdStr)] : [],
          ratings: ratingMap.has(lineupIdStr) ? [ratingMap.get(lineupIdStr)] : [],
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
      z.object({
        sort: z.enum(["newest", "oldest", "highest-rated", "most-votes"]).optional().default("newest"),
      }).optional()
    )
    .query(async ({ input }) => {
      let sortOption: any = { createdAt: -1 };
      
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
      const lineup = await Lineup.findById(input.id)
        .populate(lineupPopulateFields);

      return transformLineup(lineup);
    }),

  // Delete a lineup (protected - only owner can delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lineup = await Lineup.findById(input.id);

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      if (lineup.ownerId.toString() !== ctx.session.user.id) {
        throw new Error("You do not have permission to delete this lineup.");
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
        throw new Error("Lineup not found.");
      }

      if (lineup.ownerId.toString() !== ctx.session.user.id) {
        throw new Error("You do not have permission to modify this lineup.");
      }

      // Check if user already has 3 featured lineups
      if (!lineup.featured) {
        const featuredCount = await Lineup.countDocuments({
          ownerId: ctx.session.user.id,
          featured: true,
        });

        if (featuredCount >= 3) {
          throw new Error(
            "Maximum 3 featured lineups allowed. Remove one to add another."
          );
        }
      }

      const updatedLineup = await Lineup.findByIdAndUpdate(
        input.id,
        { featured: !lineup.featured },
        { new: true }
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await Lineup.findById(input.lineupId);

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      // Can't vote on your own lineup
      if (lineup.ownerId.toString() === ctx.session.user.id) {
        throw new Error("You cannot vote on your own lineup.");
      }

      // Check for existing vote
      const existingVote = await Vote.findOne({
        userId: ctx.session.user.id,
        lineupId: input.lineupId,
      });

      if (existingVote) {
        if (existingVote.type === input.type) {
          // Same vote type - remove the vote
          await Vote.findByIdAndDelete(existingVote._id);
        } else {
          // Different vote type - update the vote
          await Vote.findByIdAndUpdate(existingVote._id, { type: input.type });
        }
      } else {
        // No existing vote - create new
        await Vote.create({
          type: input.type,
          userId: ctx.session.user.id,
          lineupId: input.lineupId,
        });
      }

      // Recalculate total votes
      const newTotal = await recalculateTotalVotes(input.lineupId);

      return { totalVotes: newTotal };
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await Lineup.findById(input.lineupId);

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      // Can't rate your own lineup
      if (lineup.ownerId.toString() === ctx.session.user.id) {
        throw new Error("You cannot rate your own lineup.");
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
        { upsert: true, new: true }
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await Lineup.findById(input.lineupId)
        .populate(lineupPopulateFields);

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      if (lineup.ownerId.toString() !== ctx.session.user.id) {
        throw new Error("You do not have permission to edit this lineup.");
      }

      // Get original IDs (handle both populated and non-populated cases)
      const getIdString = (field: any) => {
        if (!field) return null;
        if (typeof field === "string") return field;
        if (field._id) return field._id.toString();
        return field.toString();
      };

      const originalIds = new Set([
        getIdString(lineup.pgId),
        getIdString(lineup.sgId),
        getIdString(lineup.sfId),
        getIdString(lineup.pfId),
        getIdString(lineup.cId),
      ]);
      const newIds = [input.pgId, input.sgId, input.sfId, input.pfId, input.cId];

      // Check for duplicates
      const uniqueNewIds = new Set(newIds);
      if (uniqueNewIds.size !== 5) {
        throw new Error("Duplicate players found. Each position must have a unique player.");
      }

      // Check that we're only rearranging existing players
      for (const id of newIds) {
        if (!originalIds.has(id)) {
          throw new Error("You can only reorder existing players in the lineup.");
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
        { new: true }
      ).populate(lineupPopulateFields);

      return transformLineup(updatedLineup);
    }),

  // ============================================
  // GAMBLING MECHANICS
  // ============================================

  // Gamble a player for a random player of similar value
  gamble: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        position: z.enum(["pg", "sg", "sf", "pf", "c"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await Lineup.findById(input.lineupId)
        .populate(lineupPopulateFields);

      if (!lineup) {
        throw new Error("Lineup not found.");
      }

      if (lineup.ownerId.toString() !== ctx.session.user.id) {
        throw new Error("You do not have permission to gamble on this lineup.");
      }

      // Get the current player at the position
      const positionFieldMap: Record<string, string> = {
        pg: "pgId",
        sg: "sgId",
        sf: "sfId",
        pf: "pfId",
        c: "cId",
      };
      const positionField = positionFieldMap[input.position]!;
      const currentPlayer = (lineup as any)[positionField];
      
      if (!currentPlayer || !currentPlayer.value) {
        throw new Error("Current player not found.");
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

      // Get all player IDs currently in the lineup
      const getIdString = (field: any) => {
        if (!field) return null;
        if (typeof field === "string") return field;
        if (field._id) return field._id.toString();
        return field.toString();
      };

      const currentLineupPlayerIds = [
        getIdString(lineup.pgId),
        getIdString(lineup.sgId),
        getIdString(lineup.sfId),
        getIdString(lineup.pfId),
        getIdString(lineup.cId),
      ].filter(Boolean);

      // Find eligible players (matching value, not already in lineup)
      const eligiblePlayers = await Player.find({
        value: { $in: possibleValues },
        _id: { $nin: currentLineupPlayerIds },
      });

      if (eligiblePlayers.length === 0) {
        throw new Error("No eligible players available for gambling.");
      }

      // Pick a random player
      const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
      const newPlayer = eligiblePlayers[randomIndex]!;

      // Update the lineup with the new player
      const updateData: any = {
        [positionField]: newPlayer._id,
        $inc: { timesGambled: 1 },
      };

      const updatedLineup = await Lineup.findByIdAndUpdate(
        input.lineupId,
        updateData,
        { new: true }
      ).populate(lineupPopulateFields);

      return {
        lineup: transformLineup(updatedLineup),
        previousPlayer: currentPlayer.toObject ? currentPlayer.toObject() : currentPlayer,
        newPlayer: newPlayer.toObject(),
      };
    }),

  // ============================================
  // COMMENT SYSTEM
  // ============================================

  // Get comments for a lineup
  getComments: publicProcedure
    .input(z.object({ lineupId: z.string() }))
    .query(async ({ input }) => {
      const comments = await Comment.find({ lineupId: input.lineupId })
        .sort({ createdAt: -1 })
        .populate("userId", "username name profileImg");

      return comments.map((comment) => {
        const obj = comment.toObject();
        return {
          ...obj,
          id: obj._id?.toString(),
          user: obj.userId,
          thread: obj.thread?.map((t: any) => ({
            ...t,
            id: t._id?.toString(),
          })),
        };
      });
    }),

  // Add a comment to a lineup
  addComment: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        text: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lineup = await Lineup.findById(input.lineupId);

      if (!lineup) {
        throw new Error("Lineup not found.");
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
        "username name profileImg"
      );

      if (!populatedComment) {
        throw new Error("Failed to create comment.");
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await Comment.findOne({
        _id: input.commentId,
        lineupId: input.lineupId,
      });

      if (!comment) {
        throw new Error("Comment not found.");
      }

      comment.thread.push({
        text: input.text,
        userId: ctx.session.user.id,
        votes: [],
        totalVotes: 0,
      } as any);

      await comment.save();

      // Populate and return
      const populatedComment = await Comment.findById(comment._id).populate(
        "userId",
        "username name profileImg"
      );

      if (!populatedComment) {
        throw new Error("Failed to add reply.");
      }

      const obj = populatedComment.toObject();
      return {
        ...obj,
        id: obj._id?.toString(),
        user: obj.userId,
        thread: obj.thread?.map((t: any) => ({
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await Comment.findOne({
        _id: input.commentId,
        lineupId: input.lineupId,
      });

      if (!comment) {
        throw new Error("Comment not found.");
      }

      // Can't vote on your own comment
      if (comment.userId.toString() === ctx.session.user.id) {
        throw new Error("You cannot vote on your own comment.");
      }

      // Find existing vote
      const existingVoteIndex = comment.votes.findIndex(
        (v) => v.userId.toString() === ctx.session.user.id
      );

      if (existingVoteIndex !== -1) {
        const existingVote = comment.votes[existingVoteIndex]!;
        const isUpvote = input.type === "upvote";
        const wasUpvote = existingVote.upvote;

        if ((isUpvote && wasUpvote) || (!isUpvote && existingVote.downvote)) {
          // Same vote type - remove the vote
          comment.votes.splice(existingVoteIndex, 1);
        } else {
          // Different vote type - toggle
          existingVote.upvote = isUpvote;
          existingVote.downvote = !isUpvote;
        }
      } else {
        // No existing vote - create new
        comment.votes.push({
          userId: ctx.session.user.id,
          upvote: input.type === "upvote",
          downvote: input.type === "downvote",
        } as any);
      }

      // Recalculate total votes
      let total = 0;
      for (const vote of comment.votes) {
        if (vote.upvote) total += 1;
        if (vote.downvote) total -= 1;
      }
      comment.totalVotes = total;

      await comment.save();

      return { totalVotes: total };
    }),

  // Vote on a thread reply
  voteThread: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        commentId: z.string(),
        threadId: z.string(),
        type: z.enum(["upvote", "downvote"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await Comment.findOne({
        _id: input.commentId,
        lineupId: input.lineupId,
      });

      if (!comment) {
        throw new Error("Comment not found.");
      }

      const thread = comment.thread.find(
        (t) => t._id.toString() === input.threadId
      );

      if (!thread) {
        throw new Error("Thread reply not found.");
      }

      // Can't vote on your own thread
      if (thread.userId.toString() === ctx.session.user.id) {
        throw new Error("You cannot vote on your own reply.");
      }

      // Find existing vote
      const existingVoteIndex = thread.votes.findIndex(
        (v) => v.userId.toString() === ctx.session.user.id
      );

      if (existingVoteIndex !== -1) {
        const existingVote = thread.votes[existingVoteIndex]!;
        const isUpvote = input.type === "upvote";
        const wasUpvote = existingVote.upvote;

        if ((isUpvote && wasUpvote) || (!isUpvote && existingVote.downvote)) {
          // Same vote type - remove the vote
          thread.votes.splice(existingVoteIndex, 1);
        } else {
          // Different vote type - toggle
          existingVote.upvote = isUpvote;
          existingVote.downvote = !isUpvote;
        }
      } else {
        // No existing vote - create new
        thread.votes.push({
          userId: ctx.session.user.id,
          upvote: input.type === "upvote",
          downvote: input.type === "downvote",
        } as any);
      }

      // Recalculate total votes for thread
      let total = 0;
      for (const vote of thread.votes) {
        if (vote.upvote) total += 1;
        if (vote.downvote) total -= 1;
      }
      thread.totalVotes = total;

      await comment.save();

      return { totalVotes: total };
    }),
});
