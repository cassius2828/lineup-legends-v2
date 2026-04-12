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
const PlayerSchema = new Schema<PlayerDoc>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    imgUrl: { type: String, required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
    wikiPageTitle: { type: String, default: null },
    wikiSummaryExtract: { type: String, default: null },
    wikiThumbnailUrl: { type: String, default: null },
    wikiSummaryFetchedAt: { type: Date, default: null },
    wikiAwardsHonorsText: { type: String, default: null },
    wikiCareerRegularSeason: { type: Schema.Types.Mixed, default: null },
    wikiCareerSeasonBests: { type: Schema.Types.Mixed, default: null },
    wikiListedHeight: { type: String, default: null },
    wikiListedWeight: { type: String, default: null },
  },
  { timestamps: false },
);

PlayerSchema.index({ firstName: "text", lastName: "text", value: 1 });
```

### Field Descriptions

| Field       | Type   | Description                 |
| ----------- | ------ | --------------------------- |
| `id`        | String | MongoDB ObjectId            |
| `firstName` | String | Player's first name         |
| `lastName`  | String | Player's last name          |
| `imgUrl`    | String | CloudFront CDN headshot URL |
| `value`     | Number | Cost tier (1-5)             |

### Wikipedia Fields

| Field                     | Type                                    | Description                                          |
| ------------------------- | --------------------------------------- | ---------------------------------------------------- |
| `wikiPageTitle`           | String \| null                          | Canonical Wikipedia page title (e.g. "LeBron James") |
| `wikiSummaryExtract`      | String \| null                          | Lead paragraph from the Wikipedia page               |
| `wikiThumbnailUrl`        | String \| null                          | Wikipedia thumbnail image URL                        |
| `wikiSummaryFetchedAt`    | Date \| null                            | Last fetch timestamp (7-day staleness window)        |
| `wikiAwardsHonorsText`    | String \| null                          | Plain-text awards/honors list                        |
| `wikiCareerRegularSeason` | Record<string, string> \| null          | Career averages (PPG, APG, RPG, FG%, etc.)           |
| `wikiCareerSeasonBests`   | Record<string, {value, season}> \| null | Best single-season value per stat                    |
| `wikiListedHeight`        | String \| null                          | Listed height from the Wikipedia infobox             |
| `wikiListedWeight`        | String \| null                          | Listed weight from the Wikipedia infobox             |

## Value Tiers

Players are categorized into 5 tiers based on their NBA status:

| Value | Tier Name          | Description              | Example Players         |
| ----- | ------------------ | ------------------------ | ----------------------- |
| $5    | Superstars         | Top 10 NBA players       | LeBron, Curry, Jokic    |
| $4    | All-Stars          | All-Star caliber players | Lillard, Butler, Morant |
| $3    | Quality Starters   | Solid starting players   | Siakam, Holiday, Gobert |
| $2    | Solid Contributors | Good rotation players    | Wiggins, Maxey, Brunson |
| $1    | Role Players       | Bench/specialty players  | Mills, Looney, Alvarado |

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

| Key       | Contents                   | TTL    | Invalidated By                                    |
| --------- | -------------------------- | ------ | ------------------------------------------------- |
| `players` | JSON of all player records | 24 hrs | `player.create`, `player.update`, `player.delete` |

MongoDB indexes still serve an important role: they make the cache-miss path (after invalidation) fast. Without indexes, every cache repopulation would require a full collection scan.

## API Endpoints

### `player.getAll` (Public)

Gets all players. Reads from Redis cache when available. The Zod schema accepts an optional `value` filter, but the current implementation returns all players regardless (client-side filtering is used instead).

**Input (optional):**

```typescript
{
  value?: 1 | 2 | 3 | 4 | 5;
}
```

**Returns:** Array of all players.

**Example usage:**

```typescript
const allPlayers = api.player.getAll.useQuery();
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

### `player.ensureWikiSummary` (Protected, Rate Limited)

Fetches Wikipedia summary, career stats, awards, and measurements for a player. Results are cached for 7 days. Rate limited to 5 calls per minute per IP.

**Input:**

```typescript
{
  id: string;
  force?: boolean; // bypass 7-day cache
}
```

**Returns:** Updated player object.

**Data pipeline:**

1. Check if wiki data is fresh (< 7 days) — return cached if so
2. Fetch Wikipedia summary via MediaWiki API (`fetchBasketballPlayerWikiSummary`)
3. Fetch extended sections: career stats, awards, height/weight (`fetchWikiExtendedSections`)
4. Parse career stats table with Cheerio (handles mid-season trades, colspan offsets)
5. Persist to MongoDB and invalidate Redis cache

### `player.ensureAwardsAI` (Protected, Rate Limited)

AI-powered fallback for extracting awards when the Cheerio-based parser fails. Sends the full Wikipedia page HTML to GPT-4o-mini. Rate limited to 5 calls per minute per IP.

**Input:**

```typescript
{
  id: string;
}
```

**Returns:** Updated player object with `wikiAwardsHonorsText` populated.

### `player.update` (Admin)

Updates a player's details. Invalidates the Redis player cache after the write.

**Input:**

```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  value: 1 | 2 | 3 | 4 | 5;
  imgUrl: string;
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
  imgUrl: string;
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

The `PlayerImage` component provides automatic retry (up to 3 attempts) with a fallback silhouette SVG if all retries fail.

## Player Pages

### Player List (`/players`)

Displays all players with search and filtering:

- **Fuse.js** client-side fuzzy search
- Value tier filter buttons ($1–$5)
- Default shows 10 players, expandable to all
- Pagination (50 per page) when searching or expanded
- Grid layout with PlayerCards

### Player Detail (`/players/[id]`)

Individual player page with Wikipedia-powered profile:

- Player headshot with tier-colored glow (Diamond, Amethyst, Gold, Silver, Bronze)
- Tier label and value display
- **Biography**: Wikipedia lead summary with link to full article
- **Measurements**: Listed height and weight from the Wikipedia infobox
- **Career Stats Toggle**: Switch between career averages and season bests (with games played per season)
- **Awards & Honors**: Bulleted list of accolades
- Dev-only "Force Wikipedia refetch" button for debugging parser changes

### Lineup Builder Panel (`CreateLineupPlayerDetailPanel`)

Side panel in the lineup creation flow that displays the same player profile data:

- Opens when a player is clicked in the selector grid
- Shares the same `CareerStatsToggle` and `WikiPlayerMeasurements` components
- Uses `useEnsureWikiData` hook to trigger wiki fetch on panel open

### Wikipedia Data Flow

```
Player view opens
       │
       ▼
useEnsureWikiData hook
       │
       ├─ wikiSummaryExtract missing? ─▶ ensureWikiSummary mutation
       │                                     │
       │                                     ├─ MediaWiki API: summary
       │                                     ├─ MediaWiki API: full HTML
       │                                     ├─ Cheerio: career stats table
       │                                     ├─ Cheerio: awards section
       │                                     └─ Cheerio: infobox height/weight
       │
       └─ wikiAwardsHonorsText empty? ─▶ ensureAwardsAI mutation
                                             │
                                             ├─ Fetch full page HTML
                                             └─ GPT-4o-mini: extract awards
```

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

## Wikipedia Backfill Script

The backfill script processes all players and fetches their Wikipedia data:

```bash
# Run the backfill (skips players that already have data)
npx tsx scripts/backfill-wiki.ts

# Force re-fetch all players (ignores existing data)
npx tsx scripts/backfill-wiki.ts --refresh-stats
```

The script:

1. Connects to MongoDB and loads all players
2. For each player, fetches Wikipedia summary + extended sections
3. Falls back to GPT-4o-mini if career stats or awards parsing fails (requires `OPENAI_API_KEY`)
4. Logs progress with skip/fetch/fail counts

## Server-Side Libraries

### `src/server/lib/wikipedia.ts`

Handles Wikipedia API summary fetching with basketball-player disambiguation.

### `src/server/lib/wikipedia-sections.ts`

Core HTML parsing library using Cheerio:

- `extractCareerStatsFromRegularSeasonHtml` — parses career averages from the stats table
- `extractCareerSeasonBestsFromRegularSeasonHtml` — finds the best single-season value for each stat (with GP)
- `extractListedHeightWeightFromInfoboxHtml` — pulls height/weight from the infobox
- `wikiDebugEnabled()` — shared debug flag for conditional logging

### `src/server/lib/ai-client.ts`

Shared OpenAI client singleton and HTML truncation helper used by all AI modules.

### `src/server/lib/ai-awards.ts`

GPT-4o-mini fallback for extracting awards from Wikipedia HTML when regex/Cheerio parsing fails.

### `src/server/lib/ai-career-stats.ts`

GPT-4o-mini fallback for extracting career averages and season bests from Wikipedia HTML.

## Components

### CareerStatsToggle

`src/app/_components/common/CareerStatsToggle.tsx`

Toggleable display of career averages or season bests. Shared between the player page and the lineup builder panel.

```tsx
<CareerStatsToggle
  averages={player.wikiCareerRegularSeason}
  bests={player.wikiCareerSeasonBests}
  loading={careerStatsLoading}
  hasCareerStats={hasCareerStats}
  headingAs="h2"
/>
```

**Props:**

| Prop             | Type                            | Description                                       |
| ---------------- | ------------------------------- | ------------------------------------------------- |
| `averages`       | Record<string, string>          | Career averages keyed by stat name                |
| `bests`          | Record<string, {value, season}> | Season bests keyed by stat name                   |
| `loading`        | boolean                         | Shows shimmer skeletons when true                 |
| `hasCareerStats` | boolean (optional)              | When false, shows "No career table found" message |
| `headingAs`      | "h2" \| "h3"                    | Heading level (h2 for page, h3 for panel)         |

### WikiPlayerMeasurements

`src/app/_components/common/WikiPlayerMeasurements.tsx`

Displays listed height and weight from the Wikipedia infobox.

### CareerStatValue

`src/app/_components/common/CareerStatValue.tsx`

Individual stat cell with shimmer skeleton while loading, em dash for missing values, and staggered animation.

### PlayerCard

Displays a single player with their value and image:

```tsx
<PlayerCard
  player={player}
  selected={isSelected}
  disabled={!canAfford}
  compact={false}
/>
```

**Modes:**

1. **Standard mode**: Used in player selection grid
   - Square cell with value-colored shadow
   - Selection checkmark overlay
   - Disabled state styling
   - Navigates to player detail on click

2. **Compact mode**: Used in lineup cards
   - Circular image with truncated name
   - Inline value badge

### Value Color Coding

Each value tier has a distinct color:

```typescript
const valueColors = {
  1: "bg-gray-500", // Role players
  2: "bg-green-500", // Contributors
  3: "bg-blue-500", // Quality starters
  4: "bg-purple-500", // All-stars
  5: "bg-amber-500", // Superstars
};
```

## Usage in Lineup Creation

The `PlayerSelector` component uses the random player data:

1. Fetch random players: `api.player.getRandomByValue.useQuery()`
2. Display players grouped by value tier in a `PlayerGrid`
3. Track selected players and remaining budget
4. Assign players to positions via click or drag-and-drop
5. Submit selected players as lineup

```typescript
const { data: playersByValue } = api.player.getRandomByValue.useQuery();

const [selectedPlayers, setSelectedPlayers] = useState<PlayerType[]>([]);

const currentBudget = selectedPlayers.reduce((sum, p) => sum + p.value, 0);
const remainingBudget = 15 - currentBudget;
```
