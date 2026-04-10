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
import type { RegistrationResponseJSON } from "@simplewebauthn/types";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requireUserById } from "~/server/auth/require-user";
import { UserModel, PasskeyModel } from "~/server/models";
import { validatePassword } from "~/lib/password-validation";
import type { MfaMethod } from "~/server/models/user";
import type { PasskeyDeviceType } from "~/server/models/passkey";
import { redis } from "~/server/redis";
import { sendEmailChangeConfirmation } from "~/server/email";
import {
  generateTotpSecret,
  verifyTotpCode,
  encryptSecret,
  decryptSecret,
  getWebAuthnOrigin,
  getWebAuthnRpId,
} from "~/server/mfa";
import {
  APP_DISPLAY_NAME,
  BCRYPT_ROUNDS,
  EMAIL_CONFIRMATION_TTL_MS,
  redisWebauthnChallengeKey,
  WEBAUTHN_CHALLENGE_TTL_SECONDS,
} from "~/server/constants";
import { env } from "~/env";

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
      const user = await requireUserById(ctx.session.user.id, "password");

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

      if (!validatePassword(input.newPassword).isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Password must be at least 8 characters with one number and one special character",
        });
      }

      const hashed = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
      await UserModel.findByIdAndUpdate(ctx.session.user.id, {
        password: hashed,
      });

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
      const expiresAt = new Date(Date.now() + EMAIL_CONFIRMATION_TTL_MS);

      await UserModel.findByIdAndUpdate(ctx.session.user.id, {
        newEmail: input.newEmail.toLowerCase(),
        emailConfirmationToken: token,
        emailConfirmationExpiresAt: expiresAt,
      });

      const confirmUrl = `${env.NEXT_PUBLIC_APP_URL}/api/auth/confirm-email?token=${token}`;
      await sendEmailChangeConfirmation({
        to: input.newEmail,
        confirmUrl,
      });

      return { success: true };
    }),

  // ─── MFA Status ─────────────────────────────────────────────────────────

  getMfaStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await requireUserById(
      ctx.session.user.id,
      "mfaEnabled mfaMethods email password",
    );

    const passkeys = await PasskeyModel.find({ userId: user._id })
      .select("name createdAt")
      .lean();

    return {
      mfaEnabled: user.mfaEnabled ?? false,
      methods: (user.mfaMethods ?? []) as MfaMethod[],
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
    const user = await requireUserById(ctx.session.user.id, "email");

    const { secret, otpauthUrl } = generateTotpSecret(user.email);

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
    const user = await requireUserById(ctx.session.user.id, "mfaMethods");

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
      const user = await requireUserById(
        ctx.session.user.id,
        "email name username",
      );

      const existingPasskeys = await PasskeyModel.find({
        userId: user._id,
      }).lean();

      const options = await generateRegistrationOptions({
        rpName: APP_DISPLAY_NAME,
        rpID: getWebAuthnRpId(),
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

      await redis.setex(
        redisWebauthnChallengeKey(ctx.session.user.id),
        WEBAUTHN_CHALLENGE_TTL_SECONDS,
        options.challenge,
      );

      return options;
    },
  ),

  verifyPasskeyRegistration: protectedProcedure
    .input(
      z.object({
        credential: z.custom<RegistrationResponseJSON>(
          (val): val is RegistrationResponseJSON =>
            typeof val === "object" &&
            val !== null &&
            "id" in val &&
            "rawId" in val &&
            "response" in val,
        ),
        name: z.string().min(1).max(50).default("My Passkey"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const expectedChallenge = await redis.get(
        redisWebauthnChallengeKey(ctx.session.user.id),
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
          expectedOrigin: getWebAuthnOrigin(),
          expectedRPID: getWebAuthnRpId(),
        });
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Passkey verification failed",
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

      const credIdBase64 = Buffer.from(credentialID).toString("base64url");

      await PasskeyModel.create({
        userId: ctx.session.user.id,
        credentialId: credIdBase64,
        publicKey: Buffer.from(credentialPublicKey),
        counter,
        deviceType: credentialDeviceType as PasskeyDeviceType,
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

      await redis.del(redisWebauthnChallengeKey(ctx.session.user.id));

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

      const deleted = await PasskeyModel.findOneAndDelete({
        _id: input.passkeyId,
        userId: ctx.session.user.id,
      });

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Passkey not found",
        });
      }

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
});
