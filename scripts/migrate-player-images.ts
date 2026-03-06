import dotenv from "dotenv";
import mongoose, { Schema, type Document, type Model } from "mongoose";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;
const AWS_REGION = process.env.AWS_REGION!;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
const BUCKET_NAME = process.env.BUCKET_NAME!;
const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL!;

const REQUIRED_ENV = {
  MONGODB_URI,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  BUCKET_NAME,
  NEXT_PUBLIC_CLOUDFRONT_URL: CLOUDFRONT_URL,
};

for (const [key, value] of Object.entries(REQUIRED_ENV)) {
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// --- Player model (inline to avoid Next.js import chain) ---

interface PlayerDoc extends Document {
  firstName: string;
  lastName: string;
  imgUrl: string;
  value: number;
}

const PlayerSchema = new Schema<PlayerDoc>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    imgUrl: { type: String, required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: false },
);

const PlayerModel: Model<PlayerDoc> =
  (mongoose.models.Player as Model<PlayerDoc> | undefined) ??
  mongoose.model<PlayerDoc>("Player", PlayerSchema);

// --- S3 client ---

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// --- Helpers ---

const BATCH_SIZE = 5;
const FETCH_TIMEOUT_MS = 15_000;

function buildS3Key(player: PlayerDoc): string {
  const first = player.firstName.toLowerCase().replace(/\s+/g, "_");
  const last = player.lastName.toLowerCase().replace(/\s+/g, "_");
  const id = player._id.toHexString();
  return `players/${first}_${last}_${id}.png`;
}

function buildCdnUrl(key: string): string {
  return `${CLOUDFRONT_URL}/${key}`;
}

function isAlreadyMigrated(imgUrl: string): boolean {
  return imgUrl.startsWith(CLOUDFRONT_URL + "/players/");
}

async function s3ObjectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "LineupLegends-ImageMigration/1.0" },
      redirect: "follow",
    });

    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength === 0) return null;

    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function uploadToS3(file: Buffer, key: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: "image/png",
    }),
  );
}

async function processBatch(players: PlayerDoc[], stats: MigrationStats): Promise<void> {
  await Promise.all(players.map((player) => processPlayer(player, stats)));
}

async function processPlayer(player: PlayerDoc, stats: MigrationStats): Promise<void> {
  const name = `${player.firstName} ${player.lastName}`;
  const s3Key = buildS3Key(player);
  const cdnUrl = buildCdnUrl(s3Key);

  if (isAlreadyMigrated(player.imgUrl)) {
    stats.skipped++;
    return;
  }

  // Check if the image already exists in S3 (previous partial run)
  const alreadyInS3 = await s3ObjectExists(s3Key);

  if (!alreadyInS3) {
    const imageBuffer = await downloadImage(player.imgUrl);
    if (!imageBuffer) {
      console.log(`  FAILED  ${name} — could not download from ${player.imgUrl}`);
      stats.failed.push({ name, url: player.imgUrl });
      return;
    }

    await uploadToS3(imageBuffer, s3Key);
  }

  // Update the player's imgUrl in the database
  await PlayerModel.updateOne({ _id: player._id }, { $set: { imgUrl: cdnUrl } });
  console.log(`  OK      ${name}`);
  stats.migrated++;
}

// --- Main ---

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  failed: { name: string; url: string }[];
}

async function main() {
  console.log("=== Player Image Migration to S3 ===\n");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log("Connected.\n");

  const players = await PlayerModel.find().lean<PlayerDoc[]>();
  console.log(`Found ${players.length} players in database.\n`);

  const stats: MigrationStats = {
    total: players.length,
    migrated: 0,
    skipped: 0,
    failed: [],
  };

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(players.length / BATCH_SIZE);
    console.log(`Batch ${batchNum}/${totalBatches} (players ${i + 1}-${Math.min(i + BATCH_SIZE, players.length)})`);
    await processBatch(batch, stats);
  }

  console.log("\n=== Migration Summary ===");
  console.log(`  Total players:    ${stats.total}`);
  console.log(`  Migrated:         ${stats.migrated}`);
  console.log(`  Already on S3:    ${stats.skipped}`);
  console.log(`  Failed to fetch:  ${stats.failed.length}`);

  if (stats.failed.length > 0) {
    console.log("\nFailed players:");
    for (const f of stats.failed) {
      console.log(`  - ${f.name}: ${f.url}`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
