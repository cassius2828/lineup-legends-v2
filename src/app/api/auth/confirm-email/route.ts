import { NextResponse } from "next/server";
import { connectDB } from "~/server/db";
import { UserModel } from "~/server/models";
import { redis } from "~/server/redis";
import { env } from "~/env";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_APP_URL}/profile/settings?error=invalid-token`,
      );
    }

    await connectDB();

    const user = await UserModel.findOne({ emailConfirmationToken: token });

    if (!user || !user.newEmail) {
      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_APP_URL}/profile/settings?error=invalid-token`,
      );
    }

    user.email = user.newEmail;
    user.newEmail = null;
    user.emailConfirmationToken = null;
    await user.save();

    await redis.del(`user:${user._id.toString()}`);

    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/profile/settings?email-updated=true`,
    );
  } catch (error) {
    console.error("Email confirmation error:", error);
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/profile/settings?error=confirmation-failed`,
    );
  }
}
