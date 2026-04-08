import { Redis } from "ioredis";
import { env } from "~/env.js";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedis(): Redis {
  return (globalForRedis.redis ??= new Redis(env.REDIS_URL));
}

export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return Reflect.get(createRedis(), prop);
  },
});
