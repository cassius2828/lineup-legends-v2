# Components

This document describes the reusable React components in Lineup Legends v2. Components are located in `src/app/_components/`.

## Overview

| Component                       | Purpose                                     | Type   |
| ------------------------------- | ------------------------------------------- | ------ |
| `PlayerCard`                    | Display individual player                   | Client |
| `PlayerImage`                   | Player headshot with retry/fallback         | Client |
| `DraggablePlayerCard`           | Player card with drag support               | Client |
| `DroppablePositionSlot`         | Position slot accepting dropped players     | Client |
| `PlayerSelector`                | Interactive player selection for lineups    | Client |
| `PlayerGrid`                    | Value-tiered grid of draggable players      | Client |
| `OrderLineup`                   | Position slots + submit for lineup creation | Client |
| `LineupCard`                    | Display complete lineup with actions        | Client |
| `LineupCardHeader`              | Owner info, featured badge, timestamp       | Client |
| `LineupCardStatsBar`            | Rating display, gamble count, rate link     | Client |
| `LineupCardPlayersGrid`         | 5-position player grid                      | Client |
| `LineupCardFooter`              | Comment, view, bookmark, share              | Client |
| `LineupCardOwnerActions`        | Reorder, gamble, feature, delete            | Client |
| `ShareMenu`                     | Share via link, social, SMS, email          | Client |
| `CommentCard`                   | Comment with votes, media, reply            | Client |
| `ThreadCard`                    | Thread reply with votes and media           | Client |
| `CommentModal`                  | Modal for commenting or viewing replies     | Client |
| `GifPicker`                     | Giphy-powered GIF search and selection      | Client |
| `ComposerToolbar`               | Image upload or GIF attachment toolbar      | Client |
| `DuplicateHints`                | Player request duplicate match warnings     | Client |
| `SearchInput`                   | Reusable search input with styling          | Client |
| `ConfirmModal`                  | Confirmation dialog                         | Client |
| `LineupCardGrid`                | Responsive grid layout for lineup cards     | Client |
| `CareerStatsToggle`             | Career averages / season bests toggle       | Client |
| `CareerStatValue`               | Single stat cell with shimmer loading       | Client |
| `WikiPlayerMeasurements`        | Height/weight from Wikipedia infobox        | Client |
| `CreateLineupPlayerDetailPanel` | Player detail panel in lineup builder       | Client |

---

## PlayerCard

Displays a single basketball player with their image, name, and value.

### Location

`src/app/_components/PlayerCard.tsx`

### Props

```typescript
interface PlayerCardProps {
  player: PlayerType;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean; // default: false
}
```

### Modes

#### Standard Mode

Full-size card used in player grids and detail views:

- Square cell with value-colored shadow
- Gold check overlay when selected
- Navigates to `/players/[id]` on click
- Names longer than 8 characters are hidden to prevent overflow

#### Compact Mode

Inline display used in lineup cards:

- Circular player image with truncated name
- Navigates to player detail on image click

### Value Color Coding

Each value tier has a distinct shadow/accent color:

```typescript
const valueColors = {
  1: "bg-gray-500", // Role players
  2: "bg-green-500", // Solid contributors
  3: "bg-blue-500", // Quality starters
  4: "bg-purple-500", // All-stars
  5: "bg-amber-500", // Superstars
};
```

---

## PlayerImage

Renders a player headshot with automatic retry and fallback.

### Location

`src/app/_components/PlayerImage.tsx`

### Props

```typescript
interface PlayerImageProps {
  imgUrl: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}
```

### Behavior

- Uses Next.js `Image` component
- On load error, retries up to 3 times with a `?retry=n` query parameter
- After all retries fail, renders an SVG data-URL fallback silhouette

---

## DraggablePlayerCard / DroppablePositionSlot

Drag-and-drop components for lineup creation using **dnd-kit**.

### DraggablePlayerCard

`src/app/_components/DraggablePlayerCard.tsx`

- Wraps PlayerCard with `useDraggable` from dnd-kit
- Drag disabled when player is disabled and not selected
- Click toggles selection (deselects if already selected)

### DroppablePositionSlot

`src/app/_components/DroppablePositionSlot.tsx`

- Position label (PG, SG, SF, PF, C) + droppable slot
- Empty state (dashed border) vs filled state (player card)
- Swap indicator ring when dragging over an occupied slot
- Remove "×" button to clear a filled slot

---

## PlayerSelector

Interactive component for selecting 5 players within a budget to create a lineup.

### Location

`src/app/_components/CreateNew/PlayerSelector.tsx`

### Props

```typescript
interface PlayerSelectorProps {
  playersByValue: PlayersByValue;
  onSubmit: (selectedPlayers: PlayerType[]) => void;
  isSubmitting?: boolean;
  isAuthenticated?: boolean; // default: true
}
```

### Features

- **Budget tracking**: Displays remaining budget (out of $15) with color coding
- **Position slots**: 5 DroppablePositionSlots for PG, SG, SF, PF, C
- **Drag-and-drop**: Drag players from the grid to position slots; supports swap on occupied slots
- **Click assignment**: Click a player to assign them to the first empty slot
- **Player grid**: 5 rows grouped by value tier ($5 → $1), 5 columns each
- **Disabled states**: Players unaffordable or all slots filled
- **Submit validation**: Requires 5 players and authentication
- **Clear selection**: Resets all position slots

---

## LineupCard

Displays a complete lineup with stats, actions, and social features.

### Location

`src/app/_components/LineupCard/LineupCard.tsx`

### Props

```typescript
interface LineupCardProps {
  lineup: LineupWithRelations;
  showOwner?: boolean; // default: true
  onDelete?: (id: string) => void;
  onToggleFeatured?: (id: string) => void;
  isOwner?: boolean; // default: false
  featured?: boolean; // default: false
  hideFooter?: boolean; // default: false
}
```

### Sub-components

#### LineupCardHeader

- Owner avatar and name (links to `/profile/[ownerId]`)
- "Featured" pill when lineup is featured
- Relative timestamp (via date-fns)
- Total lineup value pill

#### LineupCardStatsBar

- Average rating display (star icon + value or "–")
- Rating count ("Rated N times" or "Not rated yet")
- Times gambled indicator (dice icon, shown when > 0)
- Link to rate page (disabled for owners and unauthenticated users with toast prompt)

#### LineupCardPlayersGrid

- 5-column layout of compact PlayerCards
- Position labels (PG, SG, SF, PF, C)

#### LineupCardOwnerActions

Visible only when `isOwner={true}`:

- **Reorder**: Link to `/lineups/[id]/edit`
- **Gamble**: Link to `/lineups/[id]/gamble`
- **Feature/Unfeature**: Toggle featured status
- **Delete**: Remove lineup (with confirmation)

#### LineupCardFooter

- **Comment**: Opens CommentModal (unauthenticated users get a toast prompt)
- **View**: Links to `/lineups/[id]` detail page
- **Bookmark**: Toggle bookmark (authenticated only, optimistic update)
- **Share**: ShareMenu dropdown

#### ShareMenu

- Copy link to clipboard
- Web Share API (on supported browsers)
- Share to X (Twitter), Facebook, SMS, Email
- Dismisses on outside click or Escape

---

## Comment System

### CommentCard

`src/app/_components/Comment/CommentCard.tsx`

Displays a single comment on a lineup:

- User avatar, name, and relative timestamp
- Comment text with optional attached image or GIF
- Reply button (shows thread count if replies exist)
- Upvote/downvote buttons with total vote count (via `useVote` hook)
- Delete button for the comment author (with confirmation, warns about cascading thread deletion)

### ThreadCard

`src/app/_components/Comment/ThreadCard.tsx`

Displays a thread reply to a comment:

- Same media/voting/delete pattern as CommentCard
- Optional "Replying to @user" label with vertical connector line
- No nested reply button (threads are one level deep)

### CommentModal

`src/app/_components/Comment/CommentModal.tsx`

Portal-based modal for adding comments or viewing/replying to threads:

- **Comment mode**: Textarea for new comment on a lineup
- **Reply mode**: Shows existing comment, thread list with infinite scroll, textarea for new reply
- Framer Motion animations
- Body scroll lock while open
- ComposerToolbar for image/GIF attachments
- Escape key to close

### GifPicker

`src/app/_components/Comment/GifPicker.tsx`

GIF search powered by the **Giphy SDK**:

- Search input with 300ms debounce
- Shows trending GIFs when search is empty
- Grid layout of results
- Returns `fixed_height` URL on selection
- "Powered by GIPHY" attribution

### ComposerToolbar

`src/app/_components/Comment/ComposerToolbar.tsx`

Toolbar for attaching media to comments/threads:

- Image upload (JPEG, PNG, WebP, GIF) via `useImageUpload` hook
- GIF selection via GifPicker
- Single attachment at a time (image or GIF)
- Preview with remove button

---

## Wikipedia Player Components

### CareerStatsToggle

`src/app/_components/common/CareerStatsToggle.tsx`

Toggleable display switching between career averages and season bests. Used on both the player detail page (`/players/[id]`) and the lineup builder side panel.

**Props:**

```typescript
interface CareerStatsToggleProps {
  averages?: Record<string, string> | null;
  bests?: Record<string, { value: string; season: string }> | null;
  loading?: boolean;
  hasCareerStats?: boolean;
  headingAs?: "h2" | "h3"; // default: "h2"
}
```

**Behavior:**

- Defaults to "Career Averages" tab
- Season bests display includes games played (GP) next to the team/year
- Shows shimmer skeletons when `loading` is true
- Shows a "No career stats table found" message when `hasCareerStats` is false

### CareerStatValue

`src/app/_components/common/CareerStatValue.tsx`

Individual stat cell used inside `CareerStatsToggle` for both averages and bests:

- Shimmer skeleton while loading
- Stat label (e.g. "PPG", "RPG") with the value below
- Em dash (—) for missing or zero values
- Staggered entrance animation via Framer Motion

### WikiPlayerMeasurements

`src/app/_components/common/WikiPlayerMeasurements.tsx`

Displays listed height and weight parsed from the Wikipedia infobox. Shows the raw string from Wikipedia (e.g. "6 ft 9 in (2.06 m)").

### CreateLineupPlayerDetailPanel

`src/app/_components/CreateNew/CreateLineupPlayerDetailPanel.tsx`

Side panel that opens when a player is clicked during lineup creation:

- Player image with tier glow
- Wikipedia biography excerpt
- `WikiPlayerMeasurements` for height/weight
- `CareerStatsToggle` for career stats
- Awards list
- Uses the `useEnsureWikiData` hook to trigger fetch on panel open

---

## DuplicateHints

`src/app/_components/PlayerRequest/DuplicateHints.tsx`

Shows potential duplicate matches when requesting a new player:

- Displays up to 5 matches with match percentage
- Color-coded by match confidence (green/yellow/red)
- Uses Fuse.js fuzzy matching from the `requestedPlayer.searchDuplicates` endpoint

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
