import { z } from "zod";

export const idInputSchema = z.object({ id: z.string() });

export const lineupIdInputSchema = z.object({ lineupId: z.string() });

export const voteTypeSchema = z.enum(["upvote", "downvote"]);
