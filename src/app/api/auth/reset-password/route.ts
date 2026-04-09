import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "~/server/db";
import { PasswordResetTokenModel, UserModel } from "~/server/models";
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
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters with one number and one special character",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetToken = await PasswordResetTokenModel.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

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
