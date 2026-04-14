/**
 * Interactive script to repair player images that don't use the CloudFront URL.
 *
 * For each affected player:
 *   - Shows current name, value, and imgUrl
 *   - Generates the correct CloudFront URL from the player's name + _id
 *   - Updates imgUrl automatically
 *   - Prompts for a new value (1-5) or "n" to skip the value change
 *
 * Usage:  node scripts/repair-player-images.cjs
 *
 * Security (defense in depth — cloners still cannot write without your MONGODB_URI):
 * - Production credentials must never be committed; keep .env out of git.
 * - Remote/Atlas URIs are blocked unless REPAIR_PLAYER_IMAGES_ALLOW_REMOTE=1 is set.
 * - Prefer Atlas IP access list + least-privilege DB users for day-to-day work.
 */
const mongoose = require("mongoose");
const readline = require("readline");
require("dotenv").config();

function isRemoteUri(uri) {
  return /mongodb\+srv|\.mongodb\.net/i.test(uri);
}

function describeUriHost(uri) {
  const afterAt = uri.match(/@([^/?]+)/);
  if (afterAt) return afterAt[1].split(":")[0];
  try {
    const u = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "http://"));
    return u.hostname || "(unknown host)";
  } catch {
    return "(could not parse URI)";
  }
}

const CLOUDFRONT_BASE =
  "https://d2uth2nw0znbpc.cloudfront.net/lineup-legends/media/images/players";

const PlayerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  imgUrl: String,
  value: { type: Number, min: 1, max: 5 },
});

const Player =
  mongoose.models.Player ?? mongoose.model("Player", PlayerSchema);

function buildCloudFrontUrl(firstName, lastName, id) {
  const slug = `${firstName}_${lastName}_${id}`.toLowerCase();
  return `${CLOUDFRONT_BASE}/${slug}.png`;
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is required (e.g. in .env).");
    process.exit(1);
  }

  if (isRemoteUri(uri) && !process.env.REPAIR_PLAYER_IMAGES_ALLOW_REMOTE) {
    console.error(
      "\nRefusing to connect to a remote/Atlas cluster.\n" +
        "This script writes to the database. To run against production or a remote host, set:\n" +
        "  REPAIR_PLAYER_IMAGES_ALLOW_REMOTE=1\n\n" +
        "For local repair only, use something like:\n" +
        "  mongodb://127.0.0.1:27017/your-db-name\n",
    );
    process.exit(1);
  }

  console.log(`Connecting to: ${describeUriHost(uri)}\n`);
  await mongoose.connect(uri);
  console.log("Connected.\n");

  const affected = await Player.find({
    imgUrl: { $not: /d2uth2nw0znbpc\.cloudfront\.net/ },
  })
    .select("firstName lastName imgUrl value")
    .lean();

  if (affected.length === 0) {
    console.log("All player images already use CloudFront. Nothing to fix.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${affected.length} player(s) with non-CloudFront images:\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let updated = 0;
  let skippedValue = 0;

  for (let i = 0; i < affected.length; i++) {
    const p = affected[i];
    const correctUrl = buildCloudFrontUrl(
      p.firstName,
      p.lastName,
      String(p._id),
    );

    console.log("─".repeat(60));
    console.log(`[${i + 1}/${affected.length}]  ${p.firstName} ${p.lastName}`);
    console.log(`  Current value : $${p.value}`);
    console.log(`  Current imgUrl: ${p.imgUrl}`);
    console.log(`  Correct imgUrl: ${correctUrl}`);
    console.log();

    const answer = await ask(
      rl,
      "  Enter new value (1-5) or n to keep current value: ",
    );

    const trimmed = answer.trim().toLowerCase();
    const updateFields = { imgUrl: correctUrl };

    if (["1", "2", "3", "4", "5"].includes(trimmed)) {
      updateFields.value = Number(trimmed);
      console.log(
        `  ✓ Updating imgUrl + value → $${trimmed}\n`,
      );
    } else {
      skippedValue++;
      console.log(`  ✓ Updating imgUrl only (value stays $${p.value})\n`);
    }

    await Player.findByIdAndUpdate(p._id, { $set: updateFields });
    updated++;
  }

  rl.close();

  console.log("─".repeat(60));
  console.log(
    `\nDone. ${updated} image(s) fixed, ${updated - skippedValue} value(s) changed, ${skippedValue} value(s) kept.\n`,
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
