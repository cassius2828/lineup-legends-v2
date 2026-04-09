import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { auth } from "~/server/auth";
import { connectDB } from "~/server/db";
import { UserModel, PasskeyModel } from "~/server/models";
import { redis } from "~/server/redis";
import { verifyTotpCode, decryptSecret } from "~/server/mfa";
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
        if (!body.code || !user.totpSecret) {
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
        if (!body.code) {
          return NextResponse.json(
            { error: "Code is required" },
            { status: 400 },
          );
        }
        const stored = await redis.get(`${MFA_CODE_PREFIX}${userId}`);
        if (stored && stored === body.code) {
          verified = true;
          await redis.del(`${MFA_CODE_PREFIX}${userId}`);
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

        const challenge = await redis.get(
          `${WEBAUTHN_CHALLENGE_PREFIX}${userId}`,
        );
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
            expectedOrigin: env.NEXT_PUBLIC_APP_URL,
            expectedRPID: getRpId(),
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

        await redis.del(`${WEBAUTHN_CHALLENGE_PREFIX}${userId}`);
        break;
      }
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MFA verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
