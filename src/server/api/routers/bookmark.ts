import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { BookmarkModel, LineupModel } from "~/server/models";
import { lineupPopulateFields } from "~/server/lib/lineup-queries";
import { lineupOutput, populated } from "~/server/api/schemas/output";

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
    .output(z.array(lineupOutput))
    .input(
      z
        .object({
          sort: z
            .enum(["newest", "oldest"])
            .optional()
            .default("newest"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const sortDir = input?.sort === "oldest" ? 1 : -1;

      const bookmarks = await BookmarkModel.find({
        user: ctx.session.user.id,
      })
        .sort({ createdAt: sortDir })
        .select("lineup")
        .lean();

      const lineupIds = bookmarks.map((b) => b.lineup);

      if (lineupIds.length === 0) return [];

      const lineups = await LineupModel.find({ _id: { $in: lineupIds } })
        .populate(lineupPopulateFields)
        .lean();

      const idOrder = new Map(
        lineupIds.map((id, i) => [id.toString(), i]),
      );
      lineups.sort(
        (a, b) =>
          (idOrder.get(a._id.toString()) ?? 0) -
          (idOrder.get(b._id.toString()) ?? 0),
      );

      return populated(lineups);
    }),
});
