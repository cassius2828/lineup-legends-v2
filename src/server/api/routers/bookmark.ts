import mongoose from "mongoose";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { BookmarkModel, LineupModel } from "~/server/models";
import { lineupPopulateFields } from "~/server/lib/lineup-queries";
import { paginatedLineupsOutput, populated } from "~/server/api/schemas/output";
import { lineupFilterInput } from "~/server/api/schemas/lineup-filter";
import { buildLineupFilter } from "~/server/services/lineup";

export const bookmarkRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ lineupId: z.string() }))
    .output(z.object({ bookmarked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await BookmarkModel.findOne({
        user: userId,
        lineup: input.lineupId,
      }).lean();

      if (existing) {
        await BookmarkModel.deleteOne({ _id: existing._id });
        return { bookmarked: false };
      }

      await BookmarkModel.create({
        user: userId,
        lineup: input.lineupId,
      });

      return { bookmarked: true };
    }),

  isBookmarked: protectedProcedure
    .input(z.object({ lineupId: z.string() }))
    .output(z.object({ bookmarked: z.boolean() }))
    .query(async ({ ctx, input }) => {
      const existing = await BookmarkModel.findOne({
        user: ctx.session.user.id,
        lineup: input.lineupId,
      }).lean();

      return { bookmarked: !!existing };
    }),

  getBookmarkedLineups: protectedProcedure
    .output(paginatedLineupsOutput)
    .input(lineupFilterInput)
    .query(async ({ ctx, input }) => {
      const sortDir = input.sort === "oldest" ? 1 : -1;
      const skip = input.cursor ? parseInt(input.cursor, 10) : 0;
      const limit = input.limit;

      const pipeline: mongoose.PipelineStage[] = [
        {
          $match: {
            user: new mongoose.Types.ObjectId(ctx.session.user.id),
          },
        },
        { $sort: { createdAt: sortDir as 1 | -1 } },
        { $skip: skip },
        { $limit: limit + 1 },
        {
          $lookup: {
            from: "lineups",
            localField: "lineup",
            foreignField: "_id",
            as: "lineupDoc",
          },
        },
        { $unwind: "$lineupDoc" },
        { $replaceRoot: { newRoot: "$lineupDoc" } },
      ];

      const filterMatch = buildLineupFilter(input);
      if (Object.keys(filterMatch).length > 0) {
        pipeline.push({ $match: filterMatch });
      }

      const data = await BookmarkModel.aggregate(pipeline);

      const populatedData = await LineupModel.populate(
        data,
        lineupPopulateFields,
      );

      const hasMore = populatedData.length > limit;
      const lineups = hasMore ? populatedData.slice(0, limit) : populatedData;

      return populated({
        lineups,
        hasMore,
        cursor: hasMore ? String(skip + limit) : undefined,
      });
    }),
});
