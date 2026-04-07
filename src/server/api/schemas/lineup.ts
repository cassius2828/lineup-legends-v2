import { z } from "zod";

export const playerSchema = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  imgUrl: z.string(),
  value: z.number(),
});

export const lineupSortSchema = z
  .enum(["newest", "oldest", "highest-rated", "most-rated"])
  .optional();
