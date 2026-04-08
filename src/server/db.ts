import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { env } from "~/env";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "db" });

/**
 * Lazily resolved so importing this module during `next build`
 * (with SKIP_ENV_VALIDATION=1) doesn't throw at the top level.
 */
function getMongoUri(): string {
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  return uri;
}

// Type declaration for global mongoose cache
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare global for caching
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
  // eslint-disable-next-line no-var
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

// Initialize cache
global.mongooseCache ??= {
  conn: null,
  promise: null,
};
const cached: MongooseCache = global.mongooseCache;

/**
 * Connect to MongoDB using Mongoose
 * Uses a cached connection for efficiency in development
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      family: 4,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(getMongoUri(), opts).then((mongoose) => {
      log.info("Connected to MongoDB via Mongoose");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Get a MongoDB client for use with NextAuth MongoDB adapter.
 * The MongoDB adapter requires a MongoClient, not Mongoose.
 * Connection is deferred so importing this module during `next build` is safe.
 */
export function getMongoClient(): Promise<MongoClient> {
  if (!global.mongoClientPromise) {
    global.mongoClientPromise = Promise.resolve().then(() => {
      const client = new MongoClient(getMongoUri());
      return client.connect();
    });
  }
  return global.mongoClientPromise;
}

// Export mongoose for direct usage if needed
export { mongoose };
