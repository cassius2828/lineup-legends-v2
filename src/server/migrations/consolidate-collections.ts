/**
 * Migration: Consolidate duplicate collections (uppercase vs lowercase)
 *
 * MongoDB Best Practice:
 * - Collection names should be LOWERCASE
 * - Collection names should be PLURAL (e.g., users, lineups, comments)
 * - Mongoose does this by default when you call mongoose.model("User", schema)
 *   -> Creates collection "users" (lowercased and pluralized)
 *
 * This script:
 * 1. Lists all collections to identify duplicates
 * 2. Merges uppercase collections into lowercase ones
 * 3. Drops the empty uppercase collections
 *
 * Run with: npx tsx src/server/migrations/consolidate-collections.ts
 */

import mongoose from "mongoose";
import { env } from "~/env";

// Known collection pairs (Uppercase -> lowercase)
// Add any additional pairs you see in your database
const COLLECTION_PAIRS: Array<[string, string]> = [
  ["Account", "accounts"],
  ["Lineup", "lineups"],
  ["Player", "players"],
  ["Rating", "ratings"],
  ["Session", "sessions"],
  ["User", "users"],
  ["Vote", "votes"],
  ["VerificationToken", "verificationtokens"],
  ["Comment", "comments"],
  ["Friend", "friends"],
  ["RequestedPlayer", "requestedplayers"],
];

async function listCollections() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const collections = await db.listCollections().toArray();
  return collections.map((c) => c.name).sort();
}

async function consolidateCollections() {
  console.log("🚀 Starting collection consolidation...\n");

  // Connect to MongoDB
  await mongoose.connect(env.DATABASE_URL);
  console.log("✅ Connected to MongoDB\n");

  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection not established");

  // List all collections
  const existingCollections = await listCollections();
  console.log("📂 Existing collections:");
  existingCollections.forEach((name) => console.log(`   - ${name}`));
  console.log();

  // Find duplicates
  const duplicates: Array<{ uppercase: string; lowercase: string }> = [];

  for (const [uppercase, lowercase] of COLLECTION_PAIRS) {
    const hasUppercase = existingCollections.includes(uppercase);
    const hasLowercase = existingCollections.includes(lowercase);

    if (hasUppercase && hasLowercase) {
      duplicates.push({ uppercase, lowercase });
    } else if (hasUppercase && !hasLowercase) {
      // Only uppercase exists - rename it
      console.log(
        `⚠️  Only "${uppercase}" exists, should be renamed to "${lowercase}"`,
      );
    }
  }

  if (duplicates.length === 0) {
    console.log("✅ No duplicate collections found!\n");
    await mongoose.disconnect();
    return;
  }

  console.log(`\n⚠️  Found ${duplicates.length} duplicate collection pairs:\n`);
  for (const { uppercase, lowercase } of duplicates) {
    const uppercaseCount = await db.collection(uppercase).countDocuments();
    const lowercaseCount = await db.collection(lowercase).countDocuments();
    console.log(
      `   ${uppercase} (${uppercaseCount} docs) vs ${lowercase} (${lowercaseCount} docs)`,
    );
  }

  console.log("\n🔄 Merging collections...\n");

  for (const { uppercase, lowercase } of duplicates) {
    const uppercaseCollection = db.collection(uppercase);
    const lowercaseCollection = db.collection(lowercase);

    const uppercaseDocs = await uppercaseCollection.find({}).toArray();
    const uppercaseCount = uppercaseDocs.length;

    if (uppercaseCount > 0) {
      // Get existing IDs in lowercase collection to avoid duplicates
      const existingIds = new Set(
        (
          await lowercaseCollection
            .find({}, { projection: { _id: 1 } })
            .toArray()
        ).map((doc) => doc._id.toString()),
      );

      // Filter out documents that already exist in lowercase collection
      const newDocs = uppercaseDocs.filter(
        (doc) => !existingIds.has(doc._id.toString()),
      );

      if (newDocs.length > 0) {
        await lowercaseCollection.insertMany(newDocs);
        console.log(
          `   ✅ Moved ${newDocs.length} documents from "${uppercase}" to "${lowercase}"`,
        );
      } else {
        console.log(
          `   ℹ️  All documents in "${uppercase}" already exist in "${lowercase}"`,
        );
      }

      if (newDocs.length < uppercaseCount) {
        console.log(
          `   ⚠️  Skipped ${uppercaseCount - newDocs.length} duplicate documents`,
        );
      }
    } else {
      console.log(`   ℹ️  "${uppercase}" is empty`);
    }

    // Drop the uppercase collection
    await uppercaseCollection.drop();
    console.log(`   🗑️  Dropped empty collection "${uppercase}"\n`);
  }

  // Verify final state
  const finalCollections = await listCollections();
  console.log("📂 Final collections:");
  finalCollections.forEach((name) => console.log(`   - ${name}`));

  await mongoose.disconnect();
  console.log("\n🔌 Disconnected from MongoDB");
}

// Run with --dry-run to just list duplicates without making changes
const isDryRun = process.argv.includes("--dry-run");

if (isDryRun) {
  console.log("🔍 DRY RUN MODE - No changes will be made\n");

  mongoose
    .connect(env.DATABASE_URL)
    .then(async () => {
      const collections = await listCollections();
      console.log("📂 Current collections:");
      collections.forEach((name) => console.log(`   - ${name}`));

      console.log("\n📋 Expected collection pairs:");
      for (const [uppercase, lowercase] of COLLECTION_PAIRS) {
        const hasUpper = collections.includes(uppercase);
        const hasLower = collections.includes(lowercase);
        const status =
          hasUpper && hasLower
            ? "⚠️  DUPLICATE"
            : hasUpper
              ? "⚠️  NEEDS RENAME"
              : hasLower
                ? "✅ OK"
                : "❌ MISSING";
        console.log(`   ${status}: ${uppercase} -> ${lowercase}`);
      }

      await mongoose.disconnect();
    })
    .catch(console.error);
} else {
  consolidateCollections()
    .then(() => {
      console.log("\n✨ Consolidation complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Consolidation failed:", error);
      process.exit(1);
    });
}
