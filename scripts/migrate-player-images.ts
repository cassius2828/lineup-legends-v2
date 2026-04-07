import dotenv from "dotenv";
import mongoose, { Schema, type Document, type Model } from "mongoose";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

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

// --- Constants ---

const BATCH_SIZE = 5;
const FETCH_TIMEOUT_MS = 15_000;

const S3_PREFIX = "lineup-legends/media/images/players";
const OLD_S3_PREFIX = "players";

// --- Helpers ---

function buildFileName(player: PlayerDoc): string {
  const first = player.firstName.toLowerCase().replace(/\s+/g, "_");
  const last = player.lastName.toLowerCase().replace(/\s+/g, "_");
  const id = player._id.toHexString();
  return `${first}_${last}_${id}.png`;
}

function buildS3Key(player: PlayerDoc): string {
  return `${S3_PREFIX}/${buildFileName(player)}`;
}

function buildOldS3Key(player: PlayerDoc): string {
  return `${OLD_S3_PREFIX}/${buildFileName(player)}`;
}

function buildCdnUrl(key: string): string {
  return `${CLOUDFRONT_URL}/media/images/players/${key.split("/").pop()}`;
}

function isAlreadyMigrated(imgUrl: string): boolean {
  return imgUrl.startsWith(CLOUDFRONT_URL + "/media/images/players/");
}

function isAtOldLocation(imgUrl: string): boolean {
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

async function copyS3Object(sourceKey: string, destKey: string): Promise<void> {
  const encodedSource = `${BUCKET_NAME}/${sourceKey.split("/").map(encodeURIComponent).join("/")}`;
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      CopySource: encodedSource,
      Key: destKey,
      ContentType: "image/png",
      MetadataDirective: "REPLACE",
    }),
  );
}

async function deleteS3Object(key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  } catch {
    // non-critical, ignore
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
  const newKey = buildS3Key(player);
  const oldKey = buildOldS3Key(player);
  const cdnUrl = buildCdnUrl(newKey);

  if (isAlreadyMigrated(player.imgUrl)) {
    stats.skipped++;
    return;
  }

  const alreadyAtNewLocation = await s3ObjectExists(newKey);

  if (!alreadyAtNewLocation) {
    // Check if the image exists at the old (wrong) S3 location from the previous run
    if (isAtOldLocation(player.imgUrl) || await s3ObjectExists(oldKey)) {
      await copyS3Object(oldKey, newKey);
      await deleteS3Object(oldKey);
      console.log(`  MOVED   ${name}`);
    } else {
      // Fresh download from external URL
      const imageBuffer = await downloadImage(player.imgUrl);
      if (!imageBuffer) {
        console.log(`  FAILED  ${name} — could not download from ${player.imgUrl}`);
        stats.failed.push({ name, url: player.imgUrl });
        return;
      }
      await uploadToS3(imageBuffer, newKey);
      console.log(`  UPLOAD  ${name}`);
    }
  } else {
    // Already at new location, just need DB update
    // Clean up old key if it exists
    if (await s3ObjectExists(oldKey)) {
      await deleteS3Object(oldKey);
    }
    console.log(`  OK      ${name} (already in correct S3 location)`);
  }

  await PlayerModel.updateOne({ _id: player._id }, { $set: { imgUrl: cdnUrl } });
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
  console.log("=== Player Image Migration to S3 ===");
  console.log(`  Bucket:    ${BUCKET_NAME}`);
  console.log(`  S3 path:   ${S3_PREFIX}/`);
  console.log(`  CDN base:  ${CLOUDFRONT_URL}/media/images/players/\n`);

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
  console.log(`  Already correct:  ${stats.skipped}`);
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
