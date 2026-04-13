# Lineup Legends v2

Welcome to **Lineup Legends v2**, the modernized fantasy basketball lineup creation and management platform. Build your dream team, engage with the community, and showcase your strategic prowess!

> _This is a complete rebuild of [Lineup Legends](https://lineup-legends-5bdbc4813272.herokuapp.com/) using the T3 Stack for improved performance, type safety, and developer experience._

## Features

### Lineup Creation

- **Budget Management**: Start with a $15 budget to create your lineup.
- **Random Player Selection**: Choose from over 200 unique players valued from $1 to $5, ensuring fairness and excitement.
- **Position-Based Teams**: Build complete 5-player lineups with PG, SG, SF, PF, and C positions.
- **Featured Lineups**: Mark up to 3 lineups as featured to showcase your best work.

### Community Engagement

- **Explore Lineups**: Browse lineups created by other users with infinite scroll and server-side filtering.
- **Filter & Sort**: Filter lineups by date range (presets or custom calendar), minimum rating, or user. Sort by newest, oldest, highest-rated, or most-rated.
- **Rate Lineups**: Rate other users' lineups on a scale.
- **Bookmark Lineups**: Save lineups for later viewing.
- **Follow Users**: Follow other users and build your network.
- **User Profiles**: Customize your profile with images and bio.

### Gamble System

- **Player Gambling**: Gamble a player in your lineup for a random replacement — once per lineup, choose wisely.
- **Animated Reveals**: NBA 2K-inspired card reveal animations with tier-based effects and sounds.

### Player Profiles (Wikipedia Integration)

- **Auto-fetched Biographies**: Wikipedia summaries, career stats, awards, and physical measurements for every player
- **Career Stats Toggle**: View career averages or season bests (with games played) for each stat category
- **AI Fallback**: When HTML parsing fails, GPT-4o-mini extracts awards and career stats from the Wikipedia page
- **Backfill Script**: Batch-process all 300+ players with `npx tsx scripts/backfill-wiki.ts`

### Authentication

- **Google OAuth**: Secure authentication via Google.
- **Credentials Login**: Sign in with email/username and password.
- **Protected Routes**: Create and manage your lineups with secure, authenticated endpoints.
- **Rate Limiting**: Redis-backed per-IP rate limiting on external API mutations

## Tech Stack

This project is built with the [T3 Stack](https://create.t3.gg/):

- **[Next.js 15](https://nextjs.org)**: React framework with App Router and Turbo mode
- **[NextAuth.js v5](https://next-auth.js.org)**: Authentication for Next.js
- **[Mongoose](https://mongoosejs.com)**: MongoDB ODM with schema validation
- **[tRPC](https://trpc.io)**: End-to-end type-safe APIs
- **[Tailwind CSS v4](https://tailwindcss.com)**: Utility-first CSS framework
- **[React Query](https://tanstack.com/query)**: Powerful data synchronization for React
- **[Zod](https://zod.dev)**: TypeScript-first schema validation
- **[TypeScript](https://www.typescriptlang.org)**: Type-safe JavaScript
- **[Redis](https://redis.io)**: Caching and rate limiting via ioredis
- **[Framer Motion](https://www.framer.com/motion/)**: Animation library
- **[Cheerio](https://cheerio.js.org)**: HTML parsing for Wikipedia career stats extraction
- **[OpenAI](https://platform.openai.com)**: GPT-4o-mini fallback for awards and career stats extraction

## Project Structure

```
lineup-legends-v2/
├── public/                 # Static assets (images, sounds)
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── _components/    # Shared React components
│   │   ├── api/            # API routes (auth, tRPC, uploads)
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── lineups/        # Lineup pages (list, new, explore, rate, gamble)
│   │   ├── players/        # Player catalog
│   │   ├── profile/        # User profile pages
│   │   └── page.tsx        # Landing page
│   ├── hooks/              # Shared React hooks (e.g. useEnsureWikiData)
│   ├── server/
│   │   ├── api/            # tRPC routers and procedures
│   │   │   ├── routers/    # Feature-specific routers
│   │   │   ├── root.ts     # Root tRPC router
│   │   │   └── trpc.ts     # tRPC configuration + rate limiting
│   │   ├── auth/           # NextAuth.js configuration
│   │   ├── lib/            # Wikipedia parsing, AI extraction, utilities
│   │   ├── models/         # Mongoose schemas and models
│   │   └── db.ts           # MongoDB connection
│   ├── lib/                # Shared utilities
│   ├── trpc/               # tRPC client setup
│   └── styles/             # Global CSS styles
└── scripts/                # Backfill, migration, and utility scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or cloud)
- Redis instance (local or cloud)
- npm 10+

### Clone the Repository

```bash
git clone https://github.com/cassius2828/lineup-legends-v2.git
cd lineup-legends-v2
```

### Install Dependencies

```bash
npm install
```

### Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

See `.env.example` for all required variables. Generate an auth secret with:

```bash
npx auth secret
```

### Seed the Database

```bash
npm run db:seed
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

| Script                                             | Description                             |
| -------------------------------------------------- | --------------------------------------- |
| `npm run dev`                                      | Start development server with Turbo     |
| `npm run build`                                    | Build for production                    |
| `npm run start`                                    | Start production server                 |
| `npm run db:seed`                                  | Seed database with player data          |
| `npm run lint`                                     | Run ESLint                              |
| `npm run lint:fix`                                 | Run ESLint with auto-fix                |
| `npm run format:check`                             | Check code formatting                   |
| `npm run format:write`                             | Fix code formatting                     |
| `npm run typecheck`                                | Run TypeScript type checking            |
| `npm run test`                                     | Run tests                               |
| `npm run test:watch`                               | Run tests in watch mode                 |
| `npm run test:coverage`                            | Run tests with coverage                 |
| `npx tsx scripts/backfill-wiki.ts`                 | Backfill Wikipedia data for all players |
| `npx tsx scripts/backfill-wiki.ts --refresh-stats` | Force re-fetch all player wiki data     |

## Learn More

- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [tRPC Documentation](https://trpc.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
