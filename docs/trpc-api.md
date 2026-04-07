# tRPC API

Lineup Legends v2 uses **tRPC** to provide end-to-end type-safe APIs. TypeScript types flow from the server to the client without manual type definitions.

## Overview

tRPC provides:

- **Type safety**: Input/output types are automatically inferred on the client
- **No code generation**: Types come directly from server code
- **React Query integration**: Built-in hooks for data fetching
- **Middleware support**: Authentication, admin authorization, logging, timing

## Architecture

```
src/
├── server/
│   └── api/
│       ├── root.ts              # Root router (combines all 10 routers)
│       ├── trpc.ts              # tRPC configuration and procedures
│       ├── schemas/             # Shared Zod schemas
│       │   ├── common.ts
│       │   ├── comment.ts
│       │   ├── feedback.ts
│       │   ├── lineup.ts
│       │   ├── pagination.ts
│       │   └── player.ts
│       └── routers/
│           ├── admin.ts         # Admin dashboard stats
│           ├── bookmark.ts      # Lineup bookmarks
│           ├── comment.ts       # Comments and threads
│           ├── feedback.ts      # User feedback
│           ├── follow.ts        # Follow system
│           ├── lineup.ts        # Lineups (CRUD, rating, gamble)
│           ├── lineup-utils.ts  # Gamble odds, budget constants
│           ├── player.ts        # Player data
│           ├── profile.ts       # User profiles
│           ├── requestedPlayer.ts # Player requests
│           └── video.ts         # Getting Technical videos
└── trpc/
    ├── react.tsx                # React client setup
    ├── query-client.ts          # React Query client config
    └── server.ts                # Server-side caller
```

## tRPC Configuration (`src/server/api/trpc.ts`)

### Context

The context establishes the MongoDB connection and provides the session:

```typescript
export const createTRPCContext = async (opts: { headers: Headers }) => {
  await connectDB();
  const session = await auth();

  return {
    session,
    ...opts,
  };
};
```

### Transformer

SuperJSON is used to serialize complex types like Dates:

```typescript
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});
```

### Procedures

#### Public Procedure

Available to all users (authenticated or not):

```typescript
export const publicProcedure = t.procedure.use(timingMiddleware);
```

#### Protected Procedure

Requires authentication; throws `UNAUTHORIZED` if no session:

```typescript
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });
```

#### Admin Procedure

Requires authentication **and** the `admin` flag; throws `FORBIDDEN` if not an admin:

```typescript
export const adminProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user?.admin) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });
```

### Timing Middleware

Logs execution time via Pino and adds artificial delay in development:

```typescript
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();
  const end = Date.now();
  log.info({ path, duration: end - start }, `${path} took ${end - start}ms`);
  return result;
});
```

## Root Router (`src/server/api/root.ts`)

Combines all 10 feature routers:

```typescript
export const appRouter = createTRPCRouter({
  player: playerRouter,
  lineup: lineupRouter,
  comment: commentRouter,
  profile: profileRouter,
  follow: followRouter,
  requestedPlayer: requestedPlayerRouter,
  feedback: feedbackRouter,
  admin: adminRouter,
  video: videoRouter,
  bookmark: bookmarkRouter,
});

export type AppRouter = typeof appRouter;
```

## Router Summary

| Router            | Namespace          | Key Procedures                                                    |
| ----------------- | ------------------ | ----------------------------------------------------------------- |
| `playerRouter`    | `api.player`       | `getAll`, `getById`, `getRandomByValue`, `search`, `create`, `update`, `delete` |
| `lineupRouter`    | `api.lineup`       | `create`, `getLineupsByCurrentUser`, `getLineupsByOtherUsers`, `getAllLineups`, `getLineupById`, `delete`, `toggleFeatured`, `rate`, `reorder`, `gamble` |
| `commentRouter`   | `api.comment`      | `getComments`, `getThreads`, `getCommentCount`, `getMyCommentVotes`, `getMyThreadVotes`, `addComment`, `addThreadReply`, `deleteComment`, `deleteThread`, `voteComment`, `voteThread` |
| `profileRouter`   | `api.profile`      | `getById`, `getMe`, `update`, `getFeaturedLineups`               |
| `followRouter`    | `api.follow`       | `toggleFollow`, `isFollowing`, `getFollowers`, `getFollowing`, `searchUsers` |
| `requestedPlayerRouter` | `api.requestedPlayer` | `searchDuplicates`, `getAll`, `getById`, `create`, `delete` |
| `feedbackRouter`  | `api.feedback`     | `create`, `getAll`, `updateStatus`                               |
| `adminRouter`     | `api.admin`        | `getStats`                                                       |
| `videoRouter`     | `api.video`        | `getAll`, `create`, `delete`                                     |
| `bookmarkRouter`  | `api.bookmark`     | `toggle`, `isBookmarked`, `getBookmarkedLineups`                 |

## Input Validation with Zod

All inputs are validated using Zod schemas. Shared schemas are organized in `src/server/api/schemas/`:

```typescript
import { z } from "zod";

// Simple validation
.input(z.object({ id: z.string() }))

// Player positions as full objects
.input(z.object({
  players: z.object({
    pg: playerSchema,
    sg: playerSchema,
    sf: playerSchema,
    pf: playerSchema,
    c: playerSchema,
  }),
}))

// Enum with default
.input(z.object({
  sort: z.enum(["newest", "oldest", "highest-rated", "most-rated"]).default("newest"),
}))

// Cursor-based pagination
.input(z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
}))
```

## React Client (`src/trpc/react.tsx`)

### Provider Setup

The `TRPCReactProvider` wraps the application:

```tsx
export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({ /* ... */ }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
}
```

### Using the API

Import the `api` object to use tRPC hooks:

```typescript
import { api } from "~/trpc/react";
```

#### Queries

```typescript
// Basic query
const { data, isLoading, error } = api.player.getAll.useQuery();

// Query with input
const { data } = api.player.getById.useQuery({ id: "..." });

// Lineup sort options
const { data } = api.lineup.getAllLineups.useQuery({ sort: "highest-rated" });

// Cursor-based pagination (infinite query)
const { data, fetchNextPage } = api.comment.getComments.useInfiniteQuery(
  { lineupId },
  { getNextPageParam: (lastPage) => lastPage.nextCursor },
);
```

#### Mutations

```typescript
const utils = api.useUtils();

const createLineup = api.lineup.create.useMutation({
  onSuccess: () => {
    void utils.lineup.getLineupsByCurrentUser.invalidate();
    router.push("/lineups");
  },
  onError: (error) => {
    alert(error.message);
  },
});

createLineup.mutate({ players: { pg, sg, sf, pf, c } });
```

#### Cache Invalidation

Use `useUtils()` to access cache manipulation:

```typescript
const utils = api.useUtils();

// Invalidate specific query
void utils.lineup.getLineupsByCurrentUser.invalidate();

// Invalidate all lineup queries
void utils.lineup.invalidate();
```

## Type Inference

### Router Inputs/Outputs

Use type helpers for type inference:

```typescript
import type { RouterInputs, RouterOutputs } from "~/trpc/react";

type CreateLineupInput = RouterInputs["lineup"]["create"];
type LineupList = RouterOutputs["lineup"]["getLineupsByCurrentUser"];
```

## API Routes

The tRPC handler is mounted at `/api/trpc/[trpc]/route.ts`:

```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  });

export { handler as GET, handler as POST };
```

## Error Handling

### Throwing Errors

Use `TRPCError` for typed errors:

```typescript
import { TRPCError } from "@trpc/server";

throw new TRPCError({
  code: "NOT_FOUND",
  message: "Lineup not found.",
});

throw new TRPCError({
  code: "FORBIDDEN",
  message: "You do not have permission to delete this lineup.",
});

throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Lineup exceeds $15 budget.",
});
```

### Error Codes

Common tRPC error codes:

| Code              | HTTP Status | Usage                         |
| ----------------- | ----------- | ----------------------------- |
| `UNAUTHORIZED`    | 401         | Not authenticated             |
| `FORBIDDEN`       | 403         | Not authorized (or not admin) |
| `NOT_FOUND`       | 404         | Resource doesn't exist        |
| `BAD_REQUEST`     | 400         | Invalid input                 |
| `CONFLICT`        | 409         | Duplicate resource            |
| `INTERNAL_SERVER_ERROR` | 500   | Unexpected error              |

### Client-Side Error Handling

```typescript
const mutation = api.lineup.create.useMutation({
  onError: (error) => {
    console.error(error.message);

    if (error.data?.zodError) {
      console.error(error.data.zodError);
    }
  },
});
```

## Best Practices

1. **Use Zod for all inputs**: Provides runtime validation and TypeScript types
2. **Use `protectedProcedure` for user-specific actions**: Ensures authentication
3. **Use `adminProcedure` for admin-only actions**: Ensures both auth and admin status
4. **Validate ownership in mutations**: Check `ctx.session.user.id` against resource owner
5. **Invalidate cache after mutations**: Keep UI in sync with database
6. **Handle errors gracefully**: Show user-friendly messages via toast notifications
7. **Use SuperJSON for complex types**: Enables Date serialization
8. **Use shared Zod schemas**: Keep validation consistent between related endpoints
