# Authentication

Lineup Legends v2 uses **NextAuth.js v5** (Auth.js) for secure OAuth-based authentication. This document explains how authentication is configured and used throughout the application.

## Overview

The authentication system provides:

- OAuth provider support (Google configured by default)
- Session management with database persistence
- Protected API routes via tRPC middleware
- Server-side session access in React Server Components
- Runtime environment validation via `ensureEnvs()`

## Configuration

### Auth Config (`src/server/auth/config.ts`)

The authentication configuration uses the Prisma adapter to persist sessions and accounts to MongoDB:

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { env } from "~/env";
import { ensureEnvs } from "~/lib/ensureEnvs";
import { db } from "~/server/db";

ensureEnvs();
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: PrismaAdapter(db),
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
```

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

### Session Callback

The `session` callback adds the user's database ID to the session object, making it available on both client and server:

```typescript
session.user.id; // MongoDB ObjectId string
session.user.name; // Display name from OAuth provider
session.user.email; // Email from OAuth provider
session.user.image; // Avatar URL from OAuth provider
```

## Environment Variables

Required environment variables for authentication:

```env
# Secret for encrypting session tokens (required in production)
AUTH_SECRET="your-generated-secret"

# Google OAuth credentials
AUTH_GOOGLE_CLIENT_ID="your-google-client-id"
AUTH_GOOGLE_CLIENT_SECRET="your-google-client-secret"

# MongoDB connection string (validated by ensureEnvs)
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

The `ensureEnvs()` function validates required environment variables at runtime:

```typescript
import { env } from "~/env";

export function ensureEnvs() {
  if (!env.AUTH_GOOGLE_CLIENT_ID) {
    throw new Error("AUTH_GOOGLE_CLIENT_ID is not set");
  }
  if (!env.AUTH_GOOGLE_CLIENT_SECRET) {
    throw new Error("AUTH_GOOGLE_CLIENT_SECRET is not set");
  }
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
}
```

This function is called in `src/server/auth/config.ts` before the auth configuration is created, ensuring the app fails fast if required variables are missing.

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

#### Public Procedures

Public procedures can be accessed by anyone, but still have access to the session if the user is logged in:

```typescript
export const playerRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    // ctx.session may be null
    return ctx.db.player.findMany();
  }),
});
```

#### Protected Procedures

Protected procedures require authentication. The middleware automatically throws `UNAUTHORIZED` if no session exists:

```typescript
export const lineupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ pgId: z.string() /* ... */ }))
    .mutation(async ({ ctx, input }) => {
      // ctx.session.user is guaranteed to exist
      return ctx.db.lineup.create({
        data: {
          ...input,
          ownerId: ctx.session.user.id,
        },
      });
    }),
});
```

### Client Components

The session is not directly available in client components. Use tRPC queries that return user-specific data, or pass session data as props from server components.

## Database Schema

Authentication requires these models (managed by NextAuth):

### User

```prisma
model User {
    id            String    @id @default(auto()) @map("_id") @db.ObjectId
    name          String?
    username      String?   @unique
    email         String?   @unique
    emailVerified DateTime?
    image         String?
    
    // Profile fields
    bio           String?   // Max 250 chars
    profileImg    String?   // Custom profile image URL
    bannerImg     String?   // Profile banner image URL
    
    accounts      Account[]
    sessions      Session[]
    lineups       Lineup[]
    votes         Vote[]
    ratings       Rating[]
}
```

See [Database Documentation](./database.md) for full schema details including Vote and Rating models.

### Account

Stores OAuth provider credentials:

```prisma
model Account {
    id                String  @id @default(auto()) @map("_id") @db.ObjectId
    userId            String  @db.ObjectId
    type              String
    provider          String
    providerAccountId String
    access_token      String?
    refresh_token     String?
    expires_at        Int?
    // ... other OAuth fields
    user              User    @relation(fields: [userId], references: [id])

    @@unique([provider, providerAccountId])
}
```

### Session

Stores active user sessions:

```prisma
model Session {
    id           String   @id @default(auto()) @map("_id") @db.ObjectId
    sessionToken String   @unique
    userId       String   @db.ObjectId
    expires      DateTime
    user         User     @relation(fields: [userId], references: [id])
}
```

## Auth Routes

NextAuth provides built-in routes, configured in `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "~/server/auth";

export const { GET, POST } = handlers;
```

| Route                      | Purpose                       |
| -------------------------- | ----------------------------- |
| `/api/auth/signin`         | Sign in page                  |
| `/api/auth/signout`        | Sign out page                 |
| `/api/auth/callback/google`| Google OAuth callback         |
| `/api/auth/session`        | Get current session (JSON)    |

## Adding More Providers

To add additional OAuth providers:

1. Install the provider (usually included in `next-auth`)
2. Add to `authConfig.providers`:

```typescript
import DiscordProvider from "next-auth/providers/discord";
import GitHubProvider from "next-auth/providers/github";

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: env.AUTH_GITHUB_CLIENT_SECRET,
    }),
    DiscordProvider({
      clientId: env.AUTH_DISCORD_CLIENT_ID,
      clientSecret: env.AUTH_DISCORD_CLIENT_SECRET,
    }),
  ],
  // ...
};
```

3. Add the required environment variables for each provider
4. Update `ensureEnvs()` to validate the new environment variables

## Type Safety

The auth module extends NextAuth types to include the user ID:

```typescript
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
```

This ensures TypeScript knows `session.user.id` is always available when a session exists.


