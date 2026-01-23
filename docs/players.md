# Players

Players are the building blocks of lineups. Each player has a value from $1 to $5, representing their tier in the fantasy basketball system.

## Overview

The player system provides:

- **200+ unique basketball players** with real NBA headshots
- **5 value tiers** ($1-$5) based on player quality
- **Random player selection** for fair lineup creation
- **Search functionality** for finding specific players

## Data Model

### Player Schema

```prisma
model Player {
    id        String   @id @default(auto()) @map("_id") @db.ObjectId
    firstName String
    lastName  String
    imgUrl    String
    value     Int      // 1-5 representing player cost

    // Lineup position references
    lineupsAsPg Lineup[] @relation("PgPlayer")
    lineupsAsSg Lineup[] @relation("SgPlayer")
    lineupsAsSf Lineup[] @relation("SfPlayer")
    lineupsAsPf Lineup[] @relation("PfPlayer")
    lineupsAsC  Lineup[] @relation("CPlayer")
}
```

### Field Descriptions

| Field       | Type   | Description                           |
| ----------- | ------ | ------------------------------------- |
| `id`        | String | MongoDB ObjectId                      |
| `firstName` | String | Player's first name                   |
| `lastName`  | String | Player's last name                    |
| `imgUrl`    | String | NBA headshot URL                      |
| `value`     | Int    | Cost tier (1-5)                       |

## Value Tiers

Players are categorized into 5 tiers based on their NBA status:

| Value | Tier Name           | Description                | Example Players            |
| ----- | ------------------- | -------------------------- | -------------------------- |
| $5    | Superstars          | Top 10 NBA players         | LeBron, Curry, Jokic       |
| $4    | All-Stars           | All-Star caliber players   | Lillard, Butler, Morant    |
| $3    | Quality Starters    | Solid starting players     | Siakam, Holiday, Gobert    |
| $2    | Solid Contributors  | Good rotation players      | Wiggins, Maxey, Brunson    |
| $1    | Role Players        | Bench/specialty players    | Mills, Looney, Alvarado    |

## API Endpoints

### `player.getAll` (Public)

Gets all players, optionally filtered by value tier.

**Input (optional):**

```typescript
{
  value?: 1 | 2 | 3 | 4 | 5;
}
```

**Returns:** Array of players sorted by value (descending).

**Example usage:**

```typescript
// Get all players
const allPlayers = api.player.getAll.useQuery();

// Get only $5 players
const superstars = api.player.getAll.useQuery({ value: 5 });
```

### `player.getById` (Public)

Gets a single player by ID.

**Input:**

```typescript
{
  id: string;
}
```

**Returns:** Player object or null.

### `player.getRandomByValue` (Public)

Gets 5 random players from each value tier. This is the primary endpoint used for lineup creation.

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

**Implementation note:** MongoDB doesn't have native random sampling in Prisma, so this endpoint fetches all players and samples randomly in JavaScript:

```typescript
getRandomByValue: publicProcedure.query(async ({ ctx }) => {
  const allPlayers = await ctx.db.player.findMany();

  // Group by value
  const playersByValue = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const player of allPlayers) {
    playersByValue[player.value].push(player);
  }

  // Shuffle and take 5 from each tier
  const shuffleAndTake = (arr, count) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  return {
    value1Players: shuffleAndTake(playersByValue[1], 5),
    // ... etc
  };
});
```

### `player.search` (Public)

Searches players by first or last name.

**Input:**

```typescript
{
  query: string;
}
```

**Returns:** Matching players sorted by value (descending).

**Features:**

- Case-insensitive search
- Searches both first and last name
- Returns top 10 if query is empty

## Database Seeding

Players are seeded using the `prisma/seed.ts` script.

### Running the Seed

```bash
npm run db:seed
```

### Seed Script

The seed script:

1. Clears all existing players
2. Inserts the predefined player data
3. Logs the count per value tier

```typescript
async function main() {
  console.log("🏀 Starting to seed players...");

  await prisma.player.deleteMany();
  console.log("Cleared existing players.");

  const result = await prisma.player.createMany({
    data: playersData,
  });

  console.log(`✅ Successfully seeded ${result.count} players!`);
}
```

### Player Data Structure

Players are defined with real NBA data:

```typescript
const playersData = [
  // Value 5 (Superstars)
  {
    firstName: "LeBron",
    lastName: "James",
    value: 5,
    imgUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png",
  },
  // ... more players
];
```

## Player Images

Player images are sourced from the official NBA CDN:

```
https://cdn.nba.com/headshots/nba/latest/1040x760/{PLAYER_ID}.png
```

The NBA player IDs are included in the seed data for each player.

## Components

### PlayerCard

Displays a single player with their value and image:

```tsx
<PlayerCard
  player={player}
  selected={isSelected}      // Highlight when selected
  onSelect={handleSelect}    // Click handler
  disabled={!canAfford}      // Disable if over budget
  compact={false}            // Use compact variant for lineup display
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

Example flow:

```typescript
const { data: playersByValue } = api.player.getRandomByValue.useQuery();

// User selects players
const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

// Calculate budget
const currentBudget = selectedPlayers.reduce((sum, p) => sum + p.value, 0);
const remainingBudget = 15 - currentBudget;

// Check affordability
const canAffordPlayer = (player) => player.value <= remainingBudget;
```

