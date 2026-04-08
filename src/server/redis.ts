import { Redis } from "ioredis";
import { env } from "~/env.js";

export const redis = ((globalThis as unknown as { redis: Redis }).redis ??=
  new Redis(env.REDIS_URL)) as Redis;
