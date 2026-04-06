import { z } from "zod";

export const playerUpsertFields = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  value: z.number().min(1).max(5),
  imgUrl: z.string().url(),
});
