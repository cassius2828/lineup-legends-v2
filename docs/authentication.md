# Authentication

Lineup Legends v2 uses **NextAuth.js v5** (Auth.js) for authentication, supporting both **Google OAuth** and **email/username + password credentials**. This document explains how authentication is configured and used throughout the application.

## Overview

The authentication system provides:

- Google OAuth and credentials-based (email/username + password) sign-in
- JWT-based session strategy (required for credentials provider compatibility)
- MongoDB adapter for persisting accounts and user data
- Custom sign-in page at `/sign-in`
- Protected API routes via tRPC middleware (`protectedProcedure`, `adminProcedure`)
- Server-side session access in React Server Components
- Runtime environment validation via `ensureEnvs()`

## Configuration

### Auth Config (`src/server/auth/config.ts`)

The authentication configuration uses the MongoDB adapter and JWT session strategy:

```typescript
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB, getMongoClient } from "~/server/db";
import { UserModel } from "../models";

ensureEnvs();

const clientPromise = getMongoClient();

export const authConfig = {
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
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validates identifier + password against UserModel (bcrypt)
        // Returns { id, name, username, email, image, profileImg }
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: { jwt, session },
} satisfies NextAuthConfig;
```

### Providers

#### Google OAuth

Standard OAuth flow via `next-auth/providers/google`. Requires `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET`.

#### Credentials (Email/Username + Password)

Users can sign in with either their email address or username, plus a password. The `authorize` function:

1. Validates that `identifier` and `password` are non-empty strings
2. Looks up the user by email (if `@` present) or username (lowercased)
3. Compares the input password against the stored bcrypt hash via `bcrypt.compare`
4. Returns the user object on success, or throws on failure

### Auth Module (`src/server/auth/index.ts`)

The auth module exports cached session helpers and handlers:

```typescript
import NextAuth from "next-auth";
import { cache } from "react";
import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
```

**Exports:**
- `auth`: Cached function for server-side session access
- `handlers`: GET/POST handlers for the NextAuth API route
- `signIn`: Function to initiate sign in
- `signOut`: Function to sign out

### JWT Callback

On initial sign-in or session update (`trigger === "update"`), the JWT callback fetches the user from MongoDB by email and stores key fields in the token:

```typescript
async jwt({ token, user, trigger }) {
  if (user || trigger === "update") {
    await connectDB();
    const dbUser = await UserModel.findOne({ email: user.email }).lean();
    if (dbUser) {
      token.id = dbUser._id.toString();
      token.admin = dbUser.admin ?? false;
      token.username = dbUser.username ?? null;
      token.profileImg = dbUser.profileImg ?? null;
      token.email = dbUser.email ?? null;
      token.name = dbUser.name ?? null;
      token.image = dbUser.image ?? null;
    }
  }
  return token;
}
```

### Session Callback

The session callback maps JWT token fields to the session user object:

```typescript
session.user.id;         // MongoDB ObjectId string
session.user.name;       // Display name
session.user.email;      // Email address
session.user.image;      // Avatar URL (from OAuth provider)
session.user.admin;      // Boolean admin flag
session.user.username;   // Username (nullable)
session.user.profileImg; // Custom profile image URL (nullable)
```

## Environment Variables

Required environment variables for authentication:

```env
# Secret for encrypting session tokens (required in production)
AUTH_SECRET="your-generated-secret"

# Google OAuth credentials
AUTH_GOOGLE_CLIENT_ID="your-google-client-id"
AUTH_GOOGLE_CLIENT_SECRET="your-google-client-secret"

# MongoDB connection string
MONGODB_URI="mongodb://localhost:27017/lineup-legends"
```

Generate a secret with:

```bash
npx auth secret
```

### Setting Up Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Select **Web application** as the application type
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

### Environment Validation (`src/lib/ensureEnvs.ts`)

The `ensureEnvs()` function validates required environment variables at runtime. It is called in `src/server/auth/config.ts` before the auth configuration is created, ensuring the app fails fast if required variables are missing.

## Usage

### Server Components

Access the session in React Server Components:

```typescript
import { auth } from "~/server/auth";

export default async function Page() {
  const session = await auth();

  if (!session) {
    return <p>Please sign in</p>;
  }

  return <p>Welcome, {session.user.name}</p>;
}
```

### tRPC Procedures

Three procedure types are available:

#### Public Procedure

Available to all users (authenticated or not), but still has access to the session if the user is logged in:

```typescript
export const playerRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    // ctx.session may be null
  }),
});
```

#### Protected Procedure

Requires authentication. The middleware throws `UNAUTHORIZED` if no session exists:

```typescript
export const lineupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ /* ... */ }))
    .mutation(async ({ ctx, input }) => {
      // ctx.session.user is guaranteed to exist
    }),
});
```

#### Admin Procedure

Requires authentication **and** the `admin` flag on the user. Throws `FORBIDDEN` if the user is not an admin:

```typescript
export const adminRouter = createTRPCRouter({
  getStats: adminProcedure.query(async ({ ctx }) => {
    // ctx.session.user.admin is guaranteed true
  }),
});
```

### Client Components

The session is not directly available in client components. Use tRPC queries that return user-specific data, or pass session data as props from server components.

## Database Schema

Authentication requires these models (managed by NextAuth):

### User

```typescript
// src/server/models/user.ts
const UserSchema = new Schema<UserDoc>({
  name:                   { type: String, required: true },
  password:               { type: String, required: false, default: null },
  username:               { type: String, required: false, unique: true, sparse: true },
  email:                  { type: String, required: true, unique: true },
  emailVerified:          { type: Date, default: null },
  image:                  { type: String, default: null },
  bio:                    { type: String, default: null, maxlength: 250 },
  profileImg:             { type: String, default: null },
  bannerImg:              { type: String, default: null },
  socialMedia:            { type: SocialMediaSchema, default: null },
  followerCount:          { type: Number, default: 0 },
  followingCount:         { type: Number, default: 0 },
  newEmail:               { type: String, default: null },
  emailConfirmationToken: { type: String, default: null },
  admin:                  { type: Boolean, default: false },
});
```

See [Database Documentation](./database.md) for full schema details.

### Account

Stores OAuth provider credentials (standard NextAuth pattern):
- `provider + providerAccountId` compound unique index
- Links to User via `userId`

### Session

Managed by NextAuth. Note: with JWT strategy, sessions are primarily stored in the JWT token rather than the database.

## Auth Routes

NextAuth provides built-in routes, configured in `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "~/server/auth";

export const { GET, POST } = handlers;
```

| Route                      | Purpose                       |
| -------------------------- | ----------------------------- |
| `/api/auth/signin`         | Sign in page (redirects to `/sign-in`) |
| `/api/auth/signout`        | Sign out page                 |
| `/api/auth/callback/google`| Google OAuth callback         |
| `/api/auth/session`        | Get current session (JSON)    |

### Custom Sign-In Page

The app uses a custom sign-in page at `/sign-in` (configured via `pages.signIn` in auth config) that supports both Google OAuth and credentials-based login with email/username + password fields.

## Adding More Providers

To add additional OAuth providers:

1. Install the provider (usually included in `next-auth`)
2. Add to `authConfig.providers` array
3. Add the required environment variables for each provider
4. Update `ensureEnvs()` to validate the new environment variables

## Type Safety

The auth module extends NextAuth types to include additional user fields:

```typescript
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
```

This ensures TypeScript knows `session.user.id`, `session.user.admin`, `session.user.username`, and `session.user.profileImg` are available when a session exists.
