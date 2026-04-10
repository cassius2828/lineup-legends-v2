import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/server/db";
import { UserModel, PasskeyModel } from "~/server/models";
import { redis } from "~/server/redis";
import { generateMfaCode, getWebAuthnRpId } from "~/server/mfa";
import { sendMfaCode } from "~/server/email";
import {
  MFA_CODE_TTL_SECONDS,
  redisMfaCodeKey,
  redisWebauthnChallengeKey,
  WEBAUTHN_CHALLENGE_TTL_SECONDS,
} from "~/server/constants";
import { rateLimit, getClientIp } from "~/server/rate-limit";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "send-mfa-code" });

interface SendCodeBody {
  method: "email" | "passkey";
}

export async function POST(request: Request) {
  try {
    const { ok } = await rateLimit(
      `rl:send-mfa-code:${getClientIp(request)}`,
      5,
      300,
    );
    if (!ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "300" } },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as SendCodeBody;
    const userId = session.user.id;

    if (body.method !== "email" && body.method !== "passkey") {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }

    const user = await UserModel.findById(userId)
      .select("email mfaMethods")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (body.method === "passkey") {
      if (!user.mfaMethods?.includes("passkey")) {
        return NextResponse.json(
          { error: "Passkey MFA is not enabled" },
          { status: 400 },
        );
      }

      const passkeys = await PasskeyModel.find({ userId: user._id }).lean();
      if (passkeys.length === 0) {
        return NextResponse.json(
          { error: "No passkeys registered" },
          { status: 400 },
        );
      }

      const options = await generateAuthenticationOptions({
        rpID: getWebAuthnRpId(),
        allowCredentials: passkeys.map((p) => ({
          id: Buffer.from(p.credentialId, "base64url"),
          type: "public-key" as const,
          transports: p.transports as AuthenticatorTransport[] | undefined,
        })),
        userVerification: "preferred",
      });

      await redis.setex(
        redisWebauthnChallengeKey(userId),
        WEBAUTHN_CHALLENGE_TTL_SECONDS,
        options.challenge,
      );

      return NextResponse.json({ options });
    }

    if (!user.mfaMethods?.includes("email")) {
      return NextResponse.json(
        { error: "Email MFA is not enabled" },
        { status: 400 },
      );
    }

    const code = generateMfaCode();
    await redis.setex(redisMfaCodeKey(userId), MFA_CODE_TTL_SECONDS, code);
    await sendMfaCode({ to: user.email, code });
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ err: error }, "Send MFA code error");
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
