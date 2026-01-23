# tRPC API

Lineup Legends v2 uses **tRPC** to provide end-to-end type-safe APIs. This means TypeScript types flow from the server to the client without manual type definitions.

## Overview

tRPC provides:

- **Type safety**: Input/output types are automatically inferred on the client
- **No code generation**: Types come directly from server code
- **React Query integration**: Built-in hooks for data fetching
- **Middleware support**: Authentication, logging, timing

## Architecture

```
src/
├── server/
│   └── api/
│       ├── root.ts       # Root router (combines all routers)
│       ├── trpc.ts       # tRPC configuration and procedures
│       └── routers/
│           ├── lineup.ts # Lineup-related endpoints
│           └── player.ts # Player-related endpoints
└── trpc/
    ├── react.tsx         # React client setup
    ├── query-client.ts   # React Query client config
    └── server.ts         # Server-side caller
```

## tRPC Configuration (`src/server/api/trpc.ts`)

### Context

The context provides access to the database and session:

```typescript
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    db,      // Prisma client
    session, // NextAuth session (may be null)
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

### Timing Middleware

Logs execution time and adds artificial delay in development:

```typescript
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();
  console.log(`[TRPC] ${path} took ${end - start}ms`);
  return result;
});
```

## Root Router (`src/server/api/root.ts`)

Combines all feature routers:

```typescript
import { createTRPCRouter } from "~/server/api/trpc";
import { playerRouter } from "./routers/player";
import { lineupRouter } from "./routers/lineup";

export const appRouter = createTRPCRouter({
  player: playerRouter,
  lineup: lineupRouter,
});

export type AppRouter = typeof appRouter;
```

## Creating a Router

Example router structure:

```typescript
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";

export const exampleRouter = createTRPCRouter({
  // Public query
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.example.findMany();
  }),

  // Query with input validation
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.example.findUnique({ where: { id: input.id } });
    }),

  // Protected mutation
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.example.create({
        data: {
          name: input.name,
          ownerId: ctx.session.user.id,
        },
      });
    }),
});
```

## Input Validation with Zod

All inputs are validated using Zod schemas:

```typescript
import { z } from "zod";

// Simple validation
.input(z.object({ id: z.string() }))

// Complex validation
.input(z.object({
  pgId: z.string(),
  sgId: z.string(),
  sfId: z.string(),
  pfId: z.string(),
  cId: z.string(),
}))

// Optional with default
.input(z.object({
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
}).optional())

// Number constraints
.input(z.object({
  value: z.number().min(1).max(5).optional()
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

// Optional input
const { data } = api.lineup.getByCurrentUser.useQuery({ sort: "newest" });
```

#### Mutations

```typescript
const utils = api.useUtils();

const createLineup = api.lineup.create.useMutation({
  onSuccess: () => {
    // Invalidate cache to refetch
    void utils.lineup.getByCurrentUser.invalidate();
    router.push("/lineups");
  },
  onError: (error) => {
    alert(error.message);
  },
});

// Call the mutation
createLineup.mutate({
  pgId: "...",
  sgId: "...",
  // ...
});

// Check loading state
if (createLineup.isPending) {
  // Show loading...
}
```

#### Cache Invalidation

Use `useUtils()` to access cache manipulation:

```typescript
const utils = api.useUtils();

// Invalidate specific query
void utils.lineup.getByCurrentUser.invalidate();

// Invalidate all lineup queries
void utils.lineup.invalidate();
```

## Type Inference

### Router Inputs/Outputs

Use type helpers for type inference:

```typescript
import type { RouterInputs, RouterOutputs } from "~/trpc/react";

type CreateLineupInput = RouterInputs["lineup"]["create"];
type LineupWithRelations = RouterOutputs["lineup"]["getByCurrentUser"][0];
```

### Example Component Types

```typescript
type LineupWithRelations = Lineup & {
  pg: Player;
  sg: Player;
  sf: Player;
  pf: Player;
  c: Player;
  owner: User;
};

interface LineupCardProps {
  lineup: LineupWithRelations;
  showOwner?: boolean;
}
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
| `FORBIDDEN`       | 403         | Not authorized                |
| `NOT_FOUND`       | 404         | Resource doesn't exist        |
| `BAD_REQUEST`     | 400         | Invalid input                 |
| `INTERNAL_SERVER_ERROR` | 500   | Unexpected error              |

### Client-Side Error Handling

```typescript
const mutation = api.lineup.create.useMutation({
  onError: (error) => {
    // error.message contains the error text
    console.error(error.message);

    // Zod validation errors are available
    if (error.data?.zodError) {
      console.error(error.data.zodError);
    }
  },
});
```

## Best Practices

1. **Use Zod for all inputs**: Provides runtime validation and TypeScript types
2. **Use `protectedProcedure` for user-specific actions**: Ensures authentication
3. **Validate ownership in mutations**: Check `ctx.session.user.id` against resource owner
4. **Invalidate cache after mutations**: Keep UI in sync with database
5. **Handle errors gracefully**: Show user-friendly messages
6. **Use SuperJSON for complex types**: Enables Date serialization

