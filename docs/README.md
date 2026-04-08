# Lineup Legends v2 Documentation

Welcome to the Lineup Legends v2 documentation. This directory contains detailed documentation on all features and aspects of the application.

## Table of Contents

| Document                                                                 | Description                                                     |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| [Authentication](./authentication.md)                                    | OAuth + credentials authentication with NextAuth.js             |
| [Lineups](./lineups.md)                                                  | Creating, managing, and exploring fantasy lineups               |
| [Lineup popularity: ratings only](./lineup-ratings-vs-votes-proposal.md) | Why lineups use ratings (not votes) and current design          |
| [Gambling mechanic](./gambling-mechanic.md)                              | Weighted odds, probability matrix, daily limits, streaks        |
| [Players](./players.md)                                                  | Player data structure, values, and retrieval                    |
| [User Profile](./user-profile.md)                                        | Profile pages, image uploads, follow system, lineup stats       |
| [Contact & Feedback](./contact.md)                                       | Contact page, feedback form, player requests, email integration |
| [tRPC API](./trpc-api.md)                                                | End-to-end type-safe API architecture                           |
| [Database](./database.md)                                                | Mongoose models and MongoDB integration                         |
| [Components](./components.md)                                            | Reusable React components and their usage                       |
| [Admin Dashboard](./admin.md)                                            | Admin interface, stats, feedback, and player management         |
| [Architecture & Scale Review](./architecture-scale-review.md)            | Scalability analysis and migration plans                        |
| [Testing](./testing.md)                                                  | Unit tests (Jest) and E2E smoke tests (Playwright)              |

## Quick Start

1. Install dependencies: `npm install`
2. Set up environment variables (see [Database](./database.md#environment-variables))
3. Seed players: `npm run db:seed`
4. Start development server: `npm run dev`
5. Run unit tests: `npm test`
6. Run E2E tests: `npm run test:e2e` (requires dev server or auto-starts one)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐│
│  │   Pages       │  │  Components   │  │   tRPC React Hooks    ││
│  │  (App Router) │  │  (PlayerCard, │  │   (api.player.getAll) ││
│  │               │  │   LineupCard, │  │                       ││
│  │               │  │   CommentCard)│  │                       ││
│  └───────────────┘  └───────────────┘  └───────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTP (tRPC Protocol)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      tRPC Server (API Layer)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │ player   │ │ lineup   │ │ comment  │ │  Auth Middleware    │ │
│  │ Router   │ │ Router   │ │ Router   │ │  (protectedProc,   │ │
│  ├──────────┤ ├──────────┤ ├──────────┤ │   adminProcedure)  │ │
│  │ profile  │ │ follow   │ │ feedback │ └────────────────────┘ │
│  │ Router   │ │ Router   │ │ Router   │                        │
│  ├──────────┤ ├──────────┤ ├──────────┤                        │
│  │ admin    │ │ bookmark │ │ video    │                        │
│  │ Router   │ │ Router   │ │ Router   │                        │
│  ├──────────┤ └──────────┘ └──────────┘                        │
│  │requested │                                                   │
│  │Player    │                                                   │
│  └──────────┘                                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                     ┌─────────┴─────────┐
                     │ Mongoose ODM      │ Redis (ioredis)
                     ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB + Redis Cache                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Player │ │ Lineup │ │  User  │ │ Comment  │ │   Thread   │ │
│  ├────────┤ ├────────┤ ├────────┤ ├──────────┤ ├────────────┤ │
│  │ Rating │ │ Follow │ │Bookmark│ │CommentVt │ │ ThreadVote │ │
│  ├────────┤ ├────────┤ ├────────┤ ├──────────┤ ├────────────┤ │
│  │Feedback│ │ReqPlay │ │ Video  │ │ Account  │ │  Session   │ │
│  └────────┘ └────────┘ └────────┘ └──────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Key Technologies

| Technology    | Purpose                         | Documentation                                         |
| ------------- | ------------------------------- | ----------------------------------------------------- |
| Next.js 15    | React framework with App Router | [nextjs.org](https://nextjs.org/docs)                 |
| NextAuth v5   | OAuth + credentials auth        | [authjs.dev](https://authjs.dev)                      |
| tRPC          | Type-safe API layer             | [trpc.io](https://trpc.io/docs)                       |
| Mongoose      | MongoDB ODM                     | [mongoosejs.com](https://mongoosejs.com/docs/)        |
| Tailwind CSS  | Utility-first styling           | [tailwindcss.com](https://tailwindcss.com/docs)       |
| React Query   | Server state management         | [tanstack.com](https://tanstack.com/query/latest)     |
| Zod           | Schema validation               | [zod.dev](https://zod.dev)                            |
| Pino          | Structured server-side logging  | [getpino.io](https://getpino.io)                      |
| Framer Motion | Animations and transitions      | [framer.com](https://www.framer.com/motion/)          |
| dnd-kit       | Drag-and-drop interactions      | [dndkit.com](https://dndkit.com/)                     |
| Giphy SDK     | GIF search and selection        | [developers.giphy.com](https://developers.giphy.com/) |
| Resend        | Transactional email             | [resend.com](https://resend.com/docs)                 |
| Zustand       | Client-side state management    | [zustand](https://github.com/pmndrs/zustand)          |
| Jest          | Unit testing                    | [jestjs.io](https://jestjs.io/docs/getting-started)   |
| Playwright    | E2E smoke testing               | [playwright.dev](https://playwright.dev/docs/intro)   |

## Contributing

When adding new features, please update the relevant documentation files to keep them current.
