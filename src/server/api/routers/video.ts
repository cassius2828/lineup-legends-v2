import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { VideoModel } from "~/server/models";
import { extractYouTubeId, fetchYouTubeMetadata } from "~/server/lib/youtube";

export const videoRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    const videos = await VideoModel.find().sort({ createdAt: -1 }).lean();
    return videos.map((v) => ({
      ...v,
      id: v._id.toHexString(),
      addedBy: v.addedBy.toHexString(),
    }));
  }),

  create: adminProcedure
    .input(z.object({ url: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const youtubeId = extractYouTubeId(input.url);
      if (!youtubeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid YouTube URL",
        });
      }

      const existing = await VideoModel.findOne({ youtubeId }).lean();
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This video has already been added",
        });
      }

      const meta = await fetchYouTubeMetadata(youtubeId);

      const video = await VideoModel.create({
        youtubeId: meta.youtubeId,
        title: meta.title,
        description: meta.description,
        thumbnailUrl: meta.thumbnailUrl,
        duration: meta.duration,
        timestamps: meta.timestamps,
        addedBy: ctx.session.user.id,
      });

      return {
        id: video._id.toHexString(),
        title: video.title,
      };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const video = await VideoModel.findByIdAndDelete(input.id);
      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found",
        });
      }
      return { success: true };
    }),
});
