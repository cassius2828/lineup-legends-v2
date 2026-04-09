import crypto from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type VerifiedRegistrationResponse,
} from "@simplewebauthn/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  UserModel,
  PasswordResetTokenModel,
  PasskeyModel,
} from "~/server/models";
import type { MfaMethod } from "~/server/models/user";
import { redis } from "~/server/redis";
import {
  sendPasswordResetEmail,
  sendEmailChangeConfirmation,
  sendMfaCode,
} from "~/server/email";
import {
  generateTotpSecret,
  verifyTotpCode,
  generateMfaCode,
  encryptSecret,
  decryptSecret,
} from "~/server/mfa";
import { env } from "~/env";

const RP_NAME = "Lineup Legends";
const RP_ID_FALLBACK = "localhost";

function getRpId(): string {
  try {
    const url = new URL(env.NEXT_PUBLIC_APP_URL);
    return url.hostname;
  } catch {
    return RP_ID_FALLBACK;
  }
}

function getOrigin(): string {
  return env.NEXT_PUBLIC_APP_URL;
}

async function verifyUserPassword(
  userId: string,
  password: string,
): Promise<void> {
  const user = await UserModel.findById(userId).select("password").lean();
  if (!user?.password) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Account does not have a password set",
    });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Incorrect password",
    });
  }
}

async function removeMfaMethod(
  userId: string,
  method: MfaMethod,
): Promise<void> {
  const user = await UserModel.findById(userId);
  if (!user) return;
  user.mfaMethods = (user.mfaMethods ?? []).filter(
    (m) => m !== method,
  ) as MfaMethod[];
  if (user.mfaMethods.length === 0) {
    user.mfaEnabled = false;
  }
  await user.save();
}

// Store pending MFA verification codes in Redis (10 min TTL)
const MFA_CODE_PREFIX = "mfa-code:";
const WEBAUTHN_CHALLENGE_PREFIX = "webauthn-challenge:";

export const accountRouter = createTRPCRouter({
  // ─── Password Management ────────────────────────────────────────────────

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8).max(128),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await UserModel.findById(ctx.session.user.id)
        .select("password")
        .lean();
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // If user has a password, require current password
      if (user.password) {
        if (!input.currentPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Current password is required",
          });
        }
        const valid = await bcrypt.compare(
          input.currentPassword,
          user.password,
        );
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Current password is incorrect",
          });
        }
      }

      const hashed = await bcrypt.hash(input.newPassword, 12);
      await UserModel.findByIdAndUpdate(ctx.session.user.id, {
        password: hashed,
      });

      return { success: true };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      // Always return success to prevent email enumeration
      const user = await UserModel.findOne({
        email: input.email.toLowerCase(),
      }).lean();

      if (user) {
        // Delete any existing tokens for this user
        await PasswordResetTokenModel.deleteMany({ userId: user._id });

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
          .createHash("sha256")
          .update(rawToken)
          .digest("hex");

        await PasswordResetTokenModel.create({
          userId: user._id,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });

        const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;
        await sendPasswordResetEmail({ to: input.email, resetUrl });
      }

      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8).max(128),
      }),
    )
    .mutation(async ({ input }) => {
      const hashedToken = crypto
        .createHash("sha256")
        .update(input.token)
        .digest("hex");

      const resetToken = await PasswordResetTokenModel.findOne({
        token: hashedToken,
        expiresAt: { $gt: new Date() },
      }).lean();

      if (!resetToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      const hashed = await bcrypt.hash(input.newPassword, 12);
      await UserModel.findByIdAndUpdate(resetToken.userId, {
        password: hashed,
      });

      await PasswordResetTokenModel.deleteMany({ userId: resetToken.userId });

      return { success: true };
    }),

  // ─── Email Management ───────────────────────────────────────────────────

  updateEmail: protectedProcedure
    .input(
      z.object({
        newEmail: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyUserPassword(ctx.session.user.id, input.password);

      const existing = await UserModel.findOne({
        email: input.newEmail.toLowerCase(),
      }).lean();
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const token = crypto.randomBytes(32).toString("hex");

      await UserModel.findByIdAndUpdate(ctx.session.user.id, {
        newEmail: input.newEmail.toLowerCase(),
        emailConfirmationToken: token,
      });

      const confirmUrl = `${env.NEXT_PUBLIC_APP_URL}/api/auth/confirm-email?token=${token}`;
      await sendEmailChangeConfirmation({
        to: input.newEmail,
        confirmUrl,
      });

      return { success: true };
    }),

  confirmEmailChange: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const user = await UserModel.findOne({
        emailConfirmationToken: input.token,
      });

      if (!user || !user.newEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired confirmation token",
        });
      }

      user.email = user.newEmail;
      user.newEmail = null;
      user.emailConfirmationToken = null;
      await user.save();

      await redis.del(`user:${user._id.toString()}`);

      return { success: true };
    }),

  // ─── MFA Status ─────────────────────────────────────────────────────────

  getMfaStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await UserModel.findById(ctx.session.user.id)
      .select("mfaEnabled mfaMethods email password")
      .lean();

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const passkeys = await PasskeyModel.find({ userId: user._id })
      .select("name createdAt")
      .lean();

    return {
      mfaEnabled: user.mfaEnabled ?? false,
      methods: (user.mfaMethods ?? []) as string[],
      email: user.email,
      hasPassword: !!user.password,
      passkeys: passkeys.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        createdAt: p.createdAt,
      })),
    };
  }),

  // ─── TOTP (Authenticator App) ───────────────────────────────────────────

  setupTotp: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await UserModel.findById(ctx.session.user.id)
      .select("email")
      .lean();
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const { secret, otpauthUrl } = generateTotpSecret(user.email);

    // Store the pending (unverified) secret
    await UserModel.findByIdAndUpdate(ctx.session.user.id, {
      pendingTotpSecret: encryptSecret(secret),
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      qrCodeDataUrl,
      manualEntryKey: secret,
    };
  }),

  verifyAndEnableTotp: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await UserModel.findById(ctx.session.user.id)
        .select("pendingTotpSecret mfaMethods mfaEnabled")
        .lean();

      if (!user?.pendingTotpSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No TOTP setup in progress. Please start setup first.",
        });
      }

      const secret = decryptSecret(user.pendingTotpSecret);
      const valid = verifyTotpCode(secret, input.code);

      if (!valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code. Please try again.",
        });
      }

      const methods = new Set(user.mfaMethods ?? []);
      methods.add("totp");

      await UserModel.findByIdAndUpdate(ctx.session.user.id, {
        totpSecret: user.pendingTotpSecret,
        pendingTotpSecret: null,
        mfaMethods: Array.from(methods),
        mfaEnabled: true,
      });

      return { success: true };
    }),

  disableTotp: protectedProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyUserPassword(ctx.session.user.id, input.password);

      await UserModel.findByIdAndUpdate(ctx.session.user.id, {
        totpSecret: null,
        pendingTotpSecret: null,
      });

      await removeMfaMethod(ctx.session.user.id, "totp");

      return { success: true };
    }),

  // ─── Email MFA ──────────────────────────────────────────────────────────

  enableEmailMfa: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await UserModel.findById(ctx.session.user.id)
      .select("mfaMethods")
      .lean();
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const methods = new Set(user.mfaMethods ?? []);
    methods.add("email");

    await UserModel.findByIdAndUpdate(ctx.session.user.id, {
      mfaMethods: Array.from(methods),
      mfaEnabled: true,
    });

    return { success: true };
  }),

  disableEmailMfa: protectedProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyUserPassword(ctx.session.user.id, input.password);
      await removeMfaMethod(ctx.session.user.id, "email");
      return { success: true };
    }),

  // ─── Passkey (WebAuthn) ─────────────────────────────────────────────────

  generatePasskeyRegistrationOptions: protectedProcedure.mutation(
    async ({ ctx }) => {
      const user = await UserModel.findById(ctx.session.user.id)
        .select("email name username")
        .lean();
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const existingPasskeys = await PasskeyModel.find({
        userId: user._id,
      }).lean();

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: getRpId(),
        userID: user._id.toString(),
        userName: user.email,
        userDisplayName: user.name,
        excludeCredentials: existingPasskeys.map((p) => ({
          id: Buffer.from(p.credentialId, "base64url"),
          type: "public-key" as const,
          transports: p.transports as AuthenticatorTransport[] | undefined,
        })),
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
      });

      // Store challenge in Redis for verification
      await redis.setex(
        `${WEBAUTHN_CHALLENGE_PREFIX}${ctx.session.user.id}`,
        300,
        options.challenge,
      );

      return options;
    },
  ),

  verifyPasskeyRegistration: protectedProcedure
    .input(
      z.object({
        credential: z.any(),
        name: z.string().min(1).max(50).default("My Passkey"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const expectedChallenge = await redis.get(
        `${WEBAUTHN_CHALLENGE_PREFIX}${ctx.session.user.id}`,
      );

      if (!expectedChallenge) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Registration challenge expired. Please try again.",
        });
      }

      let verification: VerifiedRegistrationResponse;
      try {
        verification = await verifyRegistrationResponse({
          response: input.credential,
          expectedChallenge,
          expectedOrigin: getOrigin(),
          expectedRPID: getRpId(),
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Passkey verification failed",
        });
      }

      if (!verification.verified || !verification.registrationInfo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Passkey verification failed",
        });
      }

      const {
        credentialID,
        credentialPublicKey,
        counter,
        credentialDeviceType,
        credentialBackedUp,
      } = verification.registrationInfo;

      // Convert Uint8Array credentialID to base64url string for storage
      const credIdBase64 = Buffer.from(credentialID).toString("base64url");

      await PasskeyModel.create({
        userId: ctx.session.user.id,
        credentialId: credIdBase64,
        publicKey: Buffer.from(credentialPublicKey),
        counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        name: input.name,
      });

      const user = await UserModel.findById(ctx.session.user.id)
        .select("mfaMethods")
        .lean();
      const methods = new Set(user?.mfaMethods ?? []);
      methods.add("passkey");

      await UserModel.findByIdAndUpdate(ctx.session.user.id, {
        mfaMethods: Array.from(methods),
        mfaEnabled: true,
      });

      await redis.del(`${WEBAUTHN_CHALLENGE_PREFIX}${ctx.session.user.id}`);

      return { success: true };
    }),

  removePasskey: protectedProcedure
    .input(
      z.object({
        passkeyId: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyUserPassword(ctx.session.user.id, input.password);

      await PasskeyModel.findOneAndDelete({
        _id: input.passkeyId,
        userId: ctx.session.user.id,
      });

      // If no more passkeys, remove method
      const remaining = await PasskeyModel.countDocuments({
        userId: ctx.session.user.id,
      });
      if (remaining === 0) {
        await removeMfaMethod(ctx.session.user.id, "passkey");
      }

      return { success: true };
    }),

  // ─── Disable All MFA ────────────────────────────────────────────────────

  disableAllMfa: protectedProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyUserPassword(ctx.session.user.id, input.password);

      await UserModel.findByIdAndUpdate(ctx.session.user.id, {
        mfaEnabled: false,
        mfaMethods: [],
        totpSecret: null,
        pendingTotpSecret: null,
      });

      await PasskeyModel.deleteMany({ userId: ctx.session.user.id });

      return { success: true };
    }),

  // ─── MFA Login Verification Helpers ─────────────────────────────────────

  sendMfaLoginCode: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        method: z.enum(["email"]),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await UserModel.findById(input.userId)
        .select("email mfaMethods")
        .lean();

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (!user.mfaMethods?.includes(input.method)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email MFA is not enabled",
        });
      }

      const code = generateMfaCode();
      await redis.setex(`${MFA_CODE_PREFIX}${input.userId}`, 600, code);

      await sendMfaCode({ to: user.email, code });

      return { success: true };
    }),

  verifyMfaLoginCode: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        method: z.enum(["totp", "email"]),
        code: z.string().length(6),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await UserModel.findById(input.userId)
        .select("totpSecret mfaMethods")
        .lean();

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (input.method === "totp") {
        if (!user.totpSecret) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "TOTP is not configured",
          });
        }
        const secret = decryptSecret(user.totpSecret);
        const valid = verifyTotpCode(secret, input.code);
        if (!valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid verification code",
          });
        }
      } else {
        const stored = await redis.get(`${MFA_CODE_PREFIX}${input.userId}`);
        if (!stored || stored !== input.code) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired verification code",
          });
        }
        await redis.del(`${MFA_CODE_PREFIX}${input.userId}`);
      }

      return { success: true };
    }),
});
