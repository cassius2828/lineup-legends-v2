import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "~/server/db";
import { UserModel } from "~/server/models";
import { rateLimit, getClientIp } from "~/server/rate-limit";

const schema = z.object({
  identifier: z.string().min(1).max(255),
});

export async function POST(request: Request) {
  const { ok } = await rateLimit(
    `rl:check-ban:${getClientIp(request)}`,
    10,
    60,
  );
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const json: unknown = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "ok" });
  }

  const { identifier } = parsed.data;
  await connectDB();

  const isEmail = identifier.includes("@");
  const query = isEmail
    ? { email: identifier.toLowerCase() }
    : { username: identifier.toLowerCase() };

  const user = await UserModel.findOne(query)
    .select("banned bannedAt banReason suspendedUntil suspensionCount")
    .lean();

  if (!user) {
    return NextResponse.json({ status: "ok" });
  }

  if (user.banned) {
    return NextResponse.json({
      status: "banned",
      reason: user.banReason ?? "Violation of community guidelines",
      bannedAt: user.bannedAt?.toISOString() ?? null,
      suspensionCount: user.suspensionCount ?? 0,
    });
  }

  if (user.suspendedUntil && user.suspendedUntil > new Date()) {
    return NextResponse.json({
      status: "suspended",
      reason: user.banReason ?? "Violation of community guidelines",
      suspendedUntil: user.suspendedUntil.toISOString(),
      suspensionCount: user.suspensionCount ?? 0,
    });
  }

  return NextResponse.json({ status: "ok" });
}
