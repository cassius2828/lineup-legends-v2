import { Redis } from "ioredis";
import { env } from "~/env.js";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "redis" });

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedis(): Redis {
  if (globalForRedis.redis) return globalForRedis.redis;

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 1500,
    commandTimeout: 1500,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 10) return 5000;
      return Math.min(times * 200, 2000);
    },
  });

  client.on("error", (err) => {
    log.warn({ err }, "Redis connection error");
  });

  globalForRedis.redis = client;
  return client;
}

export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return Reflect.get(createRedis(), prop);
  },
});

/** Cache-only read: returns null on Redis errors so callers can fall back to Mongo. */
export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch (err) {
    log.warn({ err, key }, "Redis cache get failed");
    return null;
  }
}

/** Cache-only write: swallows Redis errors so a dead cache cannot fail the request. */
export async function cacheSetex(
  key: string,
  ttlSeconds: number,
  value: string,
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, value);
  } catch (err) {
    log.warn({ err, key }, "Redis cache set failed");
  }
}

/** Cache-only delete: swallows Redis errors so invalidation cannot fail the request. */
export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    log.warn({ err, key }, "Redis cache del failed");
  }
}
