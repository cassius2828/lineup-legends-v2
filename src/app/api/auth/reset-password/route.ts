import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "~/server/db";
import { PasswordResetTokenModel, UserModel } from "~/server/models";
import { BCRYPT_ROUNDS } from "~/server/constants";
import { hashSha256Hex } from "~/server/tokens";
import { validatePassword } from "~/lib/password-validation";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "reset-password" });

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
    };
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        {
          error: "Token and password are required",
          code: "VALIDATION_ERROR" as const,
        },
        { status: 400 },
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "Password is too long", code: "VALIDATION_ERROR" as const },
        { status: 400 },
      );
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters with one number and one special character",
          code: "VALIDATION_ERROR" as const,
        },
        { status: 400 },
      );
    }

    await connectDB();

    const hashedToken = hashSha256Hex(token);

    const resetToken = await PasswordResetTokenModel.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!resetToken) {
      return NextResponse.json(
        {
          error: "Invalid or expired reset link. Please request a new one.",
          code: "INVALID_OR_EXPIRED_TOKEN" as const,
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await UserModel.updateOne(
      { _id: resetToken.userId },
      { $set: { password: hashedPassword } },
    );

    await PasswordResetTokenModel.deleteMany({ userId: resetToken.userId });

    return NextResponse.json({
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    log.error({ err: error }, "Reset password error");
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
