import { z } from "zod";

const ALLOWED_GIF_HOSTS = [".giphy.com"];
const ALLOWED_IMAGE_HOSTS = [".cloudfront.net"];

function isAllowedHost(url: string, hosts: string[]): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:") return false;
    return hosts.some((h) =>
      h.startsWith(".") ? hostname.endsWith(h) : hostname === h,
    );
  } catch {
    return false;
  }
}

const gifUrl = z
  .string()
  .url()
  .refine((u) => isAllowedHost(u, ALLOWED_GIF_HOSTS), {
    message: "GIF must be from a trusted source",
  })
  .nullish();

const imageUrl = z
  .string()
  .url()
  .refine((u) => isAllowedHost(u, ALLOWED_IMAGE_HOSTS), {
    message: "Image must be from a trusted source",
  })
  .nullish();

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
  image: imageUrl,
  gif: gifUrl,
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
