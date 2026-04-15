/**
 * One-off: mirror a player's external imgUrl to S3 + CloudFront (same as admin create/update).
 *
 * Usage:  npx tsx scripts/sync-one-player-cdn.ts <playerObjectId>
 *
 * Example (Kevin Porter):
 *   npx tsx scripts/sync-one-player-cdn.ts 69ceee7b6b93cb2b27610717
 */
import "dotenv/config";
import mongoose from "mongoose";
import { PlayerModel } from "../src/server/models/index.js";
import { syncPlayerImageToCdn } from "../src/server/services/player-image-cdn.js";
import { invalidatePlayersCache } from "../src/server/services/player-cache.js";

const id = process.argv[2];
if (!id) {
  console.error(
    "Usage: npx tsx scripts/sync-one-player-cdn.ts <playerObjectId>",
  );
  process.exit(1);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const p = await PlayerModel.findById(id);
  if (!p) {
    console.error("Player not found:", id);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`${p.firstName} ${p.lastName}`);
  console.log("Current imgUrl:", p.imgUrl);

  const { imgUrl, migrated } = await syncPlayerImageToCdn({
    firstName: p.firstName,
    lastName: p.lastName,
    idHex: p._id.toHexString(),
    imgUrl: p.imgUrl,
  });

  if (!migrated) {
    console.log("Already on our CDN — no change.");
    await mongoose.disconnect();
    return;
  }

  await PlayerModel.findByIdAndUpdate(id, { $set: { imgUrl } });
  await invalidatePlayersCache();
  console.log("Updated imgUrl:", imgUrl);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
