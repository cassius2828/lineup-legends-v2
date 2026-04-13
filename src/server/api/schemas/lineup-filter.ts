import { z } from "zod";

export const mongoIdString = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

export const lineupFilterInput = z.object({
  sort: z
    .enum(["newest", "oldest", "highest-rated", "most-rated"])
    .optional()
    .default("newest"),
  limit: z.number().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minRating: z.number().min(0).max(10).optional(),
  filterUserId: mongoIdString.optional(),
});

export type LineupFilterInput = z.infer<typeof lineupFilterInput>;
