# Type Architecture Audit

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [The Core Problem](#the-core-problem)
3. [All Type Errors (tsc --noEmit)](#all-type-errors)
4. [Type Assertion Inventory](#type-assertion-inventory)
5. [Root Causes](#root-causes)
6. [Recommendations](#recommendations)

---

## Current Architecture Overview

### Two Parallel Type Systems

The project has **two completely separate type systems** that describe the same data:

#### 1. Mongoose Model Types (`src/server/models/*.ts`)

Each model defines a pair of interfaces:

- **`XxxDoc`** — the database document shape. References are `Types.ObjectId`. Used in schemas.
- **`Xxx`** — the "API type" (populated shape). References are resolved to their full objects (e.g., `owner: User` instead of `owner: Types.ObjectId`).

Examples:

| Model       | Doc Type       | API Type       |
|-------------|----------------|----------------|
| Player      | `PlayerDoc`    | `Player`       |
| User        | `UserDoc`      | `User`         |
| Lineup      | `LineupDoc`    | `Lineup`       |
| Comment     | `CommentDoc`   | `Comment`      |
| Thread      | `ThreadDoc`    | `Thread`       |

#### 2. Client-Side Types (`src/lib/types.ts`)

A third, independent set of interfaces lives in `lib/types.ts`:

- `PlayerType` — similar to `Player` but with `_id?: ObjectIdLike` and no required `id`
- `UserType` — similar to `User` but with a different shape (no `followerCount`, etc.)
- `LineupType` — similar to `Lineup` but includes `totalVotes` (which doesn't exist on `Lineup` or `LineupDoc`)

#### 3. Zod Schemas (`src/server/api/schemas/lineup.ts`)

Input validation schemas define their own implicit types through `z.infer<>`:

```
playerSchema = z.object({ _id: z.string(), firstName, lastName, imgUrl, value })
```

### Data Flow

```
MongoDB Document (LineupDoc)
    ↓ .populate() + .lean()
Mongoose Lean Object (LineupDoc & { _id: ObjectId, __v: number } — BUT with populated fields)
    ↓ tRPC return (superjson serialized)
tRPC inferred output type (still typed as LineupDoc, not Lineup)
    ↓ consumed on client
Client expects LineupType (from lib/types.ts)
```

**The critical gap**: `.lean()` returns `LineupDoc & Required<{ _id: ObjectId }> & { __v: number }`. Even after `.populate()`, TypeScript still sees `players.pg` as `Types.ObjectId`, not `Player`. The "API types" (`Lineup`, `Player`, etc.) are never actually used by any runtime code — they exist as aspirational documentation.

---

## All Type Errors

### Category 1: ObjectId vs Populated Type (10 errors)

These errors occur because Mongoose `.populate()` hydrates references at runtime, but TypeScript still sees the `Doc` type where fields are `ObjectId`.

| File | Line | Error |
|------|------|-------|
| `lineups/[id]/gamble/page.tsx` | 244 | `Property 'value' does not exist on type 'ObjectId'` |
| `lineups/[id]/gamble/page.tsx` | 247 | `Property 'imgUrl' does not exist on type 'ObjectId'` |
| `lineups/[id]/gamble/page.tsx` | 248 | `Property 'firstName'/'lastName' does not exist on type 'ObjectId'` |
| `lineups/[id]/gamble/page.tsx` | 253, 256, 270, 271, 273 | Same pattern for other player properties |
| `lineups/[id]/rate/page.tsx` | 101 | `Property 'name' does not exist on type 'ObjectId'` (accessing `lineup.owner.name`) |
| `lineups/[id]/rate/page.tsx` | 113 | `Type 'ObjectId' is missing properties from type 'PlayerType': firstName, lastName, imgUrl, value` |

**Root cause**: `api.lineup.getLineupById` returns `LineupDoc & ...` from `.lean()`. Even though `.populate()` runs, the type doesn't reflect populated fields.

### Category 2: Missing `totalVotes` Field (3 errors)

| File | Line | Error |
|------|------|-------|
| `lineups/bookmarked/page.tsx` | 66 | `Property 'totalVotes' is missing in type 'LineupDoc & ...' but required in type 'LineupType'` |
| `lineups/explore/page.tsx` | 106 | Same |
| `lineups/page.tsx` | 103 | Same |

**Root cause**: `LineupType` (from `lib/types.ts`) requires `totalVotes`, but `LineupDoc` does not have this field. It was likely removed from the schema but `LineupType` was never updated (or vice versa).

### Category 3: Implicit `any` (2 errors)

| File | Line | Error |
|------|------|-------|
| `admin/page.tsx` | 132 | Parameter `user` implicitly has an `any` type |
| `admin/page.tsx` | 188 | Parameter `feedback` implicitly has an `any` type |

**Root cause**: The admin router's `getStats` returns `recentUsers` and `recentFeedback` from `.lean()` with `.select()`, but the return type is inferred as a partial lean document and the client-side `.map()` callback doesn't annotate the parameter type.

### Category 4: Nullable/Optional Mismatch (2 errors)

| File | Line | Error |
|------|------|-------|
| `lineups/[id]/page.tsx` | 137 | `Type 'string | null | undefined' is not assignable to type 'string'` |
| `lineups/new/page.tsx` | 32-36 | `Type 'PlayerType | undefined' is not assignable to type '{ firstName: string; ... }'` — `PlayerType` allows optional fields, but the mutation input requires them all |

### Category 5: Key Type Mismatch (1 error)

| File | Line | Error |
|------|------|-------|
| `admin/requested/page.tsx` | 50 | `Type 'ObjectId' is not assignable to type 'Key'` — using `_id` (ObjectId) as a React `key` |

### Category 6: Migration Scripts (4 errors)

| File | Lines | Error |
|------|-------|-------|
| `migrations/consolidate-collections.ts` | 49, 158 | `Property 'DATABASE_URL' does not exist on type ...` |
| `migrations/fix-description-user-field.ts` | 17 | Same |
| `migrations/migrate-comment-votes.ts` | 39 | Same |

**Root cause**: Old migration scripts reference `DATABASE_URL` which was renamed to `MONGODB_URI` in the env schema.

---

## Type Assertion Inventory

### `as unknown as` Casts (most concerning)

These are double-casts that bypass type checking entirely:

| File | What's Being Cast | Why |
|------|-------------------|-----|
| `CommentCard.tsx:29` | `(comment as unknown as { _id: string })._id` | Accessing `_id` which isn't on the `Comment` API type |
| `CommentCard.tsx:32` | `(comment.user as unknown as { _id?: string })._id` | Same — `User` has `id` but code needs `_id` |
| `ThreadCard.tsx:34,37` | Same pattern as CommentCard | Same root cause |
| `lineups/[id]/page.tsx:67` | `lineup as unknown as LineupType` | tRPC returns `LineupDoc` lean, but `LineupCard` expects `LineupType` |
| `lineups/[id]/page.tsx:130` | `comment as unknown as Comment & { threadCount? }` | Lean comment doesn't match `Comment` API type |
| `lineups/[id]/page.tsx:138-140` | `comment as unknown as { image?: ... }` | Accessing fields that exist on lean doc but not on the `CommentDoc` type used |
| `CommentModal.tsx:188` | `lineup as unknown as LineupType` | Same lean→LineupType mismatch |
| `CommentModal.tsx:315,320` | Thread casts | Same pattern |
| `lineups/[id]/edit/page.tsx:186` | `] as unknown as PlayerType[]` | Populated players typed as ObjectId |
| `lineup.ts:528` | `lineup.players[positionField] as unknown as Player` | Server-side: populated field still typed as ObjectId |
| `redis.ts:4` | `globalThis as unknown as { redis: Redis }` | Attaching singleton to globalThis |
| `s3.ts:16` | `globalThis as unknown as { ... }` | Same pattern |
| `session.ts:46-48` | `ret as unknown as Record<string, unknown>` | toJSON transform |
| `profile/[userId]/page.tsx:468,512` | `} as any}` | Passing lineup data to components |
| `profile/[userId]/page.tsx:64` | `item.user as any` | Follow items have untyped `user` field |
| `profile/[userId]/page.tsx:424,429` | `highestRated as any` | Aggregation result untyped |

### `as Type` Casts (less concerning, but still worth auditing)

| File | Cast | Assessment |
|------|------|------------|
| `PlayerSelector.tsx:132,144` | `player as PlayerType \| undefined` | Reasonable — DnD data is untyped |
| `PlayerSelector.tsx:145` | `over.id as Position` | Reasonable — DnD constraint |
| `upload/route.ts:17` | `formData.get("file") as File \| null` | Standard pattern |
| `ShareMenu.tsx:35,37` | `e.target as Node` | Standard DOM pattern |
| `rate/page.tsx:136` | `as React.CSSProperties` | CSS custom property pattern |
| `player-cache.ts:10` | `JSON.parse(cached) as PlayerDoc[]` | Unavoidable with JSON.parse |
| `youtube.ts:111` | `(await res.json()) as YouTubeApiResponse` | Unavoidable with fetch |
| `upload.ts:18` | `(await res.json()) as { url?, error? }` | Unavoidable with fetch |
| All models | `mongoose.models.X as Model<XDoc> \| undefined` | Mongoose pattern — unavoidable |

### Non-null Assertions (`!`)

Concentrated in test files (`error!.errors.xxx`) — acceptable in tests.
One in `rating-color.ts:18` (`RATING_COLORS[i + 1]!`) — low risk.

---

## Root Causes

### Root Cause 1: Mongoose `.lean()` Erases Population Info

When you call `.populate("players.pg").lean()`, the **runtime** result has the full `Player` object at `players.pg`. But TypeScript sees `LineupDoc & { _id: ObjectId }` — and `LineupDoc.players.pg` is typed as `Types.ObjectId`.

This is the single biggest source of type errors and `as unknown as` casts in the codebase.

### Root Cause 2: Duplicate Type Definitions That Drift

`lib/types.ts` defines `LineupType`, `PlayerType`, `UserType` which overlap with but don't match the model types (`Lineup`, `Player`, `User`). Key differences:

- `LineupType` has `totalVotes` — `LineupDoc` and `Lineup` don't
- `PlayerType` has `_id?: ObjectIdLike` — `Player` has `id: string`
- `UserType` omits `followerCount`, `followingCount`, `admin`
- `LineupType.players` uses `PlayerType` (with optional _id) — `Lineup.players` uses `Player` (with required id)

Components use `LineupType` (from `lib/types.ts`), but tRPC returns lean `LineupDoc` objects. Neither matches the other, hence `as unknown as LineupType` everywhere.

### Root Cause 3: tRPC Output Types Are Implicitly Inferred from Mongoose

tRPC infers its return types from whatever the router handler returns. Since handlers return `LineupModel.find().populate().lean()`, the inferred type is `(LineupDoc & { _id: ObjectId, __v: number })[]` — the unpopulated type with Mongoose internals. The "API types" (`Lineup`, `Player`, etc.) are never used in this flow.

### Root Cause 4: Follow Router Returns Untyped `user` Field

The follow router maps items to `{ id, user: f.follower, createdAt }`. Since `f.follower` is typed as `Types.ObjectId` (pre-population type), the `user` field is typed as `ObjectId`. The client then casts it with `as any`.

---

## Recommendations

### Strategy: Infer from a Single Source of Truth

Your preference for inferring over asserting aligns perfectly with the needed fix. The goal is: **define the shape once, and let TypeScript infer it everywhere**.

### Option A: Lean with Generic Population Types (Recommended)

Create a utility type that represents a populated lean document:

```typescript
import type { FlattenMaps, Require_id } from "mongoose";

// Utility: replace ObjectId fields with their populated types
type Populated<Doc, Populates extends Record<string, unknown>> = Omit<
  FlattenMaps<Require_id<Doc>>,
  keyof Populates
> & Populates;

// Example usage for Lineup:
type PopulatedLineup = Populated<LineupDoc, {
  players: {
    pg: Populated<PlayerDoc, {}>;
    sg: Populated<PlayerDoc, {}>;
    sf: Populated<PlayerDoc, {}>;
    pf: Populated<PlayerDoc, {}>;
    c: Populated<PlayerDoc, {}>;
  };
  owner: Populated<UserDoc, {}>;
}>;
```

Then in routers, explicitly type the return:

```typescript
getLineupById: publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }): Promise<PopulatedLineup | null> => {
    return await LineupModel.findById(input.id)
      .populate(lineupPopulateFields)
      .lean() as PopulatedLineup | null;
  }),
```

This way tRPC infers the output type as `PopulatedLineup`, and clients get properly typed populated data.

### Option B: Explicit Output Schemas with Zod (Most Type-Safe, More Work)

Define Zod schemas for all router outputs:

```typescript
const playerOutput = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  imgUrl: z.string(),
  value: z.number(),
});

const lineupOutput = z.object({
  _id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  featured: z.boolean(),
  players: z.object({
    pg: playerOutput,
    sg: playerOutput,
    // ...
  }),
  owner: userOutput,
  avgRating: z.number(),
  ratingCount: z.number(),
  // ...
});
```

Use `.output(lineupOutput)` on each procedure. tRPC validates + narrows the type. This is the most robust approach but requires defining every output shape.

### Immediate Steps (Prioritized)

#### Step 1: Eliminate `lib/types.ts` Duplication

- Remove `PlayerType`, `UserType`, `LineupType` from `lib/types.ts`
- Replace all imports of these types with the canonical model types (or the new `Populated<>` types)
- Keep the `getId()` utility function — it's genuinely useful
- Keep `GambleResultData` — it's a client-specific DTO

#### Step 2: Create Populated Type Helpers

Add a `src/server/lib/types.ts` (or similar) file with:

- `PopulatedPlayer` — lean player with `_id` as string
- `PopulatedUser` — lean user with `_id` as string  
- `PopulatedLineup` — lean lineup with populated players and owner
- `PopulatedComment` — lean comment with populated user

#### Step 3: Type the Router Returns

For each router that calls `.populate().lean()`, add an explicit return type annotation using the `Populated<>` types. This is the one place where a cast is acceptable — at the boundary between Mongoose and the type system.

#### Step 4: Remove Client-Side Casts

Once tRPC infers the correct output types, remove all `as unknown as LineupType` and `as unknown as Comment` casts on the client. The data should just flow through correctly.

#### Step 5: Fix the `totalVotes` Discrepancy

Decide: does `totalVotes` belong on `Lineup`/`LineupDoc`, or should it be removed from `LineupType`? If it's a computed field, add it as a virtual or compute it in the router. If it's removed, update all components that reference it.

#### Step 6: Clean Up Follow Router Typing

The follow router's `items.map(f => ({ user: f.follower }))` should type `user` as the populated user type, not `ObjectId`. After Step 2-3, this should resolve naturally.

#### Step 7: Fix Migration Scripts

Either add `DATABASE_URL` to the env schema, or update migration scripts to use `MONGODB_URI`. If these migrations are done and won't run again, consider excluding them from `tsconfig` or deleting them.

### What to Keep as Assertions

Some casts are unavoidable and acceptable:

- `mongoose.models.X as Model<XDoc> | undefined` — Mongoose HMR pattern
- `JSON.parse(cached) as T` — no way to infer from JSON.parse
- `(await res.json()) as T` — same for fetch responses
- `globalThis as unknown as { ... }` — singleton pattern
- `as React.CSSProperties` — CSS custom properties
- `formData.get("file") as File | null` — FormData API
- `e.target as Node` — DOM event targets

### What to Never Do

- `as any` — there are currently 5 instances; all should be replaced with proper types
- `as unknown as X` on data flowing from tRPC — this means the type pipeline is broken
- Double-casting to access `_id` (like `(comment as unknown as { _id: string })._id`) — means the type doesn't reflect reality
