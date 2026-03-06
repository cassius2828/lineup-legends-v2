# Players

Players are the building blocks of lineups. Each player has a value from $1 to $5, representing their tier in the fantasy basketball system.

## Overview

The player system provides:

- **200+ unique basketball players** with headshots hosted on CloudFront
- **5 value tiers** ($1-$5) based on player quality
- **Random player selection** for fair lineup creation
- **Client-side search** powered by Redis-cached player data
- **Redis caching** — all player data is cached server-side and shared across all users

## Data Model

### Player Schema

```typescript
// src/server/models/player.ts
const PlayerSchema = new Schema<PlayerDoc>({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  imgUrl:    { type: String, required: true },
  value:     { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: false });

PlayerSchema.index({ firstName: "text", lastName: "text", value: 1 });
```

### Field Descriptions

| Field       | Type   | Description                    |
| ----------- | ------ | ------------------------------ |
| `id`        | String | MongoDB ObjectId               |
| `firstName` | String | Player's first name            |
| `lastName`  | String | Player's last name             |
| `imgUrl`    | String | CloudFront CDN headshot URL    |
| `value`     | Number | Cost tier (1-5)                |

## Value Tiers

Players are categorized into 5 tiers based on their NBA status:

| Value | Tier Name           | Description                | Example Players            |
| ----- | ------------------- | -------------------------- | -------------------------- |
| $5    | Superstars          | Top 10 NBA players         | LeBron, Curry, Jokic       |
| $4    | All-Stars           | All-Star caliber players   | Lillard, Butler, Morant    |
| $3    | Quality Starters    | Solid starting players     | Siakam, Holiday, Gobert    |
| $2    | Solid Contributors  | Good rotation players      | Wiggins, Maxey, Brunson    |
| $1    | Role Players        | Bench/specialty players    | Mills, Looney, Alvarado    |

## Caching Strategy

Player data is cached in Redis using the **cache-aside** pattern. This is the ideal caching candidate because player data is:

1. **Shared across all users** — one cache entry eliminates DB hits for the entire user base
2. **Rarely changes** — only admin mutations modify players
3. **Used for client-side search** — the full player list is sent to the client for in-memory filtering

### Cache Flow

```
Read request (getAll, getById)
        │
        ▼
  Redis cache hit? ──yes──▶ Parse JSON, filter in-memory, return
        │
       no
        │
        ▼
  Query MongoDB
        │
        ▼
  Store in Redis (24hr TTL) ──▶ Return to client


Admin mutation (create, update, delete)
        │
        ▼
  Write to MongoDB
        │
        ▼
  redis.del("players")
        │
        ▼
  Next read repopulates cache
```

### Cache Details

| Key       | Contents                    | TTL    | Invalidated By                                    |
| --------- | --------------------------- | ------ | ------------------------------------------------- |
| `players` | JSON of all player records  | 24 hrs | `player.create`, `player.update`, `player.delete` |

MongoDB indexes still serve an important role: they make the cache-miss path (after invalidation) fast. Without indexes, every cache repopulation would require a full collection scan.

## API Endpoints

### `player.getAll` (Public)

Gets all players, optionally filtered by value tier. Reads from Redis cache when available.

**Input (optional):**

```typescript
{
  value?: 1 | 2 | 3 | 4 | 5;
}
```

**Returns:** Array of players sorted by value (descending).

**Example usage:**

```typescript
const allPlayers = api.player.getAll.useQuery();
const superstars = api.player.getAll.useQuery({ value: 5 });
```

### `player.getById` (Public)

Gets a single player by ID. Reads from the `players` cache when available, performing an in-memory lookup by ID rather than querying MongoDB.

**Input:**

```typescript
{
  id: string;
}
```

**Returns:** Player object or undefined.

### `player.getRandomByValue` (Public)

Gets 5 random players from each value tier using MongoDB's `$facet` and `$sample` aggregation pipeline. This is the primary endpoint used for lineup creation.

This endpoint is **not cached** because it is intentionally random per-request — caching would cause all users to see the same "random" players during the TTL window.

**Input:** None

**Returns:**

```typescript
{
  value1Players: Player[]; // 5 random $1 players
  value2Players: Player[]; // 5 random $2 players
  value3Players: Player[]; // 5 random $3 players
  value4Players: Player[]; // 5 random $4 players
  value5Players: Player[]; // 5 random $5 players
}
```

### `player.search` (Public)

Server-side search endpoint using case-insensitive regex on `firstName` and `lastName`. This serves as a fallback — the primary search experience uses client-side filtering on the cached player list.

**Input:**

```typescript
{
  query: string;
}
```

**Returns:** Matching players sorted by value (descending). Returns top 10 if query is empty.

### `player.update` (Admin)

Updates a player's details. Invalidates the Redis player cache after the write.

**Input:**

```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  value: 1 | 2 | 3 | 4 | 5;
  imgUrl: string; // URL
}
```

### `player.create` (Admin)

Creates a new player. Checks for duplicate names (case-insensitive) before creating. Invalidates the Redis player cache after the write.

**Input:**

```typescript
{
  firstName: string;
  lastName: string;
  value: 1 | 2 | 3 | 4 | 5;
  imgUrl: string; // URL
}
```

### `player.delete` (Admin)

Deletes a player by ID. Invalidates the Redis player cache after the write.

**Input:**

```typescript
{
  id: string;
}
```

## Player Images

Player headshot images are stored on **AWS S3** and served via **CloudFront CDN**:

```
https://<cloudfront-domain>/lineup-legends/<image-path>
```

The `NEXT_PUBLIC_CLOUDFRONT_URL` environment variable provides the base URL. Images are loaded by the browser independently of the player data — the Redis cache speeds up data delivery, but image loading depends on CDN proximity and browser caching.

## Database Seeding

Players are seeded using the `src/server/seed.ts` script.

### Running the Seed

```bash
npm run db:seed
# Runs: tsx src/server/seed.ts
```

### Seed Script

The seed script:

1. Connects directly to MongoDB using `MONGODB_URI` from `.env`
2. Clears all existing players
3. Inserts ~200 basketball players across 5 value tiers
4. Logs a summary of players seeded per tier

## Components

### PlayerCard

Displays a single player with their value and image:

```tsx
<PlayerCard
  player={player}
  selected={isSelected}
  onSelect={handleSelect}
  disabled={!canAfford}
  compact={false}
/>
```

**Modes:**

1. **Standard mode**: Used in player selection grid
   - Circular player image
   - Value badge with color coding
   - Selection checkmark overlay
   - Disabled state styling

2. **Compact mode**: Used in lineup cards
   - Horizontal layout
   - Smaller image
   - Inline value badge

### Value Color Coding

Each value tier has a distinct color:

```typescript
const valueColors = {
  1: "bg-gray-500",    // Role players
  2: "bg-green-500",   // Contributors
  3: "bg-blue-500",    // Quality starters
  4: "bg-purple-500",  // All-stars
  5: "bg-amber-500",   // Superstars
};
```

## Usage in Lineup Creation

The `PlayerSelector` component uses the random player data:

1. Fetch random players: `api.player.getRandomByValue.useQuery()`
2. Display players grouped by value tier
3. Track selected players and remaining budget
4. Disable players that would exceed budget
5. Submit selected players as lineup

```typescript
const { data: playersByValue } = api.player.getRandomByValue.useQuery();

const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

const currentBudget = selectedPlayers.reduce((sum, p) => sum + p.value, 0);
const remainingBudget = 15 - currentBudget;

const canAffordPlayer = (player) => player.value <= remainingBudget;
```
