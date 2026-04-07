import { z } from "zod";

export const cursorPaginationSchema = z.object({
  limit: z.number().optional(),
  cursor: z.string().optional(),
});
