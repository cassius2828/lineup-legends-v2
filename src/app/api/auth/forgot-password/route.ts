import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "~/server/db";
import { sendPasswordResetEmail } from "~/server/email";
import { PasswordResetTokenModel, UserModel } from "~/server/models";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "forgot-password" });

const TOKEN_EXPIRY_MS = 5 * 60 * 1000;

function getBaseUrl(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const genericMessage =
      "If an account with that email exists, a reset link has been sent.";

    await connectDB();

    const user = await UserModel.findOne({ email }).lean();

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
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await PasswordResetTokenModel.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
    });

    const baseUrl = getBaseUrl(request);
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
