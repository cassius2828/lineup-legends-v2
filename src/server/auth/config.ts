import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { env } from "~/env";
import { ensureEnvs } from "~/lib/ensureEnvs";
import { connectDB, getMongoClient } from "~/server/db";
import { UserModel } from "../models";

/**
 * Module augmentation for `next-auth` types.
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      admin?: boolean;
      username?: string | null;
      profileImg?: string | null;
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
    ? { email: identifier }
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

ensureEnvs();

// Get the MongoDB client promise for the adapter
const clientPromise = getMongoClient();

export const authConfig = {
  // Use JWT strategy - required for Credentials provider to work with sessions
  // Database strategy doesn't work with Credentials because it doesn't persist sessions
  session: {
    strategy: "jwt",
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
      async authorize(credentials) {
        const identifier = validateString(
          credentials?.identifier,
          "Email or username",
        );
        const password = validateString(credentials?.password, "Password");

        const user = await findUserByIdentifier(identifier);
        if (!user) {
          throw new Error("Invalid credentials1");
        }

        const isValidPassword = await verifyPassword(
          password,
          user.password ?? null,
        );
        if (!isValidPassword) {
          throw new Error("Invalid credentials2");
        }

        // Return user object with id as string
        return {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
          image: user.image,
          profileImg: user.profileImg,
        };
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign-in, user object is available
      // Store the user id in the token
      if (user || trigger === "update") {
        // Fetch admin status from database
        await connectDB();
        const dbUser = await UserModel.findOne({ email: user.email }).lean();
        if (dbUser) {
          token.id = dbUser?._id.toString() ?? "";
          token.admin = dbUser?.admin ?? false;
          token.username = dbUser?.username ?? null;
          token.profileImg = dbUser?.profileImg ?? null;
          token.email = dbUser?.email ?? null;
          token.name = dbUser?.name ?? null;
          token.image = dbUser?.image ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.id !== "string") {
        throw new Error("User ID is not a string");
      }

      // Fetch fresh user data from database (in case it changed)

      session.user.admin = (token.admin as boolean) ?? false;
      session.user.username = (token.username as string | null) ?? null;
      session.user.profileImg = (token.profileImg as string | null) ?? null;
      session.user.id = token.id;
      session.user.email = token.email!;
      session.user.name = (token.name as string | null) ?? null;
      session.user.image = (token.image as string | null) ?? null;

      return session;
    },
  },
} satisfies NextAuthConfig;
