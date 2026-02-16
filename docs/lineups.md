# Lineups

Lineups are the core feature of Lineup Legends. Users create fantasy basketball lineups by selecting 5 players within a $15 budget.

## Overview

A lineup consists of:

- **5 positions**: PG (Point Guard), SG (Shooting Guard), SF (Small Forward), PF (Power Forward), C (Center)
- **Budget constraint**: Total player values must not exceed $15
- **Ownership**: Each lineup belongs to a user
- **Featured status**: Users can feature up to 3 lineups
- **Popularity**: Lineups do **not** use upvote/downvote. Popularity is expressed via **average rating** (`avgRating`) and **number of ratings** (`ratingCount`). Users rate lineups (e.g. 1–10); comments and thread replies keep Reddit-style upvote/downvote.

## Data Model

### Lineup Schema

```prisma
model Lineup {
    id        String   @id @default(auto()) @map("_id") @db.ObjectId
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    featured  Boolean  @default(false)

    // Position references (each position has one player)
    pgId String  @db.ObjectId
    pg   Player  @relation("PgPlayer", fields: [pgId], references: [id])

    sgId String  @db.ObjectId
    sg   Player  @relation("SgPlayer", fields: [sgId], references: [id])

    sfId String  @db.ObjectId
    sf   Player  @relation("SfPlayer", fields: [sfId], references: [id])

    pfId String  @db.ObjectId
    pf   Player  @relation("PfPlayer", fields: [pfId], references: [id])

    cId String  @db.ObjectId
    c   Player  @relation("CPlayer", fields: [cId], references: [id])

    // Owner reference
    ownerId String @db.ObjectId
    owner   User   @relation(fields: [ownerId], references: [id], onDelete: Cascade)
}
```

### Relationships

- Each lineup has exactly 5 players (one per position)
- Each lineup belongs to one user (owner)
- When a user is deleted, their lineups are also deleted (`onDelete: Cascade`)

## Creating a Lineup

### Budget Validation

The API enforces the $15 budget limit:

```typescript
const BUDGET_LIMIT = 15;

// In lineup.create mutation
const players = await ctx.db.player.findMany({
  where: { id: { in: [pgId, sgId, sfId, pfId, cId] } },
});

const totalValue = players.reduce((sum, player) => sum + player.value, 0);
if (totalValue > BUDGET_LIMIT) {
  throw new Error(`Lineup exceeds $${BUDGET_LIMIT} budget.`);
}
```

### Duplicate Player Validation

Each player can only be used once per lineup:

```typescript
const playerIds = [pgId, sgId, sfId, pfId, cId];
const uniqueIds = new Set(playerIds);
if (uniqueIds.size !== playerIds.length) {
  throw new Error(
    "Duplicate players found. Each position must have a unique player.",
  );
}
```

### Creation Flow

1. User navigates to `/lineups/new`
2. Random players are loaded (5 from each value tier)
3. User selects 5 players within budget
4. On submit, `lineup.create` mutation is called
5. User is redirected to `/lineups` on success

## API Endpoints

### `lineup.create` (Protected)

Creates a new lineup for the authenticated user.

**Input:**

```typescript
{
  pgId: string;
  sgId: string;
  sfId: string;
  pfId: string;
  cId: string;
}
```

**Returns:** The created lineup with all player and owner relations included.

### `lineup.getByCurrentUser` (Protected)

Gets all lineups owned by the authenticated user.

**Input (optional):**

```typescript
{
  sort?: "newest" | "oldest"; // Default: "newest"
}
```

**Returns:** Array of lineups with players and owner.

### `lineup.getByUserId` (Public)

Gets all lineups for a specific user.

**Input:**

```typescript
{
  userId: string;
}
```

### `lineup.getAllLineups` (Public)

Gets all lineups in the system (for the Explore page).

**Input (optional):**

```typescript
{
  sort?: "newest" | "oldest" | "highest-rated" | "most-rated"; // Default: "newest"
}
```

Sort options: **Newest** / **Oldest** (by `createdAt`), **Highest rated** (by `avgRating`), **Most rated** (by `ratingCount`). Lineup popularity is ratings-only (no vote-based sort).

### `lineup.getLineupsByOtherUsers` (Public)

Gets lineups from other users (Explore page), with the same sort options and `userId` for context.

### `lineup.rateLineup` (Protected)

Rate a lineup (e.g. 1–10). One rating per user per lineup; updating overwrites. The lineup’s `avgRating`, `ratingCount`, and `ratingSum` are updated atomically.

### `lineup.getLineupById` (Public)

Gets a single lineup by its ID.

**Input:**

```typescript
{
  id: string;
}
```

### `lineup.delete` (Protected)

Deletes a lineup. Only the owner can delete their lineup.

**Input:**

```typescript
{
  id: string;
}
```

**Validation:**

- Lineup must exist
- Authenticated user must be the owner

### `lineup.toggleFeatured` (Protected)

Toggles the featured status of a lineup.

**Input:**

```typescript
{
  id: string;
}
```

**Validation:**

- Lineup must exist
- Authenticated user must be the owner
- Maximum 3 featured lineups per user

## Pages

### My Lineups (`/lineups`)

Displays all lineups owned by the current user with options to:

- Delete lineups
- Toggle featured status
- Navigate to create new lineup
- Navigate to explore page

### Create Lineup (`/lineups/new`)

Interactive player selection interface:

- Displays 5 random players from each value tier
- Shows remaining budget and selected player count
- Validates budget in real-time
- Disabled players that would exceed budget

### Explore Lineups (`/lineups/explore`)

Public page showing lineups from other users:

- Sort by Newest, Oldest, Highest rated, or Most rated (no vote-based sort)
- Shows lineup owner with avatar and links to profiles
- Each card shows **average rating** and **rating count** (e.g. “4.2” and “12 ratings”); no upvote/downvote
- Link to rate a lineup (`/lineups/[id]/rate`) for non-owners
- Featured lineups are highlighted

## Components

### LineupCard

Displays a complete lineup with all 5 players:

```tsx
<LineupCard
  lineup={lineup}
  showOwner={true} // Show owner info (for explore page)
  isOwner={false} // Enable owner actions
  onDelete={handleDelete} // Delete callback
  onToggleFeatured={handleToggle}
/>
```

**Features:**

- Player grid showing all 5 positions
- Total lineup value display
- Relative timestamp (e.g., "2 hours ago")
- Featured badge
- Owner actions (delete, feature, reorder, gamble)
- **Rating display**: average rating and rating count (e.g. “4.2”, “12 ratings”). No upvote/downvote for lineups.
- Link to rate page for non-owners

### PlayerSelector

Interactive component for selecting 5 players:

```tsx
<PlayerSelector
  playersByValue={playersByValue}
  onSubmit={handleSubmit}
  isSubmitting={isPending}
/>
```

**Features:**

- Budget tracking (color-coded remaining budget)
- Selected players preview with position slots
- Players grouped by value tier
- Visual feedback for selected/disabled players
- Clear selection button

## Future Enhancements

The lineup feature is designed to support future additions:

- **Reordering**: Change player positions within a lineup
- **Gambling**: Trade players for random players of different values
- **Comments**: Discuss lineups with other users (comments and thread replies use upvote/downvote for discussion quality)

Lineup **popularity is ratings-only**: we intentionally do not use upvote/downvote for lineups because ratings (avg + count) provide a clearer signal. See [Lineup popularity: ratings only](./lineup-ratings-vs-votes-proposal.md).
