# Architecture & Scale Review

This document provides a comprehensive analysis of the current Lineup Legends v2 database architecture, identifies scalability issues, and proposes solutions with detailed migration plans.

> **Last Updated**: January 2026  
> **Status**: Planning Phase

---

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [Model Relationships](#model-relationships)
3. [Identified Scale Issues](#identified-scale-issues)
4. [Proposed Solutions](#proposed-solutions)
5. [Migration Plans](#migration-plans)
6. [Implementation Priority](#implementation-priority)
7. [Monitoring & Validation](#monitoring--validation)

---

## Current Architecture Overview

### Technology Stack

| Component | Technology  | Notes                       |
| --------- | ----------- | --------------------------- |
| Database  | MongoDB     | Document store              |
| ODM       | Mongoose    | Schema validation, virtuals |
| API Layer | tRPC        | Type-safe procedures        |
| Auth      | NextAuth.js | OAuth + credentials         |

### Model Summary

| Model             | Purpose                          | Indexes                                         | Document Size Risk                                |
| ----------------- | -------------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| `User`            | User accounts & profiles         | `email` (unique), `username` (unique sparse)    | **Medium** - embedded `friends` array             |
| `Player`          | Basketball player reference data | `firstName/lastName` (text), `value`            | Low - static data                                 |
| `Lineup`          | User-created fantasy lineups     | `ownerId`, `avgRating`, `totalVotes` (compound) | Low - fixed structure                             |
| `Vote`            | Lineup upvotes/downvotes         | `userId + lineupId` (compound unique)           | Low - simple documents                            |
| `Rating`          | Lineup ratings (1-10)            | `userId + lineupId` (compound unique)           | Low - simple documents                            |
| `Comment`         | Comments on lineups              | `lineupId + createdAt`                          | **Critical** - embedded `votes` + `thread` arrays |
| `Friend`          | Friend relationships             | `requesterId + recipientId`, `status`           | Low - simple documents                            |
| `RequestedPlayer` | Player requests from users       | `firstName + lastName` (unique)                 | **Medium** - embedded `descriptions` array        |
| `Account`         | OAuth provider links             | `provider + providerAccountId`                  | Low                                               |
| `Session`         | Active user sessions             | `sessionToken`                                  | **Medium** - no TTL index                         |

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
│ • friends[]  │    │ • totalVotes    │    │ • votes[]     │ ◄── UNBOUNDED
│   (embedded) │    │ • avgRating     │    │ • thread[]    │ ◄── UNBOUNDED
│              │    │ • timesGambled  │    │   └─ votes[]  │ ◄── UNBOUNDED
└──────┬───────┘    └────────┬────────┘    └───────────────┘
       │                     │
       │                     ├─────────────────────────┐
       │                     │                         │
       │              ┌──────▼──────┐          ┌───────▼──────┐
       │              │    Vote     │          │    Rating    │
       │              │ (separate)  │          │  (separate)  │
       │              └─────────────┘          └──────────────┘
       │
       │              ┌─────────────┐
       └─────────────►│   Friend    │
                      │ (join table)│
                      └─────────────┘

 Legend:
   ────►  Reference (ObjectId)
   []     Embedded array (potential scale issue)
```

### Relationship Patterns

| Pattern                   | Models               | Cardinality | Issue                               |
| ------------------------- | -------------------- | ----------- | ----------------------------------- |
| One-to-Many (Referenced)  | User → Lineup        | 1:N         | ✅ Correct                          |
| One-to-Many (Referenced)  | Lineup → Vote        | 1:N         | ✅ Correct                          |
| One-to-Many (Referenced)  | Lineup → Rating      | 1:N         | ✅ Correct                          |
| One-to-Many (Referenced)  | Lineup → Comment     | 1:N         | ✅ Correct                          |
| One-to-Many (Embedded)    | Comment → votes[]    | 1:N         | ❌ Unbounded                        |
| One-to-Many (Embedded)    | Comment → thread[]   | 1:N         | ❌ Unbounded                        |
| One-to-Many (Embedded)    | Thread → votes[]     | 1:N         | ❌ Unbounded                        |
| One-to-Many (Embedded)    | User → friends[]     | 1:N         | ⚠️ Redundant with Friend collection |
| Many-to-Many (Join Table) | User ↔ User (Friend) | N:M         | ✅ Correct                          |

---

## Identified Scale Issues

### Critical Issues (P0)

#### 1. Unbounded Comment Votes Array

**Location**: `src/server/models/comment.ts`

```typescript
const CommentSchema = new Schema<IComment>({
  // ...
  votes: [CommentVoteSchema], // ❌ Unbounded array
  totalVotes: { type: Number, default: 0 },
  thread: [ThreadSchema], // ❌ Unbounded array
});
```

**Problem**:

- MongoDB documents are limited to **16MB**
- A viral comment could receive millions of votes
- Each vote is ~50 bytes minimum (ObjectId + type + \_id)
- At 100,000 votes: ~5MB just for votes array
- Reading/updating requires loading entire document into memory

**Impact at Scale**:

- Document size limit exceeded → Data loss/corruption
- Memory pressure on MongoDB server
- Slow read/write operations
- Lock contention on popular comments

**Current Query Pattern**:

```typescript
// src/server/api/routers/lineup.ts - voteComment
const comment = await Comment.findOne({ _id, lineupId });
processCommentVote(comment.votes, userId, type, comment.totalVotes);
await comment.save(); // Rewrites entire document
```

---

#### 2. Unbounded Thread Replies with Nested Votes

**Location**: `src/server/models/comment.ts`

```typescript
const ThreadSchema = new Schema<IThread>({
  text: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  votes: [CommentVoteSchema], // ❌ Each reply has unbounded votes
  totalVotes: { type: Number, default: 0 },
});

const CommentSchema = new Schema<IComment>({
  thread: [ThreadSchema], // ❌ Unbounded replies, each with unbounded votes
});
```

**Problem**:

- Nested unbounded arrays compound the issue
- A popular comment thread could have:
  - 1000 replies × 10,000 votes each = 10M embedded vote documents
- Finding a specific thread reply requires O(n) array scan

**Impact at Scale**:

- Exponentially worse than comment votes alone
- Thread operations become O(n²) where n = thread length

---

#### 3. No Pagination on Explore Page

**Location**: `src/server/api/routers/lineup.ts`

```typescript
// getAllLineups - returns ALL lineups
getAllLineups: publicProcedure
  .input(z.object({ sort: z.enum([...]).optional() }).optional())
  .query(async ({ input }) => {
    return await Lineup.find()
      .sort(sortOption)
      .populate(lineupPopulateFields)
      .lean();  // ❌ No limit, no cursor
  }),
```

**Problem**:

- Returns entire collection in single response
- Memory exhaustion with large datasets
- Network timeout on slow connections

**Impact at Scale**:

- At 1M lineups with 5 player populates + owner: ~100MB+ response
- Server OOM kills
- Client browser crashes

---

### High Priority Issues (P1)

#### 4. User Friends Embedded Array

**Location**: `src/server/models/user.ts`

```typescript
const UserSchema = new Schema<IUser>({
  // ...
  friends: [{ type: Schema.Types.ObjectId, ref: "User" }], // ❌ Redundant + unbounded
});
```

**Problem**:

- Redundant with `Friend` collection
- Popular users could have 10,000+ friends
- Every user lookup loads entire friends array
- Auth checks become slow for popular users

**Current State**:

```
User.friends[]  ──┐
                  ├── Duplicated data, sync issues
Friend collection ──┘
```

---

#### 5. Average Rating O(n) Recalculation

**Location**: `src/lib/utils.ts`

```typescript
export async function recalculateAvgRating(lineupId: string) {
  const ratings = await Rating.aggregate([
    { $match: { lineupId: new mongoose.Types.ObjectId(lineupId) } },
    { $group: { _id: "$lineupId", avgRating: { $avg: "$value" } } },
  ]);

  const avgRating = ratings[0]?.avgRating ?? 0;
  await Lineup.findByIdAndUpdate(lineupId, { avgRating });
  return avgRating;
}
```

**Problem**:

- Every rating triggers aggregation over all ratings for that lineup
- At 100,000 ratings per lineup: O(100k) per rating submission
- At 10 ratings/second: 1M document scans per second

**Better Approach**:
Store running sum and count, calculate average on read:

```
avgRating = ratingSum / ratingCount  // O(1)
```

---

### Medium Priority Issues (P2)

#### 6. Missing Database Indexes

**Session Model** - No TTL index:

```typescript
// Current
const SessionSchema = new Schema<ISession>({
  expires: { type: Date, required: true }, // No TTL
});

// Should have
SessionSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });
```

**Account Model** - No userId index:

```typescript
// Current: Only has provider + providerAccountId unique index
// Missing: Index for "find accounts by user" queries
AccountSchema.index({ userId: 1 });
```

**User Model** - Missing common query indexes:

```typescript
// Email and username are unique but could benefit from explicit indexes
// for case-insensitive lookups
```

---

#### 7. RequestedPlayer Descriptions Array

**Location**: `src/server/models/requestedPlayer.ts`

```typescript
const RequestedPlayerSchema = new Schema<IRequestedPlayer>({
  descriptions: [ValueDescriptionSchema], // ⚠️ Unbounded
});
```

**Problem**:

- Less critical than comments (lower volume feature)
- Could still grow large for frequently requested players

---

## Proposed Solutions

### Solution 1: Extract Comment Votes to Separate Collection

**New Model**: `CommentVote`

```typescript
// src/server/models/commentVote.ts (NEW)
export interface ICommentVote extends Document {
  _id: mongoose.Types.ObjectId;
  commentId: Types.ObjectId;
  threadId?: Types.ObjectId; // null for parent comment, set for thread reply
  userId: Types.ObjectId;
  type: "upvote" | "downvote";
  createdAt: Date;
}

const CommentVoteSchema = new Schema<ICommentVote>({
  commentId: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  threadId: { type: Schema.Types.ObjectId, default: null },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["upvote", "downvote"], required: true },
  createdAt: { type: Date, default: Date.now },
});

// Indexes
CommentVoteSchema.index({ commentId: 1, userId: 1 }, { unique: true });
CommentVoteSchema.index({ commentId: 1, threadId: 1, userId: 1 });
CommentVoteSchema.index({ userId: 1 }); // For "my votes" queries
```

**Updated Comment Model**:

```typescript
// Remove embedded votes array
const CommentSchema = new Schema<IComment>({
  text: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  lineupId: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
  // votes: [CommentVoteSchema],  // ❌ REMOVE
  totalVotes: { type: Number, default: 0 }, // Keep denormalized count
  thread: [ThreadSchema],
});
```

**Benefits**:

- No document size limit issues
- O(1) vote operations with $inc
- Can query votes independently (e.g., "my recent votes")
- Indexes optimize all vote lookups

---

### Solution 2: Extract Thread Replies to Separate Collection (Optional)

For extreme scale, thread replies could also be extracted:

```typescript
// src/server/models/threadReply.ts (NEW - OPTIONAL)
export interface IThreadReply extends Document {
  _id: mongoose.Types.ObjectId;
  commentId: Types.ObjectId;
  text: string;
  userId: Types.ObjectId;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadReplySchema = new Schema<IThreadReply>(
  {
    commentId: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
    text: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalVotes: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ThreadReplySchema.index({ commentId: 1, createdAt: 1 });
```

**Alternative: Capped Thread Array**:

If extraction is too complex, cap the thread array:

```typescript
// In addThreadReply mutation
if (comment.thread.length >= 100) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Thread limit reached. Start a new comment.",
  });
}
```

---

### Solution 3: Add Pagination to All List Endpoints

**Updated getAllLineups**:

```typescript
getAllLineups: publicProcedure
  .input(z.object({
    sort: z.enum(["newest", "oldest", "highest-rated", "most-votes"])
      .optional().default("newest"),
    limit: z.number().min(1).max(50).optional().default(20),
    cursor: z.string().optional(),
  }))
  .query(async ({ input }) => {
    const { sort, limit, cursor } = input;

    const sortOption = getSortOption(sort);
    const query: Record<string, unknown> = {};

    if (cursor) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const lineups = await Lineup.find(query)
      .sort(sortOption)
      .limit(limit + 1)
      .populate(lineupPopulateFields)
      .lean();

    const hasMore = lineups.length > limit;
    if (hasMore) lineups.pop();

    return {
      lineups,
      hasMore,
      nextCursor: lineups[lineups.length - 1]?._id?.toString(),
    };
  }),
```

---

### Solution 4: Remove User.friends Array

**Migration**: Remove `friends[]` from User, use only `Friend` collection.

```typescript
// Updated User model
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  // ... other fields
  // friends: [{ type: Schema.Types.ObjectId, ref: "User" }],  // ❌ REMOVE
});
```

**Updated Friend Queries**:

```typescript
// Get user's friends
const friends = await Friend.find({
  $or: [
    { requesterId: userId, status: "accepted" },
    { recipientId: userId, status: "accepted" },
  ],
}).populate("requesterId recipientId");

// Get friend count
const friendCount = await Friend.countDocuments({
  $or: [
    { requesterId: userId, status: "accepted" },
    { recipientId: userId, status: "accepted" },
  ],
});
```

---

### Solution 5: Atomic Rating Updates

**Updated Lineup Schema**:

```typescript
const LineupSchema = new Schema<ILineup>({
  // ... existing fields
  totalVotes: { type: Number, default: 0 },
  // avgRating: { type: Number, default: 0 },  // Keep for read optimization
  ratingSum: { type: Number, default: 0 }, // NEW
  ratingCount: { type: Number, default: 0 }, // NEW
  timesGambled: { type: Number, default: 0 },
});

// Virtual for average rating (calculated on read)
LineupSchema.virtual("avgRating").get(function () {
  if (this.ratingCount === 0) return 0;
  return this.ratingSum / this.ratingCount;
});
```

**Updated Rate Mutation**:

```typescript
rate: protectedProcedure
  .input(z.object({
    lineupId: z.string(),
    value: z.number().min(1).max(10),
  }))
  .mutation(async ({ ctx, input }) => {
    // Check for existing rating
    const existing = await Rating.findOne({
      userId: ctx.session.user.id,
      lineupId: input.lineupId,
    });

    if (existing) {
      // Update existing rating
      const delta = input.value - existing.value;
      await Rating.findByIdAndUpdate(existing._id, { value: input.value });
      await Lineup.findByIdAndUpdate(input.lineupId, {
        $inc: { ratingSum: delta },
      });
    } else {
      // New rating
      await Rating.create({
        userId: ctx.session.user.id,
        lineupId: input.lineupId,
        value: input.value,
      });
      await Lineup.findByIdAndUpdate(input.lineupId, {
        $inc: { ratingSum: input.value, ratingCount: 1 },
      });
    }

    const lineup = await Lineup.findById(input.lineupId).select("ratingSum ratingCount");
    return { avgRating: lineup.ratingSum / lineup.ratingCount };
  }),
```

---

### Solution 6: Add Missing Indexes

```typescript
// Session - TTL index for automatic cleanup
SessionSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

// Account - userId for user account lookups
AccountSchema.index({ userId: 1 });

// User - explicit indexes for common queries
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

// Comment - for getting user's comments
CommentSchema.index({ userId: 1, createdAt: -1 });

// Vote - for getting user's votes
VoteSchema.index({ userId: 1, createdAt: -1 });

// Rating - for getting user's ratings
RatingSchema.index({ userId: 1, createdAt: -1 });
```

---

## Migration Plans

### Migration 1: Comment Votes Extraction

**Estimated Effort**: 4-6 hours  
**Risk Level**: Medium (data transformation)  
**Downtime**: None (can run online)

#### Phase 1: Preparation

1. **Create new CommentVote model** in `src/server/models/commentVote.ts`
2. **Add indexes** before migration runs
3. **Create backup** of comments collection

```bash
# Backup command
mongodump --uri="$MONGODB_URI" --collection=comments --out=./backups/pre-vote-migration
```

#### Phase 2: Migration Script

```typescript
// scripts/migrate-comment-votes.ts
import mongoose from "mongoose";
import { Comment, CommentVote } from "~/server/models";

async function migrateCommentVotes() {
  const batchSize = 100;
  let processed = 0;
  let cursor = null;

  console.log("Starting comment votes migration...");

  while (true) {
    const query: Record<string, unknown> = {
      "votes.0": { $exists: true }, // Only comments with votes
    };
    if (cursor) {
      query._id = { $gt: cursor };
    }

    const comments = await Comment.find(query)
      .sort({ _id: 1 })
      .limit(batchSize)
      .lean();

    if (comments.length === 0) break;

    for (const comment of comments) {
      // Extract parent comment votes
      const parentVotes = comment.votes.map((vote) => ({
        commentId: comment._id,
        threadId: null,
        userId: vote.userId,
        type: vote.type,
        createdAt: vote.createdAt ?? new Date(),
      }));

      // Extract thread reply votes
      const threadVotes = comment.thread.flatMap((thread) =>
        (thread.votes ?? []).map((vote) => ({
          commentId: comment._id,
          threadId: thread._id,
          userId: vote.userId,
          type: vote.type,
          createdAt: vote.createdAt ?? new Date(),
        })),
      );

      const allVotes = [...parentVotes, ...threadVotes];

      if (allVotes.length > 0) {
        // Insert with ordered: false to continue on duplicates
        await CommentVote.insertMany(allVotes, { ordered: false }).catch(
          (err) => {
            // Ignore duplicate key errors
            if (err.code !== 11000) throw err;
          },
        );
      }

      processed++;
    }

    cursor = comments[comments.length - 1]?._id;
    console.log(`Processed ${processed} comments...`);
  }

  console.log(`Migration complete. Processed ${processed} comments.`);
}

// Run migration
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => migrateCommentVotes())
  .then(() => mongoose.disconnect());
```

#### Phase 3: Update Application Code

1. **Update vote queries** to use `CommentVote` collection
2. **Update vote mutations** to use `CommentVote` collection
3. **Add dual-write** temporarily (write to both old and new)

```typescript
// Temporary dual-write during migration
voteComment: protectedProcedure
  .mutation(async ({ ctx, input }) => {
    // Write to new collection (primary)
    await CommentVote.findOneAndUpdate(
      { commentId: input.commentId, userId: ctx.session.user.id, threadId: null },
      { type: input.type },
      { upsert: true }
    );

    // Update denormalized count
    const voteCount = await CommentVote.countDocuments({
      commentId: input.commentId,
      threadId: null,
    });
    const upvotes = await CommentVote.countDocuments({
      commentId: input.commentId,
      threadId: null,
      type: "upvote",
    });
    const totalVotes = upvotes - (voteCount - upvotes);

    await Comment.findByIdAndUpdate(input.commentId, { totalVotes });

    return { totalVotes };
  }),
```

#### Phase 4: Cleanup

1. **Remove embedded votes** from Comment documents (optional, can be done later)
2. **Remove dual-write** code
3. **Update types** to remove `votes[]` from Comment interface

```typescript
// Cleanup script - remove embedded votes (run after verification)
await Comment.updateMany({}, { $unset: { votes: 1, "thread.$[].votes": 1 } });
```

---

### Migration 2: Remove User.friends Array

**Estimated Effort**: 2-3 hours  
**Risk Level**: Low (data already exists in Friend collection)  
**Downtime**: None

#### Phase 1: Verify Data Consistency

```typescript
// scripts/verify-friends-consistency.ts
async function verifyFriendsConsistency() {
  const users = await User.find({ "friends.0": { $exists: true } }).lean();

  let mismatches = 0;

  for (const user of users) {
    const friendRecords = await Friend.find({
      $or: [
        { requesterId: user._id, status: "accepted" },
        { recipientId: user._id, status: "accepted" },
      ],
    });

    const friendIdsFromRecords = new Set(
      friendRecords.map((f) =>
        f.requesterId.toString() === user._id.toString()
          ? f.recipientId.toString()
          : f.requesterId.toString(),
      ),
    );

    const embeddedFriendIds = new Set(user.friends.map((f) => f.toString()));

    if (friendIdsFromRecords.size !== embeddedFriendIds.size) {
      console.log(`Mismatch for user ${user._id}:`);
      console.log(`  Friend collection: ${friendIdsFromRecords.size}`);
      console.log(`  Embedded array: ${embeddedFriendIds.size}`);
      mismatches++;
    }
  }

  console.log(`Total mismatches: ${mismatches}`);
}
```

#### Phase 2: Update Application Code

1. **Search for `User.friends` references** and replace with Friend collection queries
2. **Update populate calls** that include friends

```bash
# Find all references to User.friends
rg "\.friends" --type ts
rg "friends\[" --type ts
```

#### Phase 3: Remove Field from Schema

```typescript
// Update User model - remove friends field
const UserSchema = new Schema<IUser>({
  // ... other fields
  // friends: [{ type: Schema.Types.ObjectId, ref: "User" }],  // REMOVED
});
```

#### Phase 4: Cleanup Data

```typescript
// Remove embedded friends array from all users
await User.updateMany({}, { $unset: { friends: 1 } });
```

---

### Migration 3: Add Atomic Rating Fields

**Estimated Effort**: 3-4 hours  
**Risk Level**: Medium (calculation must be accurate)  
**Downtime**: Brief (for verification)

#### Phase 1: Add New Fields

```typescript
// Update Lineup schema - add new fields
const LineupSchema = new Schema<ILineup>({
  // ... existing
  ratingSum: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
});
```

#### Phase 2: Backfill Data

```typescript
// scripts/backfill-rating-aggregates.ts
async function backfillRatingAggregates() {
  const aggregates = await Rating.aggregate([
    {
      $group: {
        _id: "$lineupId",
        sum: { $sum: "$value" },
        count: { $sum: 1 },
      },
    },
  ]);

  const bulkOps = aggregates.map((agg) => ({
    updateOne: {
      filter: { _id: agg._id },
      update: {
        $set: {
          ratingSum: agg.sum,
          ratingCount: agg.count,
          avgRating: agg.sum / agg.count,
        },
      },
    },
  }));

  await Lineup.bulkWrite(bulkOps);
  console.log(`Updated ${bulkOps.length} lineups`);
}
```

#### Phase 3: Update Application Code

Replace `recalculateAvgRating` with atomic updates (see Solution 5).

#### Phase 4: Verification

```typescript
// Verify all lineups have correct values
async function verifyRatingAggregates() {
  const lineups = await Lineup.find().lean();

  for (const lineup of lineups) {
    const ratings = await Rating.find({ lineupId: lineup._id });
    const expectedSum = ratings.reduce((sum, r) => sum + r.value, 0);
    const expectedCount = ratings.length;

    if (
      lineup.ratingSum !== expectedSum ||
      lineup.ratingCount !== expectedCount
    ) {
      console.log(`Mismatch for lineup ${lineup._id}`);
    }
  }
}
```

---

### Migration 4: Add Missing Indexes

**Estimated Effort**: 30 minutes  
**Risk Level**: Low  
**Downtime**: None (indexes built in background)

```typescript
// scripts/add-indexes.ts
async function addMissingIndexes() {
  // Session TTL
  await Session.collection.createIndex(
    { expires: 1 },
    { expireAfterSeconds: 0 },
  );
  console.log("Created Session TTL index");

  // Account userId
  await Account.collection.createIndex({ userId: 1 });
  console.log("Created Account userId index");

  // User email and username (if not already indexed)
  await User.collection.createIndex({ email: 1 });
  await User.collection.createIndex({ username: 1 });
  console.log("Created User indexes");

  // Activity indexes
  await Comment.collection.createIndex({ userId: 1, createdAt: -1 });
  await Vote.collection.createIndex({ userId: 1, createdAt: -1 });
  await Rating.collection.createIndex({ userId: 1, createdAt: -1 });
  console.log("Created activity indexes");
}
```

---

### Migration 5: Add Pagination to List Endpoints

**Estimated Effort**: 2-3 hours  
**Risk Level**: Low (non-breaking change)  
**Downtime**: None

This is a code-only change, no data migration needed. See Solution 3 for implementation.

**Breaking Change Consideration**: Existing clients expect array response, not paginated object.

**Strategy**:

1. Add new paginated endpoints (e.g., `getAllLineupsPaginated`)
2. Deprecate old endpoints
3. Migrate clients
4. Remove old endpoints

---

## Implementation Priority

| Priority | Issue                        | Solution                      | Effort | Impact                     |
| -------- | ---------------------------- | ----------------------------- | ------ | -------------------------- |
| **P0**   | Comment votes array          | Extract to collection         | 4-6h   | Prevents data loss         |
| **P0**   | No pagination                | Add cursor pagination         | 2-3h   | Prevents OOM               |
| **P1**   | User.friends array           | Remove, use Friend collection | 2-3h   | Reduces User document size |
| **P1**   | avgRating O(n)               | Atomic rating updates         | 3-4h   | Reduces CPU load           |
| **P2**   | Missing indexes              | Add indexes                   | 30m    | Improves query speed       |
| **P2**   | RequestedPlayer descriptions | Cap or extract                | 1-2h   | Prevents future issues     |
| **P3**   | Thread extraction            | Separate collection           | 4-6h   | Future-proofing            |

### Recommended Order

1. **Week 1**: Add indexes (quick win) + Add pagination
2. **Week 2**: Extract comment votes + Update vote mutations
3. **Week 3**: Remove User.friends + Atomic ratings
4. **Week 4**: Testing, monitoring, cleanup

---

## Monitoring & Validation

### Key Metrics to Track

| Metric                     | Tool                    | Alert Threshold      |
| -------------------------- | ----------------------- | -------------------- |
| Document size (comments)   | MongoDB Atlas / mongosh | > 1MB                |
| Query execution time (P99) | Application logs        | > 500ms              |
| Memory usage               | MongoDB Atlas           | > 80%                |
| Index hit ratio            | db.collection.stats()   | < 95%                |
| Session collection size    | MongoDB Atlas           | Growing continuously |

### Validation Queries

```javascript
// Check for oversized comment documents
db.comments
  .find({
    $expr: { $gt: [{ $bsonSize: "$$ROOT" }, 1048576] }, // > 1MB
  })
  .count();

// Check session cleanup is working
db.sessions.countDocuments({ expires: { $lt: new Date() } });

// Check index usage
db.comments.aggregate([{ $indexStats: {} }]);
```

### Health Check Endpoint

```typescript
// src/server/api/routers/health.ts
healthCheck: publicProcedure.query(async () => {
  const [commentStats, sessionStats] = await Promise.all([
    Comment.collection.stats(),
    Session.collection.stats(),
  ]);

  return {
    comments: {
      count: commentStats.count,
      avgObjSize: commentStats.avgObjSize,
      oversized: await Comment.countDocuments({
        $expr: { $gt: [{ $bsonSize: "$$ROOT" }, 1048576] },
      }),
    },
    sessions: {
      count: sessionStats.count,
      expired: await Session.countDocuments({
        expires: { $lt: new Date() },
      }),
    },
  };
});
```

---

## Appendix: Full Schema After Migrations

### Comment (Updated)

```typescript
const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lineupId: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
    totalVotes: { type: Number, default: 0 },
    thread: [
      {
        text: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        totalVotes: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

CommentSchema.index({ lineupId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
```

### CommentVote (New)

```typescript
const CommentVoteSchema = new Schema<ICommentVote>({
  commentId: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  threadId: { type: Schema.Types.ObjectId, default: null },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["upvote", "downvote"], required: true },
  createdAt: { type: Date, default: Date.now },
});

CommentVoteSchema.index(
  { commentId: 1, threadId: 1, userId: 1 },
  { unique: true },
);
CommentVoteSchema.index({ userId: 1, createdAt: -1 });
```

### Lineup (Updated)

```typescript
const LineupSchema = new Schema<ILineup>(
  {
    featured: { type: Boolean, default: false },
    pg: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    sg: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    sf: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    pf: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    c: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalVotes: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    timesGambled: { type: Number, default: 0 },
  },
  { timestamps: true },
);

LineupSchema.virtual("avgRating").get(function () {
  return this.ratingCount === 0 ? 0 : this.ratingSum / this.ratingCount;
});

LineupSchema.index({ ownerId: 1, createdAt: -1 });
LineupSchema.index({ avgRating: -1 });
LineupSchema.index({ totalVotes: -1 });
LineupSchema.index({ createdAt: -1 });
```

### User (Updated)

```typescript
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  password: { type: String, required: false, default: null },
  username: { type: String, required: false, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Date, default: null },
  image: { type: String, default: null },
  bio: { type: String, default: null, maxlength: 250 },
  profileImg: { type: String, default: null },
  bannerImg: { type: String, default: null },
  // friends: REMOVED
  socialMedia: { type: SocialMediaSchema, default: null },
  newEmail: { type: String, default: null },
  emailConfirmationToken: { type: String, default: null },
  admin: { type: Boolean, default: false },
});

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
```

---

## References

- [MongoDB Document Size Limits](https://www.mongodb.com/docs/manual/reference/limits/#bson-document-size)
- [MongoDB Data Modeling Patterns](https://www.mongodb.com/docs/manual/applications/data-models/)
- [Mongoose Index Documentation](https://mongoosejs.com/docs/guide.html#indexes)
- [MongoDB TTL Indexes](https://www.mongodb.com/docs/manual/core/index-ttl/)
