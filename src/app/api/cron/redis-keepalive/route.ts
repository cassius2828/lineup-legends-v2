import crypto from "crypto";
import { NextResponse } from "next/server";
import { env } from "~/env";
import { REDIS_KEEPALIVE_KEY } from "~/server/constants";
import { redis } from "~/server/redis";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "redis-keepalive" });

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAuthorized(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  return timingSafeEqualString(header.slice("Bearer ".length), secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timestamp = new Date().toISOString();

  try {
    await redis.set(REDIS_KEEPALIVE_KEY, timestamp);
    log.info({ timestamp }, "Redis keepalive wrote");
    return NextResponse.json({ ok: true, timestamp });
  } catch (error) {
    log.error({ err: error }, "Redis keepalive failed");
    return NextResponse.json({ error: "Redis keepalive failed" }, { status: 500 });
  }
}
