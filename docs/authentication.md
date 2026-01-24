# Authentication

Lineup Legends v2 uses **NextAuth.js v5** (Auth.js) for secure OAuth-based authentication. This document explains how authentication is configured and used throughout the application.

## Overview

The authentication system provides:

- OAuth provider support (Discord configured by default)
- Session management with database persistence
- Protected API routes via tRPC middleware
- Server-side session access in React Server Components

## Configuration

### Auth Config (`src/server/auth/config.ts`)

The authentication configuration uses the Prisma adapter to persist sessions and accounts to MongoDB:

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import DiscordProvider from "next-auth/providers/discord";
import { db } from "~/server/db";

export const authConfig = {
  providers: [DiscordProvider],
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
# Secret for encrypting session tokens
AUTH_SECRET="your-generated-secret"

# Discord OAuth credentials
AUTH_GOOGLE_CLIENT_ID="your-discord-client-id"
AUTH_GOOGLE_CLIENT_SECRET="your-discord-client-secret"
```

Generate a secret with:

```bash
npx auth secret
```

### Setting Up Discord OAuth

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Navigate to OAuth2 → General
4. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
5. Copy the Client ID and Client Secret to your `.env` file

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
    username      String?
    email         String?   @unique
    emailVerified DateTime?
    image         String?
    accounts      Account[]
    sessions      Session[]
    lineups       Lineup[]
}
```

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

NextAuth provides built-in routes:

| Route                    | Purpose                     |
| ------------------------ | --------------------------- |
| `/api/auth/signin`       | Sign in page                |
| `/api/auth/signout`      | Sign out page               |
| `/api/auth/callback/:id` | OAuth callback (e.g., Discord) |
| `/api/auth/session`      | Get current session (JSON)  |

## Adding More Providers

To add additional OAuth providers:

1. Install the provider (usually included in `next-auth`)
2. Add to `authConfig.providers`:

```typescript
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authConfig = {
  providers: [
    DiscordProvider,
    GitHubProvider,
    GoogleProvider,
  ],
  // ...
};
```

3. Add the required environment variables for each provider

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


