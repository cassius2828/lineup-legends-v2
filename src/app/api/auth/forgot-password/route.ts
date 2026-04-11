import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "~/server/db";
import { sendPasswordResetEmail } from "~/server/email";
import { PasswordResetTokenModel, UserModel } from "~/server/models";
import { PASSWORD_RESET_TTL_MS } from "~/server/constants";
import { hashSha256Hex } from "~/server/tokens";
import { env } from "~/env";
import { rateLimit, getClientIp } from "~/server/rate-limit";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "forgot-password" });

export async function POST(request: Request) {
  try {
    const { ok } = await rateLimit(
      `rl:forgot-password:${getClientIp(request)}`,
      5,
      900,
    );
    if (!ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const genericMessage =
      "If an account with that email exists, a reset link has been sent.";

    await connectDB();

    const user = await UserModel.findOne({ email }).select("+password").lean();

    if (!user) {
      log.info({ email }, "Password reset requested for non-existent email");
      return NextResponse.json({ message: genericMessage });
    }

    if (!user.password) {
      log.info({ email }, "Password reset requested for OAuth-only account");
      return NextResponse.json(
        {
          error:
            "This account uses Google sign-in and doesn't have a password yet. Please sign in with Google, then create a password in your profile settings.",
          code: "OAUTH_ONLY",
        },
        { status: 400 },
      );
    }

    await PasswordResetTokenModel.deleteMany({ userId: user._id });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashSha256Hex(rawToken);

    await PasswordResetTokenModel.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    });

    const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({ to: email, resetUrl });
    log.info({ email }, "Password reset email sent successfully");

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    log.error({ err: error }, "Forgot password error");
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
