# Architecture & Scale Review

This document provides a comprehensive analysis of the Lineup Legends v2 database architecture and documents the current scalable design patterns implemented.

> **Last Updated**: April 2026
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

| Component | Technology  | Notes                             |
| --------- | ----------- | --------------------------------- |
| Database  | MongoDB     | Document store                    |
| ODM       | Mongoose    | Schema validation, virtuals       |
| Cache     | Redis       | Server-side cache via ioredis     |
| API Layer | tRPC        | Type-safe procedures (10 routers) |
| Auth      | NextAuth.js | OAuth (Google) + credentials      |

### Model Summary

| Model               | Purpose                                              | Indexes                                                                                             | Document Size Risk                   |
| ------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `User`              | User accounts & profiles                             | `email` (unique), `username` (unique sparse), `name`                                                | Low                                  |
| `Player`            | Basketball player reference data + Wikipedia profile | `firstName/lastName` (text), `value`                                                                | Low (wiki fields are nullable Mixed) |
| `Lineup`            | User-created fantasy lineups                         | `owner+createdAt`, `owner+updatedAt`, `featured+createdAt`, `avgRating`, `ratingCount`, `createdAt` | Low                                  |
| `Rating`            | Lineup ratings (1-10)                                | `user + lineup` (compound unique)                                                                   | Low                                  |
| `Comment`           | Comments on lineups                                  | `lineup + createdAt`, `user + createdAt`                                                            | Low                                  |
| `Thread`            | Replies to comments                                  | `user + comment + createdAt`                                                                        | Low                                  |
| `CommentVote`       | Comment upvotes/downvotes                            | `user + comment` (compound unique)                                                                  | Low                                  |
| `ThreadVote`        | Thread upvotes/downvotes                             | `user + thread` (compound unique)                                                                   | Low                                  |
| `Follow`            | User follow relationships                            | `follower + following` (unique), `follower`, `following`                                            | Low                                  |
| `Bookmark`          | Saved lineups per user                               | `user + lineup` (unique), `user + createdAt`                                                        | Low                                  |
| `Video`             | Getting Technical videos                             | `youtubeId` (unique)                                                                                | Low                                  |
| `RequestedPlayer`   | Player requests from users                           | `firstName + lastName` (unique, case-insensitive)                                                   | Medium (embedded array)              |
| `Feedback`          | User-submitted feedback                              | `createdAt`                                                                                         | Low                                  |
| `Account`           | OAuth provider links                                 | `provider + providerAccountId`                                                                      | Low                                  |
| `Session`           | Active user sessions                                 | `sessionToken`, `user`, `expires`                                                                   | Low                                  |
| `VerificationToken` | Email verification tokens                            | `identifier + token` (unique)                                                                       | Low                                  |

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
│ followerCount│    │ • avgRating     │    │ • totalVotes  │
│ followingCount    │ • ratingCount   │    └───────┬───────┘
│              │    │ • timesGambled  │            │
└──────┬───────┘    └────────┬────────┘            │
       │                     │              ┌──────▼──────┐
       │                     │              │   Thread    │
       │                     │              │ (separate)  │
       │                     │              │ • totalVotes│
       │                     │              └──────┬──────┘
       │                     │                     │
       │        ┌────────────┼─────────────────────┤
       │        │            │                     │
       │ ┌──────▼──────┐ ┌───▼───────┐ ┌──────────▼──────────┐
       │ │  Bookmark   │ │  Rating   │ │  CommentVote /      │
       │ │ (separate)  │ │ (separate)│ │  ThreadVote          │
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

| Pattern                   | Models                         | Cardinality | Status  |
| ------------------------- | ------------------------------ | ----------- | ------- |
| One-to-Many (Referenced)  | User → Lineup                  | 1:N         | Correct |
| One-to-Many (Referenced)  | Lineup → Rating                | 1:N         | Correct |
| One-to-Many (Referenced)  | Lineup → Comment               | 1:N         | Correct |
| One-to-Many (Referenced)  | Lineup → Bookmark              | 1:N         | Correct |
| One-to-Many (Referenced)  | Comment → Thread               | 1:N         | Correct |
| One-to-Many (Referenced)  | Comment → CommentVote          | 1:N         | Correct |
| One-to-Many (Referenced)  | Thread → ThreadVote            | 1:N         | Correct |
| Many-to-Many (Join Table) | User ↔ User (Follow)           | N:M         | Correct |
| Many-to-Many (Join Table) | User ↔ Lineup (Bookmark)       | N:M         | Correct |
| One-to-Many (Embedded)    | RequestedPlayer → descriptions | 1:N         | Bounded |

---

## Type System Design

All models follow a consistent dual-type pattern:

### API Type vs DB Type

```typescript
// API Type - for responses and client-side usage (after population)
export interface User {
  id: string;
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

## Redis Caching Strategy

### Overview

Redis is used as a server-side cache to reduce MongoDB load for data that is shared across all users and changes infrequently. The cache logic lives in the tRPC router layer, making it explicit and easy to reason about alongside the mutations that invalidate it.

The Redis client (`src/server/redis.ts`) uses the same `globalThis` singleton pattern as the Mongoose connection to prevent duplicate connections during HMR in development.

### Cache-Aside Pattern (Players)

Player data is the primary caching target because it satisfies all three criteria for an effective server-side cache:

1. **Shared across all users** — a single cache entry serves every request
2. **Rarely changes** — only admin mutations (create, update, delete) modify players
3. **Eliminates repeated DB queries** — client-side search uses the cached data for filtering

| Cache Key | Contents        | TTL    | Invalidation                                      |
| --------- | --------------- | ------ | ------------------------------------------------- |
| `players` | All player data | 24 hrs | `player.create`, `player.update`, `player.delete` |

### Cache-Aside Pattern (User Profiles)

Individual user profiles are cached with per-user keys:

| Cache Key       | Contents     | TTL    | Invalidation     |
| --------------- | ------------ | ------ | ---------------- |
| `user:{userId}` | Profile data | varies | `profile.update` |

### TTL-Only Pattern (Admin Stats)

The admin dashboard aggregates counts across 8 collections (13 parallel queries). Explicit invalidation is impractical here because 10+ mutations across 6 routers would each need to invalidate the cache.

| Cache Key     | Contents         | TTL   | Invalidation    |
| ------------- | ---------------- | ----- | --------------- |
| `admin:stats` | Dashboard counts | 5 min | TTL expiry only |

### What's NOT Cached (and Why)

| Data           | Reason                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| User lineups   | Per-user data with frequent mutations; React Query handles the UX well |
| Comments/votes | High write frequency would cause constant invalidation                 |
| Follow lists   | Per-user, paginated, changes on every follow/unfollow                  |
| Random players | Intentionally random per-request; caching defeats the purpose          |
| Bookmarks      | Per-user, changes on every toggle                                      |

---

## Resolved Scale Issues

The following issues from the original architecture review have been resolved:

### 1. Comment Votes Extracted to Separate Collection

**Before**: Embedded `votes[]` array in Comment documents (unbounded)

**After**: `CommentVote` is a separate collection with proper indexes

```typescript
CommentVoteSchema.index({ user: 1, comment: 1 }, { unique: true });
```

**Benefits**: No document size limits, O(1) vote operations, votes can be queried independently.

### 2. Thread Replies Extracted to Separate Collection

**Before**: Embedded `thread[]` array in Comment documents (unbounded)

**After**: `Thread` is a separate collection with `comment` reference

**Benefits**: Threads can grow without limit, efficient pagination of replies, independent querying.

### 3. User Friends Array Removed — Follow Architecture Implemented

**Before**: Redundant `friends[]` embedded array + `Friend` collection

**After**: Single `Follow` collection (Twitter/Instagram pattern) with denormalized counts on User

```typescript
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
```

### 4. Lineup Indexes Improved

Multiple targeted indexes for different query patterns:

```typescript
LineupSchema.index({ owner: 1, createdAt: -1 });
LineupSchema.index({ owner: 1, updatedAt: -1 });
LineupSchema.index({ featured: 1, createdAt: -1 });
LineupSchema.index({ avgRating: -1 });
LineupSchema.index({ ratingCount: -1 });
LineupSchema.index({ createdAt: -1 });
```

### 5. Lineup Popularity Simplified to Ratings Only

**Before**: Both `totalVotes` (upvote/downvote) and ratings on lineups

**After**: Ratings only (`avgRating`, `ratingCount`, `ratingSum`). Comments and threads retain upvote/downvote.

See [Lineup popularity: ratings only](./lineup-ratings-vs-votes-proposal.md).

---

## External API Dependencies

| Service               | Purpose                                   | Rate Limiting                      | Fallback                         |
| --------------------- | ----------------------------------------- | ---------------------------------- | -------------------------------- |
| Wikipedia (MediaWiki) | Player summaries, career stats, awards    | None (respectful fetching)         | Cached data persisted in MongoDB |
| OpenAI (GPT-4o-mini)  | Awards + career stats extraction fallback | 5 req/min per IP (tRPC middleware) | Cheerio parser is primary        |

**Mitigations:**

- Wiki data is fetched once and cached in the Player document with a 7-day staleness window
- `ensureWikiSummary` and `ensureAwardsAI` are `protectedProcedure` (auth required) and rate-limited
- The backfill script runs offline — no rate limiting concern for batch processing
- If `OPENAI_API_KEY` is not set, AI fallbacks silently skip (the app degrades gracefully)

---

## Remaining Considerations

### 1. RequestedPlayer Descriptions Array

**Location**: `src/server/models/requestedPlayer.ts`

The `descriptions` array is still embedded but is lower risk:

**Mitigation options if needed**:

- Cap array at reasonable limit (e.g., 100 descriptions)
- Extract to separate collection if feature becomes popular

### 2. Pagination

Most list endpoints now support cursor-based pagination (comments, threads, followers, following). Lineup list endpoints use simple sorting without cursor pagination — this should be added as lineup counts grow.

### 3. Session TTL Index

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
    avgRating: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    timesGambled: { type: Number, default: 0 },
    lastGambleResult: { type: LastGambleResultSchema, default: undefined },
    gambleStreak: { type: Number, default: 0 },
    lastGambleAt: { type: Date, default: undefined },
    dailyGamblesUsed: { type: Number, default: 0 },
    dailyGamblesResetAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

LineupSchema.index({ owner: 1, createdAt: -1 });
LineupSchema.index({ owner: 1, updatedAt: -1 });
LineupSchema.index({ featured: 1, createdAt: -1 });
LineupSchema.index({ avgRating: -1 });
LineupSchema.index({ ratingCount: -1 });
LineupSchema.index({ createdAt: -1 });
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
    comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ThreadSchema.index({ user: 1, comment: 1, createdAt: -1 });
```

### Bookmark

```typescript
const BookmarkSchema = new Schema<BookmarkDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lineup: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
  },
  { timestamps: true },
);

BookmarkSchema.index({ user: 1, lineup: 1 }, { unique: true });
BookmarkSchema.index({ user: 1, createdAt: -1 });
```

### Video

```typescript
const VideoSchema = new Schema<VideoDoc>(
  {
    youtubeId: { type: String, required: true, unique: true },
    title: { type: String, required: true, maxlength: 500 },
    description: { type: String, default: "" },
    thumbnailUrl: { type: String, required: true },
    duration: { type: String, default: "" },
    timestamps: { type: [VideoTimestampSchema], default: [] },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);
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
