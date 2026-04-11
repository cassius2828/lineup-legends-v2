import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env } from "~/env";
import { ensureEnvs } from "~/lib/ensureEnvs";
import { connectDB, getMongoClient } from "~/server/db";
import { redis } from "~/server/redis";
import { redisMfaVerifiedKey } from "~/server/constants";
import { UserModel } from "../models";

/**
 * Module augmentation for `next-auth` types.
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      /** Present and `true` only when the user is an admin (omit when not). */
      admin?: boolean;
      username?: string | null;
      profileImg?: string | null;
      mfaPending?: boolean;
      mfaMethods?: string[];
    } & DefaultSession["user"];
  }
}

/**
 * Validates that a value is a non-empty string.
 */
function validateString(value: unknown, fieldName: string): string {
  if (!value || typeof value !== "string") {
    throw new Error(`${fieldName} is required`);
  }
  return value;
}

/**
 * Checks if identifier is an email address.
 */
function isEmail(identifier: string): boolean {
  return identifier.includes("@");
}

/**
 * Finds a user by email or username using Mongoose.
 */
async function findUserByIdentifier(identifier: string) {
  await connectDB();

  const query = isEmail(identifier)
    ? { email: identifier.toLowerCase() }
    : { username: identifier.toLowerCase() };

  return UserModel.findOne(query).lean();
}

/**
 * Verifies password against stored hash.
 */
async function verifyPassword(
  inputPassword: string,
  storedPassword: string | null,
): Promise<boolean> {
  if (!storedPassword) {
    return false;
  }
  return bcrypt.compare(inputPassword, storedPassword);
}

if (!process.env.SKIP_ENV_VALIDATION) {
  ensureEnvs();
}

export const authConfig = {
  // Use JWT strategy - required for Credentials provider to work with sessions
  // Database strategy doesn't work with Credentials because it doesn't persist sessions
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: {
          label: "Email or Username",
          type: "text",
          placeholder: "email@example.com or username",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const identifier = validateString(
          credentials?.identifier,
          "Email or username",
        );
        const password = validateString(credentials?.password, "Password");

        const user = await findUserByIdentifier(identifier);
        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (user.banned) {
          throw new Error("This account has been banned");
        }
        if (user.suspendedUntil && user.suspendedUntil > new Date()) {
          throw new Error("This account is temporarily suspended");
        }

        const isValidPassword = await verifyPassword(
          password,
          user.password ?? null,
        );
        if (!isValidPassword) {
          throw new Error("Invalid credentials");
        }

        const loginIp =
          request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ??
          null;
        if (loginIp) {
          await UserModel.updateOne(
            { _id: user._id },
            { lastLoginIp: loginIp },
          );
        }

        return {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
          image: user.image,
          profileImg: user.profileImg,
          mfaPending: user.mfaEnabled === true,
          mfaMethods: (user.mfaMethods ?? []) as string[],
        };
      },
    }),
  ],
  adapter: MongoDBAdapter(getMongoClient()),
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return true;
      await connectDB();
      const dbUser = await UserModel.findOne({ email: user.email })
        .select("banned banReason bannedAt suspendedUntil suspensionCount")
        .lean();
      if (!dbUser) return true;

      if (dbUser.banned) {
        const params = new URLSearchParams({
          error: "banned",
          reason: dbUser.banReason ?? "Violation of community guidelines",
          suspensionCount: String(dbUser.suspensionCount ?? 0),
        });
        if (dbUser.bannedAt) {
          params.set("bannedAt", dbUser.bannedAt.toISOString());
        }
        return `/sign-in?${params.toString()}`;
      }

      if (dbUser.suspendedUntil && dbUser.suspendedUntil > new Date()) {
        const params = new URLSearchParams({
          error: "suspended",
          reason: dbUser.banReason ?? "Violation of community guidelines",
          suspendedUntil: dbUser.suspendedUntil.toISOString(),
          suspensionCount: String(dbUser.suspensionCount ?? 0),
        });
        return `/sign-in?${params.toString()}`;
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      // On initial sign-in, capture MFA flags from the authorize result
      if (user) {
        const u = user as typeof user & {
          mfaPending?: boolean;
          mfaMethods?: string[];
        };
        if (u.mfaPending) {
          token.mfaPending = true;
          token.mfaMethods = u.mfaMethods ?? [];
        }
      }

      // On sign-in or explicit session update, refresh DB data
      if (user || trigger === "update") {
        await connectDB();
        const email =
          typeof user?.email === "string"
            ? user.email
            : typeof token.email === "string"
              ? token.email
              : null;
        if (!email) {
          return token;
        }
        const dbUser = await UserModel.findOne({ email }).lean();
        if (dbUser) {
          token.id = dbUser?._id.toString() ?? "";
          if (dbUser.admin === true) {
            token.admin = true;
          } else {
            delete token.admin;
          }
          token.username = dbUser?.username ?? null;
          token.profileImg = dbUser?.profileImg ?? null;
          token.email = dbUser?.email ?? null;
          token.name = dbUser?.name ?? null;
          token.image = dbUser?.image ?? null;

          if (user && dbUser.mfaEnabled === true && !token.mfaPending) {
            token.mfaPending = true;
            token.mfaMethods = (dbUser.mfaMethods ?? []) as string[];
          }

          if (trigger === "update" && token.mfaPending === true) {
            const uid = dbUser._id.toString();
            const verified = await redis.get(redisMfaVerifiedKey(uid));
            if (verified) {
              delete token.mfaPending;
              delete token.mfaMethods;
              await redis.del(redisMfaVerifiedKey(uid));
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.id !== "string") {
        throw new Error("User ID is not a string");
      }

      if (token.admin === true) {
        session.user.admin = true;
      } else {
        delete session.user.admin;
      }
      session.user.username = (token.username as string | null) ?? null;
      session.user.profileImg = (token.profileImg as string | null) ?? null;
      session.user.id = token.id;
      session.user.email = token.email!;
      session.user.name = (token.name as string | null) ?? null;
      session.user.image = (token.image as string | null) ?? null;

      if (token.mfaPending === true) {
        session.user.mfaPending = true;
        session.user.mfaMethods = (token.mfaMethods as string[]) ?? [];
      } else {
        delete session.user.mfaPending;
        delete session.user.mfaMethods;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
