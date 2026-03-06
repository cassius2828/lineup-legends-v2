# Architecture & Scale Review

This document provides a comprehensive analysis of the Lineup Legends v2 database architecture and documents the current scalable design patterns implemented.

> **Last Updated**: March 2026  
> **Status**: Implemented

---

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [Model Relationships](#model-relationships)
3. [Type System Design](#type-system-design)
4. [Resolved Scale Issues](#resolved-scale-issues)
5. [Remaining Considerations](#remaining-considerations)
6. [Monitoring & Validation](#monitoring--validation)

---

## Current Architecture Overview

### Technology Stack

| Component | Technology  | Notes                                      |
| --------- | ----------- | ------------------------------------------ |
| Database  | MongoDB     | Document store                             |
| ODM       | Mongoose    | Schema validation, virtuals                |
| Cache     | Redis       | Server-side cache via ioredis              |
| API Layer | tRPC        | Type-safe procedures                       |
| Auth      | NextAuth.js | OAuth + credentials                        |

### Model Summary

| Model               | Purpose                          | Indexes                                                     | Document Size Risk |
| ------------------- | -------------------------------- | ----------------------------------------------------------- | ------------------ |
| `User`              | User accounts & profiles         | `email` (unique), `username` (unique sparse)                | Low ✅             |
| `Player`            | Basketball player reference data | `firstName/lastName` (text), `value`                        | Low ✅             |
| `Lineup`            | User-created fantasy lineups     | `owner`, `avgRating`, `totalVotes`, `createdAt`, `featured` | Low ✅             |
| `LineupVote`        | Lineup upvotes/downvotes         | `user + lineup` (compound unique)                           | Low ✅             |
| `Rating`            | Lineup ratings (1-10)            | `user + lineup` (compound unique)                           | Low ✅             |
| `Comment`           | Comments on lineups              | `lineup + createdAt`, `user + createdAt`                    | Low ✅             |
| `Thread`            | Replies to comments              | `user + createdAt`                                          | Low ✅             |
| `CommentVote`       | Comment upvotes/downvotes        | `user + comment` (compound unique)                          | Low ✅             |
| `Follow`            | User follow relationships        | `follower + following` (unique), `follower`, `following`    | Low ✅             |
| `RequestedPlayer`   | Player requests from users       | `firstName + lastName` (unique, case-insensitive)           | Medium ⚠️          |
| `Account`           | OAuth provider links             | `provider + providerAccountId`                              | Low ✅             |
| `Session`           | Active user sessions             | `sessionToken`, `user`, `expires`                           | Low ✅             |
| `VerificationToken` | Email verification tokens        | `identifier + token` (unique)                               | Low ✅             |

---

## Model Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIP DIAGRAM                      │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │    Player    │
                              │  (static)    │
                              └──────┬───────┘
                                     │
                      ┌──────────────┼──────────────┐
                      │ pg,sg,sf,pf,c│              │
                      ▼              │              │
┌──────────────┐    ┌─────────────────┐    ┌───────────────┐
│    User      │◄───│     Lineup      │───►│    Comment    │
│              │    │                 │    │               │
│ followerCount│    │ • totalVotes    │    │ • totalVotes  │
│ followingCount    │ • avgRating     │    └───────┬───────┘
│              │    │ • timesGambled  │            │
└──────┬───────┘    └────────┬────────┘            │
       │                     │              ┌──────▼──────┐
       │                     │              │   Thread    │
       │                     │              │ (separate)  │
       │                     │              └──────┬──────┘
       │                     │                     │
       │        ┌────────────┼─────────────────────┤
       │        │            │                     │
       │ ┌──────▼──────┐ ┌───▼───────┐ ┌──────────▼──────────┐
       │ │ LineupVote  │ │  Rating   │ │     CommentVote     │
       │ │ (separate)  │ │ (separate)│ │     (separate)      │
       │ └─────────────┘ └───────────┘ └─────────────────────┘
       │
       │              ┌─────────────┐
       └─────────────►│   Follow    │
                      │ (separate)  │
                      └─────────────┘

 Legend:
   ────►  Reference (ObjectId)
   All relationships use separate collections (no unbounded embedded arrays)
```

### Relationship Patterns

| Pattern                   | Models                         | Cardinality | Status     |
| ------------------------- | ------------------------------ | ----------- | ---------- |
| One-to-Many (Referenced)  | User → Lineup                  | 1:N         | ✅ Correct |
| One-to-Many (Referenced)  | Lineup → LineupVote            | 1:N         | ✅ Correct |
| One-to-Many (Referenced)  | Lineup → Rating                | 1:N         | ✅ Correct |
| One-to-Many (Referenced)  | Lineup → Comment               | 1:N         | ✅ Correct |
| One-to-Many (Referenced)  | Comment → Thread               | 1:N         | ✅ Correct |
| One-to-Many (Referenced)  | Comment → CommentVote          | 1:N         | ✅ Correct |
| Many-to-Many (Join Table) | User ↔ User (Follow)           | N:M         | ✅ Correct |
| One-to-Many (Embedded)    | RequestedPlayer → descriptions | 1:N         | ⚠️ Bounded |

---

## Type System Design

All models follow a consistent dual-type pattern:

### API Type vs DB Type

```typescript
// API Type - for responses and client-side usage (after population)
export interface User {
  id: string; // String ID for client
  name: string;
  followerCount: number;
  followingCount: number;
  // ... other fields
}

// DB Type - for database operations
export interface UserDoc extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  followerCount: number;
  followingCount: number;
  // ... other fields
}
```

### Reference Types

| Context               | Reference Type | Example                |
| --------------------- | -------------- | ---------------------- |
| API Type (populated)  | Full object    | `user: User`           |
| DB Type (unpopulated) | ObjectId       | `user: Types.ObjectId` |

### Model Naming Convention

| Export      | Type           | Usage                    |
| ----------- | -------------- | ------------------------ |
| `UserModel` | Mongoose Model | Database operations      |
| `User`      | API interface  | Response types, client   |
| `UserDoc`   | DB interface   | Server-side document ops |

---

## Resolved Scale Issues

The following issues from the original architecture review have been resolved:

### ✅ 1. Comment Votes Extracted to Separate Collection

**Before**: Embedded `votes[]` array in Comment documents (unbounded)

**After**: `CommentVote` is a separate collection with proper indexes

```typescript
// src/server/models/commentVote.ts
const CommentVoteSchema = new Schema<CommentVoteDoc>({
  type: { type: String, enum: ["upvote", "downvote"], required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  createdAt: { type: Date, default: Date.now },
});

CommentVoteSchema.index({ user: 1, comment: 1 }, { unique: true });
```

**Benefits**:

- No document size limits
- O(1) vote operations
- Votes can be queried independently

---

### ✅ 2. Thread Replies Extracted to Separate Collection

**Before**: Embedded `thread[]` array in Comment documents (unbounded)

**After**: `Thread` is a separate collection

```typescript
// src/server/models/threads.ts
const ThreadSchema = new Schema<ThreadDoc>(
  {
    text: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ThreadSchema.index({ user: 1, createdAt: -1 });
```

**Benefits**:

- Threads can grow without limit
- Efficient pagination of replies
- Independent querying

---

### ✅ 3. User Friends Array Removed - Follow Architecture Implemented

**Before**: Redundant `friends[]` embedded array + `Friend` collection

**After**: Single `Follow` collection (Twitter/Instagram pattern)

```typescript
// src/server/models/follow.ts
const FollowSchema = new Schema<FollowDoc>(
  {
    follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ following: 1 });
FollowSchema.index({ follower: 1 });
FollowSchema.index({ follower: 1, createdAt: -1 });
FollowSchema.index({ following: 1, createdAt: -1 });
```

**User model now has denormalized counts**:

```typescript
// src/server/models/user.ts
followerCount: { type: Number, default: 0 },
followingCount: { type: Number, default: 0 },
```

**Query patterns**:

```typescript
// Get followers
await FollowModel.find({ following: userId }).populate("follower");

// Get following
await FollowModel.find({ follower: userId }).populate("following");

// Check if following
await FollowModel.exists({ follower: userA, following: userB });

// Mutual follow (friends)
const [aFollowsB, bFollowsA] = await Promise.all([
  FollowModel.exists({ follower: userA, following: userB }),
  FollowModel.exists({ follower: userB, following: userA }),
]);
const areMutualFollowers = aFollowsB && bFollowsA;
```

---

### ✅ 4. Lineup Indexes Improved

**Before**: Single compound index

**After**: Multiple targeted indexes for different query patterns

```typescript
// src/server/models/lineup.ts
LineupSchema.index({ owner: 1, createdAt: -1 }); // User's lineups
LineupSchema.index({ owner: 1, updatedAt: -1 }); // User's updated lineups
LineupSchema.index({ featured: 1, createdAt: -1 }); // Featured lineups
LineupSchema.index({ avgRating: -1 }); // Top rated
LineupSchema.index({ totalVotes: -1 }); // Most popular
LineupSchema.index({ createdAt: -1 }); // Newest
```

---

## Redis Caching Strategy

### Overview

Redis is used as a server-side cache to reduce MongoDB load for data that is shared across all users and changes infrequently. The cache logic lives in the tRPC router layer, making it explicit and easy to reason about alongside the mutations that invalidate it.

The Redis client (`src/server/redis.ts`) uses the same `globalThis` singleton pattern as the Mongoose connection to prevent duplicate connections during HMR in development.

### Cache-Aside Pattern (Players)

Player data is the primary caching target because it satisfies all three criteria for an effective server-side cache:

1. **Shared across all users** — a single cache entry serves every request
2. **Rarely changes** — only admin mutations (create, update, delete) modify players
3. **Eliminates repeated DB queries** — client-side search uses the cached data for filtering

```
User request → Check Redis → Hit? → Return cached data
                            → Miss? → Query MongoDB → Store in Redis → Return
```

| Cache Key | Contents         | TTL    | Invalidation                                      |
| --------- | ---------------- | ------ | ------------------------------------------------- |
| `players` | All player data  | 24 hrs | `player.create`, `player.update`, `player.delete` |

All read endpoints (`getAll`, `getById`, `search`) pull from the same `players` key and filter in-memory. This avoids managing multiple cache keys while keeping invalidation to a single `redis.del("players")` call.

### TTL-Only Pattern (Admin Stats)

The admin dashboard aggregates counts across 8 collections (13 parallel queries). Explicit invalidation is impractical here because 10+ mutations across 6 routers would each need to invalidate the cache.

Instead, the cache relies solely on TTL expiry:

| Cache Key     | Contents          | TTL   | Invalidation   |
| ------------- | ----------------- | ----- | -------------- |
| `admin:stats` | Dashboard counts  | 5 min | TTL expiry only |

This trades a small window of staleness (acceptable for aggregate counts) for dramatically simpler code.

### What's NOT Cached (and Why)

| Data              | Reason                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| User lineups      | Per-user data with frequent mutations; React Query handles the UX well |
| Comments/votes    | High write frequency would cause constant invalidation                 |
| Follow lists      | Per-user, paginated, changes on every follow/unfollow                  |
| Random players    | Intentionally random per-request; caching defeats the purpose          |
| User profiles     | Candidate for future caching (5 parallel queries, shared, infrequent changes) |

---

## Remaining Considerations

### ⚠️ 1. RequestedPlayer Descriptions Array

**Location**: `src/server/models/requestedPlayer.ts`

The `descriptions` array is still embedded but is lower risk:

```typescript
const RequestedPlayerSchema = new Schema<RequestedPlayerDoc>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  descriptions: [ValueDescriptionSchema], // ⚠️ Embedded but bounded by feature usage
});
```

**Mitigation options if needed**:

- Cap array at reasonable limit (e.g., 100 descriptions)
- Extract to separate collection if feature becomes popular

---

### 📋 2. Pagination Implementation Needed

List endpoints should implement cursor-based pagination:

```typescript
// Recommended pattern
getAllLineups: publicProcedure
  .input(
    z.object({
      sort: z
        .enum(["newest", "oldest", "highest-rated", "most-votes"])
        .default("newest"),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    const { sort, limit, cursor } = input;
    // ... cursor-based pagination logic
  });
```

---

### 📋 3. Session TTL Index

Consider adding TTL index for automatic session cleanup:

```typescript
SessionSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });
```

---

## Current Model Schemas

### User

```typescript
const UserSchema = new Schema<UserDoc>({
  name: { type: String, required: true },
  password: { type: String, required: false, default: null },
  username: { type: String, required: false, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Date, default: null },
  image: { type: String, default: null },
  bio: { type: String, default: null, maxlength: 250 },
  profileImg: { type: String, default: null },
  bannerImg: { type: String, default: null },
  socialMedia: { type: SocialMediaSchema, default: null },
  followerCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  newEmail: { type: String, default: null },
  emailConfirmationToken: { type: String, default: null },
  admin: { type: Boolean, default: false },
});
```

### Follow

```typescript
const FollowSchema = new Schema<FollowDoc>(
  {
    follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ following: 1 });
FollowSchema.index({ follower: 1 });
FollowSchema.index({ follower: 1, createdAt: -1 });
FollowSchema.index({ following: 1, createdAt: -1 });
```

### Comment

```typescript
const CommentSchema = new Schema<CommentDoc>(
  {
    text: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lineup: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CommentSchema.index({ lineup: 1, createdAt: -1 });
CommentSchema.index({ user: 1, createdAt: -1 });
```

### Thread

```typescript
const ThreadSchema = new Schema<ThreadDoc>(
  {
    text: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ThreadSchema.index({ user: 1, createdAt: -1 });
```

### CommentVote

```typescript
const CommentVoteSchema = new Schema<CommentVoteDoc>({
  type: { type: String, enum: ["upvote", "downvote"], required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  createdAt: { type: Date, default: Date.now },
});

CommentVoteSchema.index({ user: 1, comment: 1 }, { unique: true });
```

### Lineup

```typescript
const LineupSchema = new Schema<LineupDoc>(
  {
    featured: { type: Boolean, default: false },
    players: {
      pg: { type: Schema.Types.ObjectId, ref: "Player", required: true },
      sg: { type: Schema.Types.ObjectId, ref: "Player", required: true },
      sf: { type: Schema.Types.ObjectId, ref: "Player", required: true },
      pf: { type: Schema.Types.ObjectId, ref: "Player", required: true },
      c: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalVotes: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    timesGambled: { type: Number, default: 0 },
  },
  { timestamps: true },
);

LineupSchema.index({ owner: 1, createdAt: -1 });
LineupSchema.index({ owner: 1, updatedAt: -1 });
LineupSchema.index({ featured: 1, createdAt: -1 });
LineupSchema.index({ avgRating: -1 });
LineupSchema.index({ totalVotes: -1 });
LineupSchema.index({ createdAt: -1 });
```

---

## Monitoring & Validation

### Key Metrics to Track

| Metric                     | Tool                    | Alert Threshold |
| -------------------------- | ----------------------- | --------------- |
| Document size              | MongoDB Atlas / mongosh | > 1MB           |
| Query execution time (P99) | Application logs        | > 500ms         |
| Memory usage               | MongoDB Atlas           | > 80%           |
| Index hit ratio            | db.collection.stats()   | < 95%           |

### Validation Queries

```javascript
// Check for oversized documents
db.comments
  .find({
    $expr: { $gt: [{ $bsonSize: "$$ROOT" }, 1048576] },
  })
  .count();

// Check index usage
db.comments.aggregate([{ $indexStats: {} }]);

// Verify follow counts match
db.follows.aggregate([
  { $group: { _id: "$following", count: { $sum: 1 } } },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
  { $match: { $expr: { $ne: ["$count", "$user.followerCount"] } } },
]);
```

---

## References

- [MongoDB Document Size Limits](https://www.mongodb.com/docs/manual/reference/limits/#bson-document-size)
- [MongoDB Data Modeling Patterns](https://www.mongodb.com/docs/manual/applications/data-models/)
- [Mongoose Index Documentation](https://mongoosejs.com/docs/guide.html#indexes)
