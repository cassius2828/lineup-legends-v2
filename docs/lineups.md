# Lineups

Lineups are the core feature of Lineup Legends. Users create fantasy basketball lineups by selecting 5 players within a $15 budget.

## Overview

A lineup consists of:

- **5 positions**: PG (Point Guard), SG (Shooting Guard), SF (Small Forward), PF (Power Forward), C (Center)
- **Budget constraint**: Total player values must not exceed $15 at creation time (see note below)
- **Ownership**: Each lineup belongs to a user
- **Featured status**: Users can feature up to 3 lineups
- **Popularity**: Expressed via **average rating** (`avgRating`) and **number of ratings** (`ratingCount`). Users rate lineups 1–10; comments and thread replies use Reddit-style upvote/downvote.
- **Gambling**: Owners can gamble one player position per lineup for a random replacement (once per lineup)
- **Reordering**: Owners can swap player positions within a lineup
- **Bookmarking**: Users can bookmark lineups for later viewing
- **Comments**: Users can comment on lineups with threaded replies, images, and GIFs

> **Note on budget:** The $15 budget is enforced only at lineup creation. A lineup's total value can exceed $15 after creation through two mechanisms: (1) **gambling** — swapping a player for a higher-value replacement, and (2) **player value updates** — an admin may adjust a player's value over time, which retroactively changes the total value of any lineup containing that player. This is by design.

## Data Model

### Lineup Schema

```typescript
// src/server/models/lineup.ts
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
    timesGambled: { type: Number, default: 0 }, // once-per-lineup guard
    lastGambleResult: { type: LastGambleResultSchema, default: undefined },
    gambleStreak: { type: Number, default: 0 },
    lastGambleAt: { type: Date, default: undefined }, // legacy
    dailyGamblesUsed: { type: Number, default: 0 }, // legacy
    dailyGamblesResetAt: { type: Date, default: undefined }, // legacy
  },
  { timestamps: true },
);
```

### Relationships

- Each lineup has exactly 5 players (one per position) stored as a `players` subdocument with ObjectId refs
- Each lineup belongs to one user (owner)
- Ratings, comments, and bookmarks reference the lineup by ObjectId

## Creating a Lineup

### Budget Validation

The API enforces the $15 budget limit:

```typescript
const BUDGET_LIMIT = 15;

const totalValue = players.reduce((sum, player) => sum + player.value, 0);
if (totalValue > BUDGET_LIMIT) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Lineup exceeds $${BUDGET_LIMIT} budget.`,
  });
}
```

### Duplicate Player Validation

Each player can only be used once per lineup:

```typescript
const playerIds = [pgId, sgId, sfId, pfId, cId];
const uniqueIds = new Set(playerIds);
if (uniqueIds.size !== playerIds.length) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message:
      "Duplicate players found. Each position must have a unique player.",
  });
}
```

### Creation Flow

1. User navigates to `/lineups/new`
2. Random players are loaded (5 from each value tier)
3. User selects and assigns players to positions via click or drag-and-drop
4. On submit, `lineup.create` mutation is called
5. User is redirected to `/lineups` on success

### Drag-and-Drop

The lineup creation page uses **dnd-kit** for drag-and-drop:

- Players can be dragged from the grid to position slots
- Dragging a player onto an occupied slot swaps the players
- Players can also be assigned/removed by clicking

## API Endpoints

### `lineup.create` (Protected)

Creates a new lineup for the authenticated user.

**Input:**

```typescript
{
  players: {
    pg: playerSchema, // { _id, firstName, lastName, imgUrl, value }
    sg: playerSchema,
    sf: playerSchema,
    pf: playerSchema,
    c: playerSchema,
  }
}
```

**Validation:** Budget ≤ $15, no duplicate players.

**Returns:** The created lineup with all player and owner relations populated.

### `lineup.getLineupsByCurrentUser` (Protected)

Gets lineups owned by the authenticated user with cursor-based pagination and server-side filtering.

**Input:**

```typescript
{
  sort?: "newest" | "oldest" | "highest-rated" | "most-rated"; // Default: "newest"
  limit?: number;     // 1–100, default 50
  cursor?: string;    // pagination cursor (ObjectId for date sorts, offset for rating sorts)
  dateFrom?: Date;    // filter: lineups created on or after this date
  dateTo?: Date;      // filter: lineups created on or before this date
  minRating?: number; // filter: minimum avgRating (0–10)
  filterUserId?: string; // filter: owner ObjectId
}
```

**Returns:** `{ lineups: Lineup[], hasMore: boolean, cursor?: string }`

### `lineup.getLineupsByOtherUsers` (Public)

Gets lineups from users other than the specified user (used on the explore page with the current user's ID to show other people's lineups). Supports cursor-based pagination and server-side filtering.

**Input:**

```typescript
{
  sort?: "newest" | "oldest" | "highest-rated" | "most-rated"; // Default: "newest"
  limit?: number;
  cursor?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minRating?: number;
  filterUserId?: string;
  excludeUserId?: string; // exclude this user's lineups (validated as ObjectId)
}
```

**Returns:** `{ lineups: Lineup[], hasMore: boolean, cursor?: string }`

### `lineup.getAllLineups` (Public)

Gets all lineups in the system with cursor-based pagination and server-side filtering.

**Input:**

```typescript
{
  sort?: "newest" | "oldest" | "highest-rated" | "most-rated"; // Default: "newest"
  limit?: number;
  cursor?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minRating?: number;
  filterUserId?: string;
}
```

**Returns:** `{ lineups: Lineup[], hasMore: boolean, cursor?: string }`

Sort options: **Newest** / **Oldest** (by `createdAt`), **Highest rated** (by `avgRating`), **Most rated** (by `ratingCount`).

#### Pagination strategy

- **Date sorts** (`newest`, `oldest`): Uses `_id`-based cursor (`$lt` / `$gt`) since `_id` is monotonic with `createdAt`
- **Rating sorts** (`highest-rated`, `most-rated`): Uses offset-based pagination (`.skip()`) to avoid complexity of compound cursors
- All endpoints fetch `limit + 1` rows to determine `hasMore`, then slice to `limit`

### `lineup.getLineupById` (Public)

Gets a single lineup by its ID.

**Input:**

```typescript
{
  id: string;
}
```

### `lineup.delete` (Protected)

Deletes a lineup. Only the owner can delete their lineup. Also deletes all associated ratings.

**Input:**

```typescript
{
  id: string;
}
```

### `lineup.toggleFeatured` (Protected)

Toggles the featured status of a lineup.

**Input:**

```typescript
{
  id: string;
}
```

**Validation:** Lineup must exist, user must be the owner, maximum 3 featured lineups per user.

### `lineup.rate` (Protected)

Rate a lineup (0.01–10). One rating per user per lineup; updating overwrites. The lineup's `avgRating`, `ratingCount`, and `ratingSum` are updated atomically.

**Input:**

```typescript
{
  lineupId: string;
  value: number; // 0.01–10
}
```

**Validation:** Cannot rate your own lineup.

### `lineup.reorder` (Protected)

Reorder player positions within a lineup. The same 5 players must be present — only the position assignments change.

**Input:**

```typescript
{
  lineupId: string;
  players: {
    pg: playerSchema,
    sg: playerSchema,
    sf: playerSchema,
    pf: playerSchema,
    c: playerSchema,
  }
}
```

### `lineup.gamble` (Protected)

Swap a player at a given position for a random replacement based on weighted probabilities. See [Gambling Mechanic](./gambling-mechanic.md) for full details.

**Input:**

```typescript
{
  lineupId: string;
  position: "pg" | "sg" | "sf" | "pf" | "c";
}
```

**Validation:** Owner only, once per lineup (`timesGambled >= 1` rejects).

**Returns:** Updated lineup, previous player, new player, and outcome metadata.

## Pages

### My Lineups (`/lineups`)

Displays lineups owned by the current user with infinite scroll (50 at a time) and server-side filtering:

- Filter by date range (presets or custom calendar), minimum rating, or specific user
- Sort by Newest, Oldest, Highest rated, or Most rated
- Grid/list view toggle
- Delete lineups
- Toggle featured status
- Reorder player positions
- Gamble players
- Navigate to create new lineup or explore page

### Create Lineup (`/lineups/new`)

Interactive player selection interface:

- Displays 5 random players from each value tier
- Shows remaining budget and selected player count
- Players can be assigned via click or drag-and-drop to position slots
- Validates budget in real-time
- Disables players that would exceed budget
- Unauthenticated users can browse but cannot submit

### Explore Lineups (`/lineups/explore`)

Public page showing lineups from other users with infinite scroll (50 at a time) and server-side filtering:

- Filter by date range (presets or custom calendar), minimum rating, or specific user
- Sort by Newest, Oldest, Highest rated, or Most rated
- Grid/list view toggle
- Shows lineup owner with avatar and links to profiles
- Each card shows **average rating** and **rating count**
- Links to rate a lineup (`/lineups/[id]/rate`) for non-owners
- Featured lineups are highlighted
- Link to bookmarked lineups (when authenticated)

### Rate Lineup (`/lineups/[id]/rate`)

Dedicated page for rating a lineup:

- Preview of the lineup with compact player cards
- Slider for selecting a rating value
- Pre-populated with the lineup's current average rating
- On success, redirects to `/lineups/explore`
- Requires authentication to submit

### Edit Lineup (`/lineups/[id]/edit`)

Reorder player positions within a lineup:

- Sortable vertical list using dnd-kit
- Arrow-based swap buttons for reordering
- Only available to the lineup owner

### Gamble (`/lineups/[id]/gamble`)

Gamble interface for swapping players. See [Gambling Mechanic](./gambling-mechanic.md).

### Bookmarked Lineups (`/lineups/bookmarked`)

Shows lineups the current user has bookmarked with infinite scroll (50 at a time):

- Filter by date range, minimum rating
- Sort by newest or oldest bookmarked
- Grid/list view toggle
- Uses a MongoDB aggregation pipeline (`$lookup`) for bounded pagination — no unbounded bookmark fetch
- Requires authentication

### Lineup Detail (`/lineups/[id]`)

Full view of a single lineup with:

- Lineup card with all stats
- Comment composer with image/GIF upload support
- Comment list with infinite scroll
- Thread replies via comment modal
- Upvote/downvote on comments and threads

## Components

### LineupCard

Displays a complete lineup with all 5 players:

```tsx
<LineupCard
  lineup={lineup}
  showOwner={true}
  isOwner={false}
  onDelete={handleDelete}
  onToggleFeatured={handleToggle}
/>
```

**Sub-components:**

- **LineupCardHeader**: Owner avatar/name, featured badge, relative timestamp, total value
- **LineupCardStatsBar**: Average rating, rating count, times gambled, link to rate
- **LineupCardPlayersGrid**: 5-column grid of compact PlayerCards
- **LineupCardOwnerActions**: Reorder, gamble, feature/unfeature, delete
- **LineupCardFooter**: Comment count, view link, bookmark toggle, share menu
- **ShareMenu**: Copy link, Web Share API, X, Facebook, SMS, Email

### PlayerSelector

Interactive component for selecting 5 players with drag-and-drop:

```tsx
<PlayerSelector
  playersByValue={playersByValue}
  onSubmit={handleSubmit}
  isSubmitting={isPending}
  isAuthenticated={isAuthenticated}
/>
```

**Features:**

- Budget tracking (color-coded remaining budget)
- Selected players preview with position slots (DroppablePositionSlot)
- Drag-and-drop from player grid to position slots
- Players grouped by value tier (PlayerGrid)
- Visual feedback for selected/disabled/dragging players
- Clear selection button

Lineup popularity is **ratings-only**: we intentionally do not use upvote/downvote for lineups because ratings (avg + count) provide a clearer signal. See [Lineup popularity: ratings only](./lineup-ratings-vs-votes-proposal.md).
