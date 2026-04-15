import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { feedbackStatusSchema } from "~/server/api/schemas/feedback";
import { FeedbackModel } from "~/server/models";
import { censorText, flagContent } from "~/server/lib/censor";
import { sendFeedbackEmail } from "~/server/email";
import { logger } from "~/lib/logger";
import { feedbackListItemOutput, populated } from "~/server/api/schemas/output";

const log = logger.child({ module: "feedback" });

export const feedbackRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email().max(255).optional(),
        subject: z.string().min(1).max(200),
        message: z.string().min(1).max(2000),
      }),
    )
    .output(z.object({ id: z.string(), success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const email = ctx.session?.user?.email ?? input.email;
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An email address is required to submit feedback",
        });
      }

      const subjectCensored = censorText(input.subject.trim());
      const messageCensored = censorText(input.message.trim());

      const feedback = await FeedbackModel.create({
        name: input.name.trim(),
        email,
        subject: subjectCensored.cleaned,
        message: messageCensored.cleaned,
      });

      if (subjectCensored.flagged || messageCensored.flagged) {
        await flagContent({
          raw: `${input.subject.trim()}\n---\n${input.message.trim()}`,
          result: {
            cleaned: `${subjectCensored.cleaned}\n---\n${messageCensored.cleaned}`,
            flagged: true,
            flaggedWords: [
              ...new Set([
                ...subjectCensored.flaggedWords,
                ...messageCensored.flaggedWords,
              ]),
            ],
          },
          contentType: "feedback",
          contentId: feedback._id,
          userId: ctx.session?.user?.id ?? null,
        });
      }

      try {
        await sendFeedbackEmail({
          name: input.name.trim(),
          email,
          subject: subjectCensored.cleaned,
          message: messageCensored.cleaned,
        });
      } catch (error) {
        log.error(
          { err: error },
          "Email notification failed, feedback still saved",
        );
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
          status: feedbackStatusSchema.optional(),
        })
        .optional(),
    )
    .output(z.array(feedbackListItemOutput))
    .query(async ({ input }) => {
      const filter = input?.status ? { status: input.status } : {};
      const feedbacks = await FeedbackModel.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      return populated(
        feedbacks.map((f) => ({
          ...f,
          id: f._id.toHexString(),
        })),
      );
    }),

  // Update feedback status (admin only — for future admin dashboard)
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: feedbackStatusSchema,
      }),
    )
    .output(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ input }) => {
      const feedback = await FeedbackModel.findByIdAndUpdate(
        input.id,
        { status: input.status },
        { returnDocument: "after" },
      );

      if (!feedback) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feedback not found",
        });
      }

      return {
        id: feedback._id.toHexString(),
        status: feedback.status,
      };
    }),
});
