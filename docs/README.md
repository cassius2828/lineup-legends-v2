# Lineup Legends v2 Documentation

Welcome to the Lineup Legends v2 documentation. This directory contains detailed documentation on all features and aspects of the application.

## Table of Contents

| Document                              | Description                                        |
| ------------------------------------- | -------------------------------------------------- |
| [Authentication](./authentication.md) | OAuth authentication with NextAuth.js              |
| [Lineups](./lineups.md)               | Creating, managing, and exploring fantasy lineups  |
| [Players](./players.md)               | Player data structure, values, and retrieval       |
| [tRPC API](./trpc-api.md)             | End-to-end type-safe API architecture              |
| [Database](./database.md)             | Prisma schema and MongoDB integration              |
| [Components](./components.md)         | Reusable React components and their usage          |

## Quick Start

1. Install dependencies: `npm install`
2. Set up environment variables (see [Database](./database.md#environment-variables))
3. Push database schema: `npm run db:push`
4. Seed players: `npm run db:seed`
5. Start development server: `npm run dev`

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐│
│  │   Pages       │  │  Components   │  │   tRPC React Hooks    ││
│  │  (App Router) │  │  (PlayerCard, │  │   (api.player.getAll) ││
│  │               │  │   LineupCard) │  │                       ││
│  └───────────────┘  └───────────────┘  └───────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTP (tRPC Protocol)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      tRPC Server (API Layer)                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐│
│  │ playerRouter  │  │ lineupRouter  │  │   Auth Middleware     ││
│  │               │  │               │  │   (protectedProcedure)││
│  └───────────────┘  └───────────────┘  └───────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Prisma ORM
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          MongoDB                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐│
│  │ Player  │  │ Lineup  │  │  User   │  │ Account │  │Session ││
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Key Technologies

| Technology   | Purpose                          | Documentation                                        |
| ------------ | -------------------------------- | ---------------------------------------------------- |
| Next.js 15   | React framework with App Router  | [nextjs.org](https://nextjs.org/docs)                |
| NextAuth v5  | OAuth authentication             | [authjs.dev](https://authjs.dev)                     |
| tRPC         | Type-safe API layer              | [trpc.io](https://trpc.io/docs)                      |
| Prisma       | Database ORM                     | [prisma.io](https://www.prisma.io/docs)              |
| Tailwind CSS | Utility-first styling            | [tailwindcss.com](https://tailwindcss.com/docs)      |
| React Query  | Server state management          | [tanstack.com](https://tanstack.com/query/latest)    |
| Zod          | Schema validation                | [zod.dev](https://zod.dev)                           |

## Contributing

When adding new features, please update the relevant documentation files to keep them current.

