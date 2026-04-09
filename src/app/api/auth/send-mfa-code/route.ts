import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/server/db";
import { UserModel, PasskeyModel } from "~/server/models";
import { redis } from "~/server/redis";
import { generateMfaCode } from "~/server/mfa";
import { sendMfaCode } from "~/server/email";
import { sendSmsCode } from "~/server/sms";
import { env } from "~/env";

const MFA_CODE_PREFIX = "mfa-code:";
const WEBAUTHN_CHALLENGE_PREFIX = "webauthn-challenge:";

function getRpId(): string {
  try {
    const url = new URL(env.NEXT_PUBLIC_APP_URL);
    return url.hostname;
  } catch {
    return "localhost";
  }
}

interface SendCodeBody {
  method: "sms" | "email" | "passkey";
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as SendCodeBody;
    const userId = session.user.id;

    const user = await UserModel.findById(userId)
      .select("email phone mfaMethods")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (body.method === "passkey") {
      const passkeys = await PasskeyModel.find({ userId: user._id }).lean();
      if (passkeys.length === 0) {
        return NextResponse.json(
          { error: "No passkeys registered" },
          { status: 400 },
        );
      }

      const options = await generateAuthenticationOptions({
        rpID: getRpId(),
        allowCredentials: passkeys.map((p) => ({
          id: Buffer.from(p.credentialId, "base64url"),
          type: "public-key" as const,
          transports: p.transports as AuthenticatorTransport[] | undefined,
        })),
        userVerification: "preferred",
      });

      await redis.setex(
        `${WEBAUTHN_CHALLENGE_PREFIX}${userId}`,
        300,
        options.challenge,
      );

      return NextResponse.json({ options });
    }

    const code = generateMfaCode();
    await redis.setex(`${MFA_CODE_PREFIX}${userId}`, 600, code);

    if (body.method === "sms" && user.phone) {
      await sendSmsCode({ to: user.phone, code });
    } else if (body.method === "email") {
      await sendMfaCode({ to: user.email, code });
    } else {
      return NextResponse.json(
        { error: "Invalid method or missing phone" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send MFA code error:", error);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
