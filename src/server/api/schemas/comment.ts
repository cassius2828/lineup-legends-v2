import { z } from "zod";

const attachmentRefinements = <
  T extends z.ZodTypeAny & {
    _output: { text: string; image?: string | null; gif?: string | null };
  },
>(
  schema: T,
) =>
  schema
    .refine(
      (d: { text: string; image?: string | null; gif?: string | null }) =>
        d.text.trim().length > 0 || !!d.image || !!d.gif,
      { message: "Must have text or an attachment" },
    )
    .refine(
      (d: { image?: string | null; gif?: string | null }) =>
        !(d.image && d.gif),
      { message: "Only one attachment type allowed" },
    );

const baseCommentFields = {
  lineupId: z.string(),
  text: z.string().max(1000).default(""),
  image: z.string().url().nullish(),
  gif: z.string().url().nullish(),
};

export const commentBodySchema = attachmentRefinements(
  z.object(baseCommentFields),
);

export const threadBodySchema = attachmentRefinements(
  z.object({
    ...baseCommentFields,
    commentId: z.string(),
  }),
);
