/**
 * Migration: Convert comment votes from boolean fields to type field
 *
 * OLD FORMAT:
 * { userId, upvote: true, downvote: false }
 * { userId, upvote: false, downvote: true }
 *
 * NEW FORMAT:
 * { userId, type: "upvote" }
 * { userId, type: "downvote" }
 *
 * Run with: npx tsx src/server/migrations/migrate-comment-votes.ts
 */

import mongoose from "mongoose";
import { env } from "~/env";

interface OldCommentVote {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  upvote?: boolean;
  downvote?: boolean;
  type?: "upvote" | "downvote"; // New field (may already exist)
}

interface CommentDoc {
  _id: mongoose.Types.ObjectId;
  votes: OldCommentVote[];
  thread: Array<{
    _id: mongoose.Types.ObjectId;
    votes: OldCommentVote[];
  }>;
}

async function migrateCommentVotes() {
  console.log("🚀 Starting comment vote migration...\n");

  // Connect to MongoDB
  await mongoose.connect(env.DATABASE_URL);
  console.log("✅ Connected to MongoDB\n");

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }

  // Use the correct collection name (lowercase, plural)
  const commentsCollection = db.collection<CommentDoc>("comments");

  // Find all comments with votes that have the old format
  const comments = await commentsCollection
    .find({
      $or: [
        { "votes.upvote": { $exists: true } },
        { "votes.downvote": { $exists: true } },
        { "thread.votes.upvote": { $exists: true } },
        { "thread.votes.downvote": { $exists: true } },
      ],
    })
    .toArray();

  console.log(`📊 Found ${comments.length} comments with old vote format\n`);

  let migratedComments = 0;
  let migratedVotes = 0;
  let migratedThreadVotes = 0;

  for (const comment of comments) {
    let commentModified = false;

    // Migrate comment votes
    for (const vote of comment.votes) {
      if (vote.upvote !== undefined || vote.downvote !== undefined) {
        // Convert boolean fields to type field
        if (vote.upvote) {
          vote.type = "upvote";
        } else if (vote.downvote) {
          vote.type = "downvote";
        }
        // Remove old fields
        delete vote.upvote;
        delete vote.downvote;
        migratedVotes++;
        commentModified = true;
      }
    }

    // Migrate thread votes
    for (const thread of comment.thread) {
      for (const vote of thread.votes) {
        if (vote.upvote !== undefined || vote.downvote !== undefined) {
          if (vote.upvote) {
            vote.type = "upvote";
          } else if (vote.downvote) {
            vote.type = "downvote";
          }
          delete vote.upvote;
          delete vote.downvote;
          migratedThreadVotes++;
          commentModified = true;
        }
      }
    }

    // Update the document
    if (commentModified) {
      await commentsCollection.updateOne(
        { _id: comment._id },
        {
          $set: {
            votes: comment.votes,
            thread: comment.thread,
          },
        },
      );
      migratedComments++;
    }
  }

  console.log("✅ Migration complete!\n");
  console.log(`   📝 Comments updated: ${migratedComments}`);
  console.log(`   🗳️  Comment votes migrated: ${migratedVotes}`);
  console.log(`   💬 Thread votes migrated: ${migratedThreadVotes}`);

  await mongoose.disconnect();
  console.log("\n🔌 Disconnected from MongoDB");
}

// Run the migration
migrateCommentVotes()
  .then(() => {
    console.log("\n✨ Migration successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });
