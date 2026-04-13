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

      const bookmarks = await BookmarkModel.find({
        user: ctx.session.user.id,
      })
        .sort({ createdAt: sortDir })
        .select("lineup")
        .lean();

      const lineupIds = bookmarks.map((b) => b.lineup);
      if (lineupIds.length === 0) {
        return populated({ lineups: [], hasMore: false, cursor: undefined });
      }

      const base = { _id: { $in: lineupIds } };
      const filter = buildLineupFilter(input, base);

      const data = await LineupModel.find(filter)
        .sort({ createdAt: sortDir })
        .skip(skip)
        .limit(limit + 1)
        .populate(lineupPopulateFields)
        .lean();

      const hasMore = data.length > limit;
      const lineups = hasMore ? data.slice(0, limit) : data;

      return populated({
        lineups,
        hasMore,
        cursor: hasMore ? String(skip + limit) : undefined,
      });
    }),
});
