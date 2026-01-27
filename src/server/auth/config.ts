import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { env } from "~/env";
import { ensureEnvs } from "~/lib/ensureEnvs";
import { getMongoClient, connectDB } from "~/server/db";
import { User } from "~/server/models";

/**
 * Module augmentation for `next-auth` types.
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
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
  
  return User.findOne(query).lean();
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
          user.password as string | null,
        );
        if (!isValidPassword) {
          throw new Error("Invalid credentials2");
        }

        // Return user object with id as string
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthConfig;
