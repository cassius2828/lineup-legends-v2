import crypto from "crypto";
import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/server/db";
import { UserModel, PasskeyModel } from "~/server/models";
import { redis } from "~/server/redis";
import {
  decryptSecret,
  getWebAuthnOrigin,
  getWebAuthnRpId,
  verifyTotpCode,
} from "~/server/mfa";
import {
  MFA_VERIFIED_TTL_SECONDS,
  redisMfaCodeKey,
  redisMfaVerifiedKey,
  redisWebauthnChallengeKey,
} from "~/server/constants";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "verify-mfa" });

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

interface VerifyMfaBody {
  method: "totp" | "email" | "passkey";
  code?: string;
  passkeyResponse?: unknown;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as VerifyMfaBody;
    const userId = session.user.id;

    const user = await UserModel.findById(userId)
      .select("totpSecret email mfaMethods")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let verified = false;

    switch (body.method) {
      case "totp": {
        if (!body.code || !/^\d{6}$/.test(body.code) || !user.totpSecret) {
          return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 },
          );
        }
        const secret = decryptSecret(user.totpSecret);
        verified = verifyTotpCode(secret, body.code);
        break;
      }

      case "email": {
        if (!body.code || !/^\d{6}$/.test(body.code)) {
          return NextResponse.json(
            { error: "Code is required" },
            { status: 400 },
          );
        }
        const stored = await redis.get(redisMfaCodeKey(userId));
        if (stored && timingSafeEqualString(stored, body.code)) {
          verified = true;
          await redis.del(redisMfaCodeKey(userId));
        }
        break;
      }

      case "passkey": {
        if (!body.passkeyResponse) {
          return NextResponse.json(
            { error: "Passkey response is required" },
            { status: 400 },
          );
        }

        const challenge = await redis.get(redisWebauthnChallengeKey(userId));
        if (!challenge) {
          return NextResponse.json(
            { error: "Challenge expired" },
            { status: 400 },
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authResponse = body.passkeyResponse as any;
        const credentialId = authResponse?.id as string;

        const passkey = await PasskeyModel.findOne({
          userId: user._id,
          credentialId,
        });

        if (!passkey) {
          return NextResponse.json(
            { error: "Passkey not found" },
            { status: 400 },
          );
        }

        try {
          const verification = await verifyAuthenticationResponse({
            response: authResponse,
            expectedChallenge: challenge,
            expectedOrigin: getWebAuthnOrigin(),
            expectedRPID: getWebAuthnRpId(),
            authenticator: {
              credentialID: new Uint8Array(
                Buffer.from(passkey.credentialId, "base64url"),
              ),
              credentialPublicKey: new Uint8Array(passkey.publicKey),
              counter: passkey.counter,
              transports: passkey.transports as
                | AuthenticatorTransport[]
                | undefined,
            },
          });

          if (verification.verified) {
            verified = true;
            passkey.counter = verification.authenticationInfo.newCounter;
            await passkey.save();
          }
        } catch {
          return NextResponse.json(
            { error: "Passkey verification failed" },
            { status: 400 },
          );
        }

        await redis.del(redisWebauthnChallengeKey(userId));
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 },
      );
    }

    await redis.set(
      redisMfaVerifiedKey(userId),
      "1",
      "EX",
      MFA_VERIFIED_TTL_SECONDS,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ err: error }, "MFA verification error");
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
