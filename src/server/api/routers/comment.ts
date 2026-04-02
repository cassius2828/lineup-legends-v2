import { TRPCError } from "@trpc/server";
import mongoose from "mongoose";
import { z } from "zod";
import { getVoteDelta } from "~/lib/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { CommentModel, CommentVoteModel } from "~/server/models";
import { ThreadModel } from "~/server/models/threads";
import { ThreadVoteModel } from "~/server/models/threadVotes";

export const commentRouter = createTRPCRouter({
  getComments: publicProcedure
    .input(
      z.object({
        lineupId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
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

      if (comment.user.toString() === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot vote on your own comment.",
        });
      }

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

      return { totalVotes: updatedThread?.totalVotes ?? 0 };
    }),
});
