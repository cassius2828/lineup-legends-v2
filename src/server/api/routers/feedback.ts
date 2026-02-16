import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { FeedbackModel } from "~/server/models";
import { sendFeedbackEmail } from "~/server/email";

export const feedbackRouter = createTRPCRouter({
  // Submit feedback (public — no auth required)
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email().max(255),
        subject: z.string().min(1).max(200),
        message: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ input }) => {
      const feedback = await FeedbackModel.create({
        name: input.name.trim(),
        email: input.email.trim(),
        subject: input.subject.trim(),
        message: input.message.trim(),
      });

      // Send email notification (non-blocking — don't fail the request if email fails)
      try {
        await sendFeedbackEmail({
          name: input.name.trim(),
          email: input.email.trim(),
          subject: input.subject.trim(),
          message: input.message.trim(),
        });
      } catch (error) {
        console.error("Email notification failed, feedback still saved:", error);
      }

      return {
        id: feedback._id.toHexString(),
        success: true,
      };
    }),

  // Get all feedback (admin only — for future admin dashboard)
  getAll: adminProcedure
    .input(
      z
        .object({
          status: z.enum(["new", "read", "resolved"]).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const filter = input?.status ? { status: input.status } : {};
      const feedbacks = await FeedbackModel.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      return feedbacks.map((f) => ({
        ...f,
        id: f._id.toHexString(),
      }));
    }),

  // Update feedback status (admin only — for future admin dashboard)
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["new", "read", "resolved"]),
      }),
    )
    .mutation(async ({ input }) => {
      const feedback = await FeedbackModel.findByIdAndUpdate(
        input.id,
        { status: input.status },
        { new: true },
      );

      if (!feedback) {
        throw new Error("Feedback not found");
      }

      return {
        id: feedback._id.toHexString(),
        status: feedback.status,
      };
    }),
});
