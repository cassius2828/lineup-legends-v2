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

- **Explore Lineups**: Browse lineups created by other users.
- **Sorting Options**: Sort lineups by newest or oldest to find what you're looking for.

### Authentication

- **OAuth Sign-In**: Secure authentication powered by NextAuth.js with support for various providers.
- **Protected Routes**: Create and manage your lineups with secure, authenticated endpoints.

## Tech Stack

This project is built with the [T3 Stack](https://create.t3.gg/):

- **[Next.js 15](https://nextjs.org)**: React framework with App Router and Turbo mode
- **[NextAuth.js v5](https://next-auth.js.org)**: Authentication for Next.js
- **[Prisma](https://prisma.io)**: Type-safe database ORM with MongoDB
- **[tRPC](https://trpc.io)**: End-to-end type-safe APIs
- **[Tailwind CSS v4](https://tailwindcss.com)**: Utility-first CSS framework
- **[React Query](https://tanstack.com/query)**: Powerful data synchronization for React
- **[Zod](https://zod.dev)**: TypeScript-first schema validation
- **[TypeScript](https://www.typescriptlang.org)**: Type-safe JavaScript

## Project Structure

```
lineup-legends-v2/
├── prisma/
│   ├── schema.prisma      # Database schema (Player, Lineup, User, etc.)
│   └── seed.ts            # Database seeding script
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── _components/   # Shared React components
│   │   ├── api/           # API routes (auth, tRPC)
│   │   ├── lineups/       # Lineup pages (list, new, explore)
│   │   └── page.tsx       # Home page
│   ├── server/
│   │   ├── api/           # tRPC routers and procedures
│   │   │   ├── routers/   # Feature-specific routers (lineup, player)
│   │   │   ├── root.ts    # Root tRPC router
│   │   │   └── trpc.ts    # tRPC configuration
│   │   ├── auth/          # NextAuth.js configuration
│   │   └── db.ts          # Prisma client instance
│   ├── trpc/              # tRPC client setup
│   └── styles/            # Global CSS styles
└── generated/             # Generated Prisma client
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or cloud)
- npm 10+

### Clone the Repository

```bash
git clone https://github.com/yourusername/lineup-legends-v2.git
cd lineup-legends-v2
```

### Install Dependencies

```bash
npm install
```

### Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/lineup-legends"

# NextAuth
AUTH_SECRET="your-auth-secret-here"

# OAuth Provider (example: Discord)
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"
```

> Generate an auth secret with: `npx auth secret`

### Set Up the Database

```bash
# Push schema to database
npm run db:push

# Seed the database with players
npm run db:seed
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

| Script                 | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start development server with Turbo |
| `npm run build`        | Build for production                |
| `npm run start`        | Start production server             |
| `npm run db:push`      | Push Prisma schema to database      |
| `npm run db:generate`  | Generate Prisma migrations          |
| `npm run db:studio`    | Open Prisma Studio                  |
| `npm run db:seed`      | Seed database with player data      |
| `npm run lint`         | Run ESLint                          |
| `npm run format:check` | Check code formatting               |
| `npm run format:write` | Fix code formatting                 |
| `npm run typecheck`    | Run TypeScript type checking        |

## API Routes

### tRPC Endpoints

**Players**

- `player.getAll` - Get all players (optionally filtered by value)
- `player.getById` - Get a single player by ID
- `player.getRandomByValue` - Get random players grouped by value tier
- `player.search` - Search players by name

**Lineups**

- `lineup.create` - Create a new lineup (protected)
- `lineup.getByCurrentUser` - Get current user's lineups (protected)
- `lineup.getByUserId` - Get lineups by user ID
- `lineup.getAll` - Get all lineups (explore)
- `lineup.getById` - Get a single lineup
- `lineup.delete` - Delete a lineup (protected, owner only)
- `lineup.toggleFeatured` - Toggle featured status (protected, owner only)

## Future Enhancements

- **Rating System**: Rate other users' lineups and receive ratings on yours
- **Gambling Mechanics**: Gamble players for those of greater, equal, or lesser value
- **Friend System**: Add friends and interact with their lineups
- **Comments and Threads**: Engage in discussions through comments
- **Social Media Sharing**: Share lineups on social media platforms
- **Earning System**: Earn rewards and achievements
- **Mobile App**: React Native version for mobile

## External Libraries

- **[date-fns](https://date-fns.org/)**: Modern JavaScript date utility library

## Contributing

We welcome contributions! Please fork the repository and submit pull requests.

Thank you for being part of **Lineup Legends**! Continue building, sharing, and celebrating your love for fantasy basketball with our vibrant community. Your journey as a top fantasy GM starts here!

## Learn More

- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
