# Database

Lineup Legends v2 uses **Prisma ORM** with **MongoDB** as the database. This document covers the schema design, database operations, and management.

## Overview

The database stores:

- **Players**: Basketball players with value tiers
- **Lineups**: User-created fantasy lineups
- **Users**: Authenticated user accounts
- **Auth data**: Sessions, accounts, verification tokens (managed by NextAuth)

## Environment Variables

```env
# MongoDB connection string
DATABASE_URL="mongodb://localhost:27017/lineup-legends"

# For MongoDB Atlas (cloud)
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/lineup-legends?retryWrites=true&w=majority"
```

## Schema Location

The Prisma schema is located at `prisma/schema.prisma`.

## Generator Configuration

```prisma
generator client {
    provider = "prisma-client-js"
    output   = "../generated/prisma"
}

datasource db {
    provider = "mongodb"
    url      = env("DATABASE_URL")
}
```

The Prisma client is output to `generated/prisma/` for explicit imports.

## Models

### Player

Basketball players with value tiers:

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

**Notes:**

- `@map("_id")` uses MongoDB's default ID field name
- `@db.ObjectId` specifies MongoDB ObjectId type
- Multiple relations for each basketball position

### Lineup

Fantasy lineups with 5 players:

```prisma
model Lineup {
    id        String   @id @default(auto()) @map("_id") @db.ObjectId
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    featured  Boolean  @default(false)

    // Position references
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

**Notes:**

- Each position has its own relation for type safety
- `onDelete: Cascade` removes lineups when user is deleted
- `@updatedAt` automatically tracks modification time

### User

User accounts (managed by NextAuth):

```prisma
model User {
    id            String    @id @default(auto()) @map("_id") @db.ObjectId
    name          String?
    username      String?
    email         String?   @unique
    emailVerified DateTime?
    image         String?
    accounts      Account[]
    sessions      Session[]
    lineups       Lineup[]
}
```

### Account

OAuth provider connections (managed by NextAuth):

```prisma
model Account {
    id                       String  @id @default(auto()) @map("_id") @db.ObjectId
    userId                   String  @db.ObjectId
    type                     String
    provider                 String
    providerAccountId        String
    refresh_token            String?
    access_token             String?
    expires_at               Int?
    token_type               String?
    scope                    String?
    id_token                 String?
    session_state            String?
    user                     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
    refresh_token_expires_in Int?

    @@unique([provider, providerAccountId])
}
```

### Session

Active user sessions (managed by NextAuth):

```prisma
model Session {
    id           String   @id @default(auto()) @map("_id") @db.ObjectId
    sessionToken String   @unique
    userId       String   @db.ObjectId
    expires      DateTime
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### VerificationToken

Email verification tokens (managed by NextAuth):

```prisma
model VerificationToken {
    id         String   @id @default(auto()) @map("_id") @db.ObjectId
    identifier String
    token      String   @unique
    expires    DateTime

    @@unique([identifier, token])
}
```

## Database Client

The Prisma client is instantiated in `src/server/db.ts`:

```typescript
import { PrismaClient } from "~/generated/prisma";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Notes:**

- Singleton pattern prevents multiple clients in development
- Query logging enabled in development mode

## Common Operations

### Querying with Relations

```typescript
// Get lineup with all players and owner
const lineup = await db.lineup.findUnique({
  where: { id },
  include: {
    pg: true,
    sg: true,
    sf: true,
    pf: true,
    c: true,
    owner: true,
  },
});
```

### Filtering and Sorting

```typescript
// Get user's lineups, sorted by creation date
const lineups = await db.lineup.findMany({
  where: { ownerId: userId },
  orderBy: { createdAt: "desc" },
  include: { pg: true, sg: true, sf: true, pf: true, c: true },
});
```

### Creating Records

```typescript
const lineup = await db.lineup.create({
  data: {
    pgId,
    sgId,
    sfId,
    pfId,
    cId,
    ownerId: session.user.id,
    featured: false,
  },
});
```

### Updating Records

```typescript
const lineup = await db.lineup.update({
  where: { id },
  data: { featured: true },
});
```

### Deleting Records

```typescript
await db.lineup.delete({
  where: { id },
});
```

### Counting Records

```typescript
const featuredCount = await db.lineup.count({
  where: { ownerId: userId, featured: true },
});
```

### Bulk Operations

```typescript
// Seed players
const result = await db.player.createMany({
  data: playersData,
});

// Clear all players
await db.player.deleteMany();
```

## Database Commands

### Push Schema

Push schema changes to database without migrations:

```bash
npm run db:push
```

### Generate Client

Regenerate the Prisma client after schema changes:

```bash
npx prisma generate
```

### Create Migration

Create a new migration (for production deployments):

```bash
npm run db:generate
```

### Deploy Migrations

Apply pending migrations:

```bash
npm run db:migrate
```

### Prisma Studio

Open the visual database browser:

```bash
npm run db:studio
```

### Seed Database

Populate the database with initial data:

```bash
npm run db:seed
```

## Seeding

### Seed Script Location

`prisma/seed.ts`

### Running Seeds

```bash
npm run db:seed
```

### Seed Configuration

In `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Writing Seeds

```typescript
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.player.deleteMany();

  // Insert new data
  await prisma.player.createMany({
    data: [
      { firstName: "LeBron", lastName: "James", value: 5, imgUrl: "..." },
      // ...
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

## MongoDB-Specific Considerations

### ObjectId Type

MongoDB uses ObjectId for primary keys:

```prisma
id String @id @default(auto()) @map("_id") @db.ObjectId
```

### Relations

Foreign keys in MongoDB require `@db.ObjectId`:

```prisma
ownerId String @db.ObjectId
owner   User   @relation(fields: [ownerId], references: [id])
```

### Unique Constraints

Compound unique indexes:

```prisma
@@unique([provider, providerAccountId])
@@unique([identifier, token])
```

### Case-Insensitive Search

Use `mode: "insensitive"` for case-insensitive queries:

```typescript
const players = await db.player.findMany({
  where: {
    OR: [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
    ],
  },
});
```

## Local Development

### Starting MongoDB

Use the provided script to start a local MongoDB container:

```bash
./start-database.sh
```

Or use Docker directly:

```bash
docker run -d --name mongodb -p 27017:27017 mongo:7
```

### Connection String

For local development:

```env
DATABASE_URL="mongodb://localhost:27017/lineup-legends"
```

## Production Considerations

1. **Use MongoDB Atlas**: Managed MongoDB service with backups
2. **Enable authentication**: Never expose MongoDB without auth in production
3. **Use connection pooling**: Prisma handles this automatically
4. **Index frequently queried fields**: Add `@index` or `@@index` as needed
5. **Monitor query performance**: Use Prisma's logging in development


