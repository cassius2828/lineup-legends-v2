/**
 * Getting Technical — Topic Definitions
 *
 * Each topic appears as a card on the /getting-technical grid.
 * Clicking a card opens /getting-technical/[slug] with the video + docs.
 *
 * HOW TO ADD A NEW TOPIC:
 *   1. Add an entry to the `topics` array below.
 *   2. Give it a unique `slug` (used in the URL).
 *   3. Set `videoId` to a YouTube video ID (the part after ?v=), or leave "" for no video.
 *   4. Write your docs in the `content` field using markdown.
 *   5. Pick a `category` from the existing ones, or add a new one to `CATEGORIES`.
 *   6. Set `status` to "ready" when both video and docs are complete.
 */

export type TopicStatus = "ready" | "coming-soon";

export interface Topic {
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  /** YouTube video ID (e.g. "dQw4w9WgXcQ"). Leave "" if no video yet. */
  videoId: string;
  status: TopicStatus;
  /** Markdown string — the written documentation for this topic. */
  content: string;
}

export const CATEGORIES = [
  { key: "features", label: "Core Features", color: "#e3b920" },
  { key: "backend", label: "Backend Architecture", color: "#8317e8" },
  { key: "frontend", label: "Frontend & UX", color: "#99fcff" },
] as const;

export const topics: Topic[] = [
  // ─── CORE FEATURES ─────────────────────────────────────────────

  {
    slug: "player-value-system",
    title: "Player Value System",
    description:
      "The $1–$5 tier system that drives lineup building, budgets, and the gamble economy.",
    category: "features",
    icon: "💰",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Every player in Lineup Legends is assigned a value from **$1 to $5**, creating a tiered economy that drives all lineup decisions.

| Value | Tier | Color | Players |
|-------|------|-------|---------|
| $5 | Diamond | Light Blue | Elite superstars |
| $4 | Amethyst | Purple | All-stars |
| $3 | Gold | Gold | Quality starters |
| $2 | Silver | Silver | Role players |
| $1 | Bronze | Bronze | Bench players |

## How It Works

- Each lineup has a **budget cap** — you can't fill every slot with $5 players
- The budget constraint forces strategic decisions about where to spend
- Player values also determine gamble odds and animation intensity

## Technical Details

<!-- Add implementation details, code snippets, design decisions here -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "lineup-builder",
    title: "Lineup Builder",
    description:
      "How users create, edit, and manage their 5-position basketball lineups.",
    category: "features",
    icon: "🏀",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

The lineup builder is the core creation flow where users assemble their 5-player roster across standard basketball positions: PG, SG, SF, PF, and C.

## Key Constraints

- **Budget system** — total player values cannot exceed the budget cap
- **Position-locked** — each player fills a specific position
- **Unique players** — no duplicates within a lineup
- **Reordering** — drag-and-drop position swapping after creation

## Creation Flow

1. User selects a player for each position
2. Search with fuzzy matching (Fuse.js) to find players
3. Budget indicator updates in real-time
4. Submit creates the lineup and redirects to the detail view

## Technical Details

<!-- Add details about the PlayerSelector component, validation logic, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "rating-system",
    title: "Rating System",
    description:
      "How lineups are rated on a 1–10 scale with real-time aggregate scoring.",
    category: "features",
    icon: "⭐",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Users can rate any lineup (except their own) on a scale from **0.01 to 10**. Ratings are aggregated into an average displayed on the lineup card.

## How It Works

- **Upsert model** — rating again overwrites your previous rating
- **Atomic updates** — \`ratingSum\`, \`ratingCount\`, and \`avgRating\` are updated in a single aggregation pipeline to prevent race conditions
- **Color scale** — the rating slider transitions from red → green → diamond based on value

## Schema

\`\`\`
Rating {
  value: Number (0.01–10)
  user: ObjectId → User
  lineup: ObjectId → Lineup
}
\`\`\`

## Design Decisions

<!-- Why 0.01–10? Why upsert instead of allowing multiple ratings? Performance considerations? -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "gamble-system",
    title: "Gamble System",
    description:
      "The pack-opening-inspired gamble mechanic with weighted odds, cooldowns, and animated reveals.",
    category: "features",
    icon: "🎰",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

The gamble system lets users risk a player position for a random replacement, inspired by NBA 2K MyTeam pack openings. The result is revealed through a multi-phase card animation.

## Mechanics

- **Weighted odds** — probability tables determine which value tier the replacement player falls into
- **Daily limit** — 5 gambles per lineup per day
- **Cooldown** — 30-second minimum between gambles
- **Streak tracking** — consecutive gamble outcomes are tracked

## Outcome Tiers

| Tier | Value Change | Animation Level |
|------|-------------|-----------------|
| Jackpot | +3 or more | Extreme particles, screen shake |
| Big Win | +2 | Heavy confetti |
| Upgrade | +1 | Moderate celebration |
| Neutral | 0 | Subtle swap |
| Downgrade | -1 | Muted reveal |
| Big Loss | -2 | Dark atmosphere |
| Disaster | -3 or worse | Dramatic failure |

## Animation Pipeline

The reveal sequence has four phases: **Suspense → Reveal → Celebration → Done**

1. Mystery card with neutral-to-tier color transition
2. 3D card flip with perspective transform
3. Outcome-appropriate particles, sounds, and screen effects
4. Previous vs. new player comparison

## Technical Details

<!-- Add details about selectWeightedValue(), animation timing, sound integration -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "comments-threads",
    title: "Comments & Threads",
    description:
      "Threaded commenting system with voting on lineups.",
    category: "features",
    icon: "💬",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Every lineup has a comment section supporting top-level comments and threaded replies, with upvote/downvote voting.

## Data Model

- **Comment** — belongs to a lineup + user, has \`totalVotes\` counter
- **Thread** — a reply belonging to a comment + user, has its own \`totalVotes\`
- **CommentVote / ThreadVote** — one vote per user per item, type is upvote or downvote

## Voting Mechanics

- Users cannot vote on their own comments/threads
- Changing vote direction updates the \`totalVotes\` counter atomically
- Vote counts are denormalized on the comment/thread document for fast reads

## Technical Details

<!-- Add details about pagination, real-time updates, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "follow-system",
    title: "Follow System",
    description:
      "Social following with cursor-based pagination and denormalized counters.",
    category: "features",
    icon: "👥",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Users can follow/unfollow other users. Follower and following counts are denormalized on the User model for O(1) reads.

## Implementation

- **Toggle** — single mutation handles both follow and unfollow
- **Unique index** — compound index on \`(follower, following)\` prevents duplicates
- **Counter sync** — \`followerCount\` and \`followingCount\` are incremented/decremented atomically on follow/unfollow
- **Cursor pagination** — followers/following lists are paginated for scalability

## Technical Details

<!-- Add details about the search functionality, how counters stay in sync, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  // ─── BACKEND ARCHITECTURE ──────────────────────────────────────

  {
    slug: "database-design",
    title: "Database Design",
    description:
      "MongoDB schema design with Mongoose, virtual fields, and document relationships.",
    category: "backend",
    icon: "🗄️",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Lineup Legends uses MongoDB with Mongoose ODM. The schema design follows a consistent pattern across all models.

## Model Pattern

Every model follows this structure:

\`\`\`typescript
// 1. API Type — for responses and client-side usage
export interface Player {
  id: string;
  // ... fields
}

// 2. DB Type — for database operations
export interface PlayerDoc extends Document {
  // ... fields (no id)
}

// 3. Schema
const PlayerSchema = new Schema<PlayerDoc>({ ... });

// 4. Virtual id from _id
PlayerSchema.virtual("id").get(function() {
  return this._id.toHexString();
});

// 5. Export with hot-reload guard
export const PlayerModel =
  mongoose.models.Player ?? mongoose.model("Player", PlayerSchema);
\`\`\`

## Key Design Decisions

- **Dual types** — separate API and DB types for type safety across boundaries
- **Virtual \`id\`** — consistent string ID across all models
- **Subdocuments** — used for embedded data like lineup players and gamble results
- **Refs** — ObjectId references for relationships (user → lineup, comment → user)

## Technical Details

<!-- Add details about indexing strategy, embedding vs referencing decisions, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "trpc-api-layer",
    title: "tRPC API Layer",
    description:
      "End-to-end type-safe API with procedures, middleware, and automatic type inference.",
    category: "backend",
    icon: "🔌",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

The API layer uses tRPC for end-to-end type safety between the Next.js frontend and the server. No REST endpoints, no manual type definitions — everything is inferred.

## Procedure Types

| Type | Auth | Use Case |
|------|------|----------|
| \`publicProcedure\` | None | Public data (player list, explore lineups) |
| \`protectedProcedure\` | Logged in | User actions (create lineup, rate, comment) |
| \`adminProcedure\` | Admin role | Admin actions (manage players, view stats) |

## Middleware Stack

1. **Timing middleware** — logs procedure execution time
2. **Auth middleware** — validates session and injects typed context
3. **Admin middleware** — checks \`session.user.admin\` flag

## Router Organization

Each domain has its own router file registered in the root router:
\`player\`, \`lineup\`, \`profile\`, \`follow\`, \`feedback\`, \`requestedPlayer\`, \`admin\`, \`video\`

## Technical Details

<!-- Add details about error handling patterns, input validation with Zod, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "authentication",
    title: "Authentication",
    description:
      "NextAuth.js with Google OAuth, JWT sessions, and admin role management.",
    category: "backend",
    icon: "🔐",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Authentication is handled by NextAuth.js (Auth.js) with Google OAuth as the primary provider. Sessions use JWT strategy for stateless auth.

## Auth Flow

1. User clicks "Sign in with Google"
2. OAuth flow with Google (consent screen, redirect)
3. On first login: User document created in MongoDB
4. JWT token issued with user ID, admin flag
5. Session available server-side via \`auth()\` and client-side via \`useSession()\`

## Admin System

- \`admin\` boolean on the User model (default \`false\`)
- Set manually in the database
- JWT callback reads \`admin\` from DB and stores it in the token
- \`adminProcedure\` middleware checks the flag on every admin request

## Route Protection

- **Server components** — \`auth()\` + redirect in layout files
- **tRPC** — procedure-level middleware
- **Client** — \`useSession()\` for conditional UI

## Technical Details

<!-- Add details about session strategy decisions, token refresh, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "caching-layer",
    title: "Caching with Redis",
    description:
      "Cache-aside pattern with Redis for player data and user profiles.",
    category: "backend",
    icon: "⚡",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Redis provides a caching layer to reduce database load for frequently accessed data. The app uses a cache-aside (lazy-loading) pattern.

## Cached Data

| Key Pattern | Data | TTL | Invalidation |
|-------------|------|-----|-------------|
| \`players\` | Full player list | 24 hours | On player create/update/delete |
| \`user:{id}\` | Profile data | Until update | On profile update |

## Cache-Aside Flow

\`\`\`
1. Check Redis for cached data
2. If HIT → return cached data
3. If MISS → query MongoDB → store in Redis → return
4. On write → delete cache key (invalidate)
\`\`\`

## Design Decisions

- **Cache-aside** chosen over write-through for simplicity
- **Manual invalidation** ensures freshness on writes
- **Full list caching** for players — small dataset, read-heavy workload
- **No cache warming** — lazy population on first request

## Technical Details

<!-- Add details about Redis connection pooling, error handling, TTL strategy, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "image-pipeline",
    title: "Image Pipeline",
    description:
      "S3 uploads, CloudFront CDN delivery, and Next.js image optimization.",
    category: "backend",
    icon: "🖼️",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Images flow through a three-stage pipeline: upload to S3, serve via CloudFront CDN, and optimize with Next.js Image component.

## Upload Flow

1. Client sends image to \`/api/upload\` route
2. Server validates: auth, file type (JPEG/PNG/WebP/GIF), max 5MB
3. Image uploaded to S3 bucket at \`profiles/{userId}/{type}-{timestamp}.{ext}\`
4. CloudFront URL returned to client

## Image Types

- **Profile images** — user avatars
- **Banner images** — profile page banners
- **Player headshots** — NBA player photos (CDN-hosted)

## Optimization

- \`next/image\` component with \`fill\` mode and \`sizes\` attribute
- Remote patterns configured for CDN domains
- SVG data URL fallbacks rendered with \`unoptimized\` flag

## Technical Details

<!-- Add details about S3 bucket policy, CloudFront distribution setup, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  // ─── FRONTEND & UX ────────────────────────────────────────────

  {
    slug: "animation-system",
    title: "Animation System",
    description:
      "Framer Motion animations, particle effects, and the gamble reveal sequence.",
    category: "frontend",
    icon: "✨",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Animations are powered by Framer Motion with supplemental particle effects from \`@tsparticles/confetti\` and sound effects from \`use-sound\`.

## Gamble Reveal Sequence

The signature animation is the gamble card reveal, inspired by NBA 2K MyTeam pack openings:

1. **Suspense phase** — mystery card floats with neutral glow transitioning to tier color
2. **Reveal phase** — 3D card flip with perspective transform
3. **Celebration phase** — outcome-specific particles, screen shake, sound effects
4. **Comparison** — previous vs. new player shown

## Sound Design

| Phase | Sound | Behavior |
|-------|-------|----------|
| Suspense | Atmospheric hum | Looped at 0.55x speed |
| Reveal | Card flip | One-shot |
| Celebration | Win/neutral/lose | Based on outcome category |

## Page Transitions

- Staggered entrance animations on lists and grids
- Spring physics for interactive elements
- \`AnimatePresence\` for mount/unmount transitions

## Technical Details

<!-- Add details about performance considerations, SSR safety for particles, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "search-filtering",
    title: "Search & Filtering",
    description:
      "Client-side fuzzy search with Fuse.js and server-side regex fallback.",
    category: "frontend",
    icon: "🔍",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Search uses a hybrid approach: client-side fuzzy matching with Fuse.js for instant results, and server-side regex search as a fallback.

## Client-Side Search (Fuse.js)

- Full player list cached in Redis and fetched on page load
- Fuse.js configured with \`threshold: 0.3\` on \`firstName\` and \`lastName\`
- Results update instantly as the user types
- Value filters can be combined with text search

## Server-Side Search

- \`player.search\` procedure uses regex on \`firstName\` / \`lastName\`
- \`follow.searchUsers\` uses regex on \`name\` / \`username\` with 300ms debounce

## Design Decisions

- Client-side search chosen for player list because the dataset is small and read-heavy
- Server-side search for users because the user list can grow unbounded

## Technical Details

<!-- Add details about Fuse.js configuration, pagination strategy, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },

  {
    slug: "error-handling",
    title: "Error Handling & Monitoring",
    description:
      "Sentry integration, error boundaries, toast notifications, and loading states.",
    category: "frontend",
    icon: "🛡️",
    videoId: "",
    status: "coming-soon",
    content: `
## Overview

Error handling spans four layers: global error reporting (Sentry), route-level error boundaries, user-facing toast notifications, and loading states.

## Error Reporting (Sentry)

- Client, server, and edge runtime configs
- \`global-error.tsx\` captures and reports uncaught errors
- Enabled only in production (\`NODE_ENV === "production"\`)

## Error Boundaries

- Route-level \`error.tsx\` files for lineups, players, profile, and admin
- Each shows the error message, a "Try Again" button, and a "Go Home" link

## User Feedback

- **Toast notifications** (Sonner) for all error messages — no native \`alert()\` calls
- **Confirmation modals** for destructive actions (delete lineup, remove video)
- **Loading states** — route-level \`loading.tsx\` with branded spinners

## Technical Details

<!-- Add details about Sentry configuration, custom error classes, etc. -->

_Content coming soon — add your video and detailed writeup here._
`,
  },
];

/** Helper to find a topic by slug */
export function getTopicBySlug(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}

/** Helper to get topics grouped by category */
export function getTopicsByCategory(): { key: string; label: string; color: string; topics: Topic[] }[] {
  return CATEGORIES.map((cat) => ({
    ...cat,
    topics: topics.filter((t) => t.category === cat.key),
  }));
}
