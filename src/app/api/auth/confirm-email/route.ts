import { NextResponse } from "next/server";
import { connectDB } from "~/server/db";
import { UserModel } from "~/server/models";
import { redis } from "~/server/redis";
import { redisUserProfileCacheKey } from "~/server/constants";
import { env } from "~/env";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "confirm-email" });

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

    const now = new Date();
    if (
      !user ||
      !user.newEmail ||
      !user.emailConfirmationExpiresAt ||
      user.emailConfirmationExpiresAt < now
    ) {
      return NextResponse.redirect(
        `${env.NEXT_PUBLIC_APP_URL}/profile/settings?error=invalid-token`,
      );
    }

    user.email = user.newEmail;
    user.newEmail = null;
    user.emailConfirmationToken = null;
    user.emailConfirmationExpiresAt = null;
    await user.save();

    await redis.del(redisUserProfileCacheKey(user._id.toString()));

    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/profile/settings?email-updated=true`,
    );
  } catch (error) {
    log.error({ err: error }, "Email confirmation error");
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/profile/settings?error=confirmation-failed`,
    );
  }
}
