# Database

Lineup Legends v2 uses **Mongoose ODM** with **MongoDB** as the database. This document covers the schema design, database operations, and management.

## Overview

The database stores:

- **Players**: Basketball players with value tiers (1-5)
- **Lineups**: User-created fantasy lineups with 5 positions
- **Users**: Authenticated user accounts with profile customization
- **Ratings**: 1-10 ratings on lineups
- **Comments**: User comments on lineups with vote tracking
- **Threads**: Threaded replies to comments
- **CommentVotes / ThreadVotes**: Upvotes/downvotes on comments and threads
- **Follows**: User-to-user follow relationships
- **Feedback**: User-submitted feedback with status tracking
- **RequestedPlayers**: User requests for new players to be added
- **Auth data**: Sessions, accounts, verification tokens (managed by NextAuth)

## Environment Variables

```env
# MongoDB connection string (used by Mongoose)
MONGODB_URI="mongodb://localhost:27017/lineup-legends"

# For MongoDB Atlas (cloud)
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/lineup-legends?retryWrites=true&w=majority"
```

### Type-Safe Environment Validation

Environment variables are validated using `@t3-oss/env-nextjs` in `src/env.js`:

```javascript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    MONGODB_URI: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // ... other variables
  },
  // ...
});
```

This ensures the app fails fast if required database configuration is missing.

## Model Locations

All Mongoose models live in `src/server/models/` with a barrel export at `src/server/models/index.ts`.

Each model file exports:
- An **API type** (e.g. `Player`) — used in responses and client-side code
- A **Doc type** (e.g. `PlayerDoc`) — used in database operations (extends Mongoose `Document`)
- A **Model** (e.g. `PlayerModel`) — the Mongoose model instance

## Database Connection

The connection is managed in `src/server/db.ts` with a cached singleton pattern:

```typescript
import mongoose from "mongoose";
import { env } from "~/env";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "db" });

const cached: MongooseCache = global.mongooseCache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
      .then((mongoose) => {
        log.info("Connected to MongoDB via Mongoose");
        return mongoose;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**Key details:**
- Singleton pattern prevents multiple connections in development (stored in `globalThis`)
- `bufferCommands: false` ensures operations fail immediately if disconnected
- A separate `getMongoClient()` function provides a raw `MongoClient` for the NextAuth MongoDB adapter
- Logging uses pino via `~/lib/logger`

## Models

### Player

Basketball players with value tiers:

```typescript
// src/server/models/player.ts
const PlayerSchema = new Schema<PlayerDoc>({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  imgUrl:    { type: String, required: true },
  value:     { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: false });

// Text + value compound index for search
PlayerSchema.index({ firstName: "text", lastName: "text", value: 1 });
```

**Fields:**
| Field       | Type   | Description                    |
| ----------- | ------ | ------------------------------ |
| `firstName` | String | Player's first name            |
| `lastName`  | String | Player's last name             |
| `imgUrl`    | String | URL to player headshot         |
| `value`     | Number | Player cost tier (1-5)         |

### Lineup

Fantasy lineups with 5 basketball positions and engagement tracking:

```typescript
// src/server/models/lineup.ts
const LineupSchema = new Schema<LineupDoc>({
  featured:          { type: Boolean, default: false },
  players: {
    pg: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    sg: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    sf: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    pf: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    c:  { type: Schema.Types.ObjectId, ref: "Player", required: true },
  },
  owner:             { type: Schema.Types.ObjectId, ref: "User", required: true },
  avgRating:         { type: Number, default: 0 },
  timesGambled:      { type: Number, default: 0 },
  lastGambleResult:  { type: LastGambleResultSchema, default: undefined },
  gambleStreak:      { type: Number, default: 0 },
  lastGambleAt:      { type: Date, default: undefined },
  dailyGamblesUsed:  { type: Number, default: 0 },
  dailyGamblesResetAt: { type: Date, default: undefined },
}, { timestamps: true });

// Indexes for common query patterns
LineupSchema.index({ owner: 1, createdAt: -1 });
LineupSchema.index({ owner: 1, updatedAt: -1 });
LineupSchema.index({ featured: 1, createdAt: -1 });
LineupSchema.index({ avgRating: -1 });
LineupSchema.index({ createdAt: -1 });
```

**Notes:**
- Players are stored as a nested `players` subdocument with ObjectId refs (populated on read)
- `timestamps: true` auto-manages `createdAt` / `updatedAt`
- Gambling fields track daily limits, streaks, and the last gamble outcome
- Multiple indexes optimize explore/feed query patterns

### Rating

User ratings on lineups (1-10 scale):

```typescript
// src/server/models/rating.ts
const RatingSchema = new Schema<RatingDoc>({
  value:  { type: Number, required: true, min: 1, max: 10 },
  user:   { type: Schema.Types.ObjectId, ref: "User", required: true },
  lineup: { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
}, { timestamps: true });

// One rating per user per lineup
RatingSchema.index({ user: 1, lineup: 1 }, { unique: true });
```

### Comment

User comments on lineups with vote tracking:

```typescript
// src/server/models/comment.ts
const CommentSchema = new Schema<CommentDoc>({
  text:       { type: String, required: true },
  user:       { type: Schema.Types.ObjectId, ref: "User", required: true },
  lineup:     { type: Schema.Types.ObjectId, ref: "Lineup", required: true },
  totalVotes: { type: Number, default: 0 },
}, { timestamps: true });

CommentSchema.index({ lineup: 1, createdAt: -1 });
CommentSchema.index({ user: 1, createdAt: -1 });
```

### Thread

Threaded replies to comments:

```typescript
// src/server/models/threads.ts
const ThreadSchema = new Schema<ThreadDoc>({
  text:       { type: String, required: true },
  user:       { type: Schema.Types.ObjectId, ref: "User", required: true },
  comment:    { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  totalVotes: { type: Number, default: 0 },
}, { timestamps: true });

ThreadSchema.index({ user: 1, comment: 1, createdAt: -1 });
```

### CommentVote / ThreadVote

Upvotes and downvotes on comments and threads:

```typescript
// src/server/models/commentVote.ts
const CommentVoteSchema = new Schema<CommentVoteDoc>({
  type:    { type: String, enum: ["upvote", "downvote"], required: true },
  user:    { type: Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

CommentVoteSchema.index({ user: 1, comment: 1 }, { unique: true });
```

ThreadVote follows the same pattern, with a `thread` reference instead of `comment`.

### User

User accounts with profile customization (managed by NextAuth):

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
}, { timestamps: false });
```

**Notes:**
- `username` uses `sparse: true` so null values don't conflict with the unique constraint
- `socialMedia` is an embedded subdocument with `twitter`, `instagram`, `facebook`
- `followerCount` / `followingCount` are denormalized for query performance

### Follow

User-to-user follow relationships:

```typescript
// src/server/models/follow.ts
const FollowSchema = new Schema<FollowDoc>({
  follower:  { type: Schema.Types.ObjectId, ref: "User", required: true },
  following: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ following: 1 });
FollowSchema.index({ follower: 1 });
FollowSchema.index({ follower: 1, createdAt: -1 });
FollowSchema.index({ following: 1, createdAt: -1 });
```

### Feedback

User-submitted feedback with status tracking:

```typescript
// src/server/models/feedback.ts
const FeedbackSchema = new Schema<FeedbackDoc>({
  name:    { type: String, required: true, maxlength: 100 },
  email:   { type: String, required: true, maxlength: 255 },
  subject: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 2000 },
  status:  { type: String, enum: ["new", "read", "resolved"], default: "new" },
}, { timestamps: true });
```

### RequestedPlayer

User requests for new players to be added:

```typescript
// src/server/models/requestedPlayer.ts
const RequestedPlayerSchema = new Schema<RequestedPlayerDoc>({
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
  descriptions: [ValueDescriptionSchema], // array of { user, suggestedValue, createdAt }
}, { timestamps: true });

// Case-insensitive unique on name
RequestedPlayerSchema.index(
  { firstName: 1, lastName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);
```

### Auth Models (Account, Session, VerificationToken)

Managed by NextAuth. These follow standard NextAuth adapter patterns:

- **Account** — OAuth provider connections (`provider + providerAccountId` compound unique)
- **Session** — Active user sessions (`sessionToken` unique)
- **VerificationToken** — Email verification tokens (`identifier + token` compound unique)

## Model Conventions

All models follow a consistent pattern:

1. **Virtual `id` field** — Maps `_id.toHexString()` to `id` for clean API responses
2. **`toJSON` / `toObject` virtuals enabled** — Ensures `id` is included in serialized output
3. **Singleton model registration** — Uses `mongoose.models.X ?? mongoose.model(...)` to prevent re-registration during HMR in development
4. **Separate API and Doc types** — `Player` (API, with `id: string`) vs `PlayerDoc` (DB, extends `Document`)

## Common Operations

### Querying with Population

```typescript
// Get lineup with all players and owner populated
const lineup = await LineupModel.findById(id)
  .populate("players.pg players.sg players.sf players.pf players.c")
  .populate("owner")
  .lean();
```

### Filtering and Sorting

```typescript
// Get user's lineups, sorted by creation date
const lineups = await LineupModel.find({ owner: userId })
  .sort({ createdAt: -1 })
  .populate("players.pg players.sg players.sf players.pf players.c")
  .lean();
```

### Creating Records

```typescript
const lineup = await LineupModel.create({
  players: { pg: pgId, sg: sgId, sf: sfId, pf: pfId, c: cId },
  owner: session.user.id,
  featured: false,
});
```

### Updating Records

```typescript
const lineup = await LineupModel.findByIdAndUpdate(
  id,
  { featured: true },
  { new: true },
);
```

### Deleting Records

```typescript
await LineupModel.findByIdAndDelete(id);
```

### Counting Records

```typescript
const featuredCount = await LineupModel.countDocuments({
  owner: userId,
  featured: true,
});
```

### Bulk Operations

```typescript
// Seed players
const result = await PlayerModel.insertMany(playersData);

// Clear all players
await PlayerModel.deleteMany();
```

## Database Commands

### Seed Database

Populate the database with initial player data:

```bash
npm run db:seed
```

The seed script is located at `src/server/seed.ts` and uses a standalone Mongoose connection (not the app's cached connection).

## Seeding

### Seed Script

`src/server/seed.ts`

The seed script:
1. Connects directly to MongoDB using `MONGODB_URI` from `.env`
2. Clears all existing players
3. Inserts ~100 basketball players across 5 value tiers
4. Logs a summary of players seeded per tier

```bash
npm run db:seed
# Runs: tsx src/server/seed.ts
```

## Local Development

### Starting MongoDB

Use Docker to run a local MongoDB instance:

```bash
docker run -d --name mongodb -p 27017:27017 mongo:7
```

### Connection String

For local development:

```env
MONGODB_URI="mongodb://localhost:27017/lineup-legends"
```

## Production Considerations

1. **Use MongoDB Atlas**: Managed MongoDB service with automated backups
2. **Enable authentication**: Never expose MongoDB without auth in production
3. **Connection pooling**: Mongoose manages this via the cached singleton in `db.ts`
4. **Index strategy**: All models define indexes for their common query patterns (see individual model sections)
5. **Denormalized aggregates**: Fields like `avgRating`, `totalVotes`, `followerCount` are stored directly on documents for read performance and updated atomically during writes
