import { z } from "zod";

export const feedbackStatusSchema = z.enum(["new", "read", "resolved"]);
