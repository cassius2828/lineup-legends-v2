/**
 * Migration: Rename descriptions.userId to descriptions.user
 *
 * The ValueDescriptionSchema defines the field as `user`, but the old
 * create mutation pushed `userId`. This renames the field in all existing
 * RequestedPlayer documents so the schema and data are aligned.
 *
 * Run with: npx tsx src/server/migrations/fix-description-user-field.ts
 */

import mongoose from "mongoose";
import { env } from "~/env";

async function migrateDescriptionUserField() {
  console.log("Starting descriptions.userId -> descriptions.user rename...\n");

  await mongoose.connect(env.DATABASE_URL);
  console.log("Connected to MongoDB\n");

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }

  const collection = db.collection("requestedplayers");

  const result = await collection.updateMany(
    { "descriptions.userId": { $exists: true } },
    { $rename: { "descriptions.$[].userId": "descriptions.$[].user" } },
  );

  console.log(`Documents matched: ${result.matchedCount}`);
  console.log(`Documents modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB");
}

migrateDescriptionUserField()
  .then(() => {
    console.log("\nMigration successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration failed:", error);
    process.exit(1);
  });
