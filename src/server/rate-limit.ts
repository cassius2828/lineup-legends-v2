import { redis } from "./redis";

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; remaining: number }> {
  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, windowSec);
  return { ok: current <= limit, remaining: Math.max(0, limit - current) };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}
