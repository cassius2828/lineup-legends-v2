import { TRPCError } from "@trpc/server";
import mongoose from "mongoose";
import { z } from "zod";
import { getVoteDelta } from "~/lib/utils";
import {
  commentBodySchema,
  threadBodySchema,
} from "~/server/api/schemas/comment";
import { voteTypeSchema } from "~/server/api/schemas/common";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  CommentModel,
  CommentVoteModel,
  ContentFlagModel,
} from "~/server/models";
import { ThreadModel } from "~/server/models/threads";
import { ThreadVoteModel } from "~/server/models/threadVotes";
import { censorText } from "~/server/lib/censor";
import {
  paginatedCommentsOutput,
  paginatedThreadsOutput,
  addCommentResultOutput,
  addThreadResultOutput,
  voteMapOutput,
  populated,
} from "~/server/api/schemas/output";

export const commentRouter = createTRPCRouter({
  getComments: publicProcedure
    .input(
      z.object({
        lineupId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      }),
    )
    .output(paginatedCommentsOutput)
    .query(async ({ input }) => {
      const matchStage: Record<string, unknown> = {
        lineup: new mongoose.Types.ObjectId(input.lineupId),
      };
      if (input.cursor) {
        matchStage._id = { $gt: new mongoose.Types.ObjectId(input.cursor) };
      }
      const limit = input.limit ?? 10;
      const comments = await CommentModel.find(matchStage)
        .sort({ createdAt: 1 })
        .limit(limit + 1)
        .populate({ path: "user", select: "name username image profileImg" })
        .lean();
      const hasMore = comments.length > limit;
      if (hasMore) comments.pop();

      const commentIds = comments.map((c) => c._id);
      const threadCounts = await ThreadModel.aggregate<{
        _id: mongoose.Types.ObjectId;
        count: number;
      }>([
        { $match: { comment: { $in: commentIds } } },
        { $group: { _id: "$comment", count: { $sum: 1 } } },
      ]);
      const threadCountMap = new Map(
        threadCounts.map((tc) => [tc._id.toString(), tc.count]),
      );

      const commentsWithThreadCount = comments.map((c) => ({
        ...c,
        threadCount: threadCountMap.get(c._id.toString()) ?? 0,
      }));

      return populated({
        comments: commentsWithThreadCount,
        hasMore,
        cursor: comments[comments.length - 1]?._id?.toString(),
      });
    }),

  getThreads: publicProcedure
    .input(
      z.object({
        commentId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      }),
    )
    .output(paginatedThreadsOutput)
    .query(async ({ input }) => {
      const matchStage: Record<string, unknown> = {
        comment: new mongoose.Types.ObjectId(input.commentId),
      };
      if (input.cursor) {
        matchStage._id = { $gt: new mongoose.Types.ObjectId(input.cursor) };
      }
      const limit = input.limit ?? 10;
      const threads = await ThreadModel.find(matchStage)
        .sort({ createdAt: 1 })
        .limit(limit + 1)
        .populate({ path: "user", select: "name username image profileImg" })
        .lean();
      const hasMore = threads.length > limit;
      if (hasMore) threads.pop();
      return populated({
        threads,
        hasMore,
        cursor: threads[threads.length - 1]?._id?.toString(),
      });
    }),

  getCommentCount: publicProcedure
    .input(z.object({ lineupId: z.string() }))
    .output(
      z.object({
        total: z.number(),
        comments: z.number(),
        threads: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const lineupOid = new mongoose.Types.ObjectId(input.lineupId);

      const commentIds = await CommentModel.find({ lineup: lineupOid })
        .select("_id")
        .lean();

      const [commentCount, threadCount] = await Promise.all([
        Promise.resolve(commentIds.length),
        ThreadModel.countDocuments({
          comment: { $in: commentIds.map((c) => c._id) },
        }),
      ]);

      return {
        total: commentCount + threadCount,
        comments: commentCount,
        threads: threadCount,
      };
    }),

  getMyCommentVotes: protectedProcedure
    .input(z.object({ lineupId: z.string() }))
    .output(voteMapOutput)
    .query(async ({ ctx, input }) => {
      const commentIds = await CommentModel.find({
        lineup: new mongoose.Types.ObjectId(input.lineupId),
      })
        .select("_id")
        .lean();

      const votes = await CommentVoteModel.find({
        user: ctx.session.user.id,
        comment: { $in: commentIds.map((c) => c._id) },
      })
        .select("comment type")
        .lean();

      const voteMap: Record<string, "upvote" | "downvote"> = {};
      for (const v of votes) {
        voteMap[v.comment.toString()] = v.type;
      }
      return voteMap;
    }),

  getMyThreadVotes: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .output(voteMapOutput)
    .query(async ({ ctx, input }) => {
      const threadIds = await ThreadModel.find({
        comment: new mongoose.Types.ObjectId(input.commentId),
      })
        .select("_id")
        .lean();

      const votes = await ThreadVoteModel.find({
        user: ctx.session.user.id,
        thread: { $in: threadIds.map((t) => t._id) },
      })
        .select("thread type")
        .lean();

      const voteMap: Record<string, "upvote" | "downvote"> = {};
      for (const v of votes) {
        voteMap[v.thread.toString()] = v.type;
      }
      return voteMap;
    }),

  addComment: protectedProcedure
    .input(commentBodySchema)
    .output(addCommentResultOutput)
    .mutation(async ({ ctx, input }) => {
      const rawText = input.text.trim();
      const censored = censorText(rawText);

      const comment = await CommentModel.create({
        text: censored.cleaned || null,
        user: ctx.session.user.id,
        lineup: input.lineupId,
        image: input.image ?? null,
        gif: input.gif ?? null,
      });

      if (censored.flagged) {
        await ContentFlagModel.create({
          contentType: "comment",
          contentId: comment._id,
          userId: ctx.session.user.id,
          originalText: rawText,
          censoredText: censored.cleaned,
          flaggedWords: censored.flaggedWords,
        });
      }

      return populated({
        ...comment.toObject(),
        user: {
          username: ctx.session.user.username,
          name: ctx.session.user.name,
          profileImg: ctx.session.user.profileImg,
          image: ctx.session.user.image,
        },
      });
    }),

  addThreadReply: protectedProcedure
    .input(threadBodySchema)
    .output(addThreadResultOutput)
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
      const rawText = input.text.trim();
      const censored = censorText(rawText);

      const newThreadReply = await ThreadModel.create({
        text: censored.cleaned || null,
        user: ctx.session.user.id,
        comment: new mongoose.Types.ObjectId(input.commentId),
        image: input.image ?? null,
        gif: input.gif ?? null,
      });

      if (censored.flagged) {
        await ContentFlagModel.create({
          contentType: "thread",
          contentId: newThreadReply._id,
          userId: ctx.session.user.id,
          originalText: rawText,
          censoredText: censored.cleaned,
          flaggedWords: censored.flaggedWords,
        });
      }

      return populated({
        ...newThreadReply.toObject(),
        user: {
          username: ctx.session.user.username,
          name: ctx.session.user.name,
          profileImg: ctx.session.user.profileImg,
          image: ctx.session.user.image,
        },
      });
    }),

  deleteComment: protectedProcedure
    .input(z.object({ lineupId: z.string(), commentId: z.string() }))
    .output(z.object({ deleted: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await CommentModel.findOne({
        _id: input.commentId,
        lineup: new mongoose.Types.ObjectId(input.lineupId),
      })
        .select("user")
        .lean();

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found.",
        });
      }
      if (comment.user.toString() !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments.",
        });
      }

      const threadIds = await ThreadModel.find({ comment: comment._id })
        .select("_id")
        .lean();

      await Promise.all([
        CommentModel.deleteOne({ _id: comment._id }),
        ThreadModel.deleteMany({ comment: comment._id }),
        CommentVoteModel.deleteMany({ comment: comment._id }),
        ThreadVoteModel.deleteMany({
          thread: { $in: threadIds.map((t) => t._id) },
        }),
      ]);

      return { deleted: true };
    }),

  deleteThread: protectedProcedure
    .input(z.object({ commentId: z.string(), threadId: z.string() }))
    .output(z.object({ deleted: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const thread = await ThreadModel.findById(input.threadId)
        .select("user comment")
        .lean();

      if (!thread) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reply not found." });
      }
      if (thread.user.toString() !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own replies.",
        });
      }

      await Promise.all([
        ThreadModel.deleteOne({ _id: thread._id }),
        ThreadVoteModel.deleteMany({ thread: thread._id }),
      ]);

      return { deleted: true };
    }),

  voteComment: protectedProcedure
    .input(
      z.object({
        lineupId: z.string(),
        commentId: z.string(),
        type: voteTypeSchema,
      }),
    )
    .output(z.object({ totalVotes: z.number() }))
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
        type: voteTypeSchema,
      }),
    )
    .output(z.object({ totalVotes: z.number() }))
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
