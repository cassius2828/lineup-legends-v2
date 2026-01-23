# Components

This document describes the reusable React components in Lineup Legends v2. All components are located in `src/app/_components/`.

## Overview

| Component          | Purpose                              | Type   |
| ------------------ | ------------------------------------ | ------ |
| `PlayerCard`       | Display individual player            | Client |
| `PlayerSelector`   | Interactive player selection grid    | Client |
| `LineupCard`       | Display complete lineup with actions | Client |

## PlayerCard

Displays a single basketball player with their image, name, and value.

### Location

`src/app/_components/PlayerCard.tsx`

### Props

```typescript
interface PlayerCardProps {
  player: Player;           // Player data
  selected?: boolean;       // Whether player is selected (default: false)
  onSelect?: (player: Player) => void;  // Click handler
  disabled?: boolean;       // Disable interaction (default: false)
  compact?: boolean;        // Use compact layout (default: false)
}
```

### Modes

#### Standard Mode

Full-size card for player selection:

```tsx
<PlayerCard
  player={player}
  selected={isSelected}
  onSelect={handlePlayerClick}
  disabled={!canAfford}
/>
```

Features:

- Circular player headshot (80x80px)
- Value badge in top-right corner
- Colored border on selection
- Checkmark overlay when selected
- Opacity reduction when disabled
- Hover state with background change

#### Compact Mode

Inline display for lineup cards:

```tsx
<PlayerCard player={player} compact />
```

Features:

- Horizontal layout
- Smaller image (40x40px)
- Inline value badge
- Player name truncation

### Value Color Coding

```typescript
const valueColors: Record<number, string> = {
  1: "bg-gray-500",    // Role players
  2: "bg-green-500",   // Solid contributors
  3: "bg-blue-500",    // Quality starters
  4: "bg-purple-500",  // All-stars
  5: "bg-amber-500",   // Superstars
};
```

### Usage Example

```tsx
import { PlayerCard } from "~/app/_components/PlayerCard";

function PlayerGrid({ players }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-5 gap-4">
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          selected={selected === player.id}
          onSelect={() => setSelected(player.id)}
        />
      ))}
    </div>
  );
}
```

---

## PlayerSelector

Interactive component for selecting 5 players within a budget to create a lineup.

### Location

`src/app/_components/PlayerSelector.tsx`

### Props

```typescript
interface PlayersByValue {
  value1Players: Player[];
  value2Players: Player[];
  value3Players: Player[];
  value4Players: Player[];
  value5Players: Player[];
}

interface PlayerSelectorProps {
  playersByValue: PlayersByValue;          // Players grouped by value
  onSubmit: (selectedPlayers: Player[]) => void;  // Submit callback
  isSubmitting?: boolean;                  // Loading state (default: false)
}
```

### Features

#### Budget Tracking

- Displays remaining budget (out of $15)
- Color-coded budget indicator:
  - Emerald: $6+ remaining
  - Amber: $3-5 remaining
  - Red: $0-2 remaining

#### Selected Players Preview

Shows 5 position slots (PG, SG, SF, PF, C) with:

- Empty dashed border when unassigned
- Player thumbnail when assigned

#### Player Grid

- Grouped by value tier ($5 → $1)
- 5 columns on large screens, responsive
- Disabled state for unaffordable players
- Visual selection feedback

#### Actions

- **Clear**: Reset all selections
- **Create Lineup**: Submit when 5 players selected

### State Management

```typescript
const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

const currentBudget = selectedPlayers.reduce((sum, p) => sum + p.value, 0);
const remainingBudget = BUDGET_LIMIT - currentBudget;
const canSubmit = selectedPlayers.length === 5;
```

### Usage Example

```tsx
import { PlayerSelector } from "~/app/_components/PlayerSelector";

function CreateLineupPage() {
  const { data: playersByValue } = api.player.getRandomByValue.useQuery();
  const createLineup = api.lineup.create.useMutation();

  const handleSubmit = (selectedPlayers: Player[]) => {
    createLineup.mutate({
      pgId: selectedPlayers[0].id,
      sgId: selectedPlayers[1].id,
      sfId: selectedPlayers[2].id,
      pfId: selectedPlayers[3].id,
      cId: selectedPlayers[4].id,
    });
  };

  if (!playersByValue) return <Loading />;

  return (
    <PlayerSelector
      playersByValue={playersByValue}
      onSubmit={handleSubmit}
      isSubmitting={createLineup.isPending}
    />
  );
}
```

---

## LineupCard

Displays a complete lineup with all 5 players and optional owner actions.

### Location

`src/app/_components/LineupCard.tsx`

### Props

```typescript
type LineupWithRelations = Lineup & {
  pg: Player;
  sg: Player;
  sf: Player;
  pf: Player;
  c: Player;
  owner: User;
};

interface LineupCardProps {
  lineup: LineupWithRelations;    // Lineup with relations
  showOwner?: boolean;            // Show owner info (default: true)
  onDelete?: (id: string) => void;           // Delete callback
  onToggleFeatured?: (id: string) => void;   // Feature toggle callback
  onVote?: (lineupId: string, type: "upvote" | "downvote") => void;
  isOwner?: boolean;              // Show owner actions (default: false)
  currentUserId?: string;         // For vote permission check
  userVote?: "upvote" | "downvote" | null;   // User's current vote
}
```

### Layout

```
┌──────────────────────────────────────────────────────┐
│  [Owner Avatar] Owner Name   Featured     2h ago $12 │
│  ──────────────────────────────────────────────────  │
│  ▲ 42 ▼  ★ 4.5  Rate                                 │
│  ──────────────────────────────────────────────────  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │  PG  │ │  SG  │ │  SF  │ │  PF  │ │  C   │       │
│  │Player│ │Player│ │Player│ │Player│ │Player│       │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │
│  ──────────────────────────────────────────────────  │
│                    [Reorder] [Gamble] [Feature] [X]  │
└──────────────────────────────────────────────────────┘
```

### Features

#### Header

- Owner avatar and name (links to profile)
- Featured badge (amber highlight)
- Relative timestamp (using date-fns)
- Total lineup value

#### Stats Bar

- Voting buttons (upvote/downvote)
- Vote count with color coding
- Average rating display
- Rate link for non-owners
- Gambled count indicator

#### Player Grid

- 5-column layout
- Position labels (PG, SG, SF, PF, C)
- Compact PlayerCard for each position

#### Owner Actions

Visible only when `isOwner={true}`:

- **Reorder**: Link to edit page
- **Gamble**: Link to gambling page
- **Feature/Unfeature**: Toggle featured status
- **Delete**: Remove lineup (with confirmation)

### Usage Examples

#### Explore Page (Public View)

```tsx
<LineupCard
  lineup={lineup}
  showOwner={true}
  isOwner={false}
/>
```

#### My Lineups Page (Owner View)

```tsx
<LineupCard
  lineup={lineup}
  showOwner={false}
  isOwner={true}
  onDelete={(id) => deleteLineup.mutate({ id })}
  onToggleFeatured={(id) => toggleFeatured.mutate({ id })}
/>
```

#### With Voting (Future)

```tsx
<LineupCard
  lineup={lineup}
  showOwner={true}
  isOwner={false}
  currentUserId={session.user.id}
  userVote={userVotes[lineup.id]}
  onVote={(lineupId, type) => vote.mutate({ lineupId, type })}
/>
```

---

## Styling Conventions

All components use Tailwind CSS with these patterns:

### Color Scheme

```css
/* Backgrounds */
bg-slate-900         /* Primary background */
bg-white/5           /* Card backgrounds */
bg-white/10          /* Interactive elements */

/* Accents */
bg-emerald-600       /* Primary actions */
bg-amber-500         /* Featured/Warning */
bg-red-500           /* Destructive actions */
bg-purple-500        /* Special actions */

/* Text */
text-white           /* Primary text */
text-white/70        /* Secondary text */
text-white/50        /* Muted text */
```

### Responsive Breakpoints

```css
sm:  /* 640px  - Small screens */
md:  /* 768px  - Medium screens */
lg:  /* 1024px - Large screens */
```

### Common Patterns

```tsx
// Card container
<div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm">

// Button primary
<button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500">

// Button secondary
<button className="rounded-lg bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20">

// Disabled state
disabled:cursor-not-allowed disabled:opacity-50
```

## Creating New Components

When adding new components:

1. Place in `src/app/_components/`
2. Use `"use client"` directive if using hooks/interactivity
3. Export named functions (not default exports)
4. Define TypeScript interfaces for props
5. Follow existing Tailwind patterns
6. Document in this file

