import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema.
   * These are NEVER exposed to the client bundle.
   */
  server: {
    // Authentication (sensitive)
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    AUTH_GOOGLE_CLIENT_ID: z.string(),
    AUTH_GOOGLE_CLIENT_SECRET: z.string(),

    // Database (sensitive)
    MONGODB_URI: z.string().url(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // AWS S3 Configuration (sensitive - keep server-side only)
    AWS_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    BUCKET_NAME: z.string(),

    // Resend (email service)
    RESEND_API_KEY: z.string(),
    REDIS_URL: z.string().url(),

    YOUTUBE_API_KEY: z.string(),
  },

  /**
   * Client-side environment variables schema.
   * Only variables prefixed with `NEXT_PUBLIC_` can be exposed here.
   * These will be inlined into the client bundle - only include non-sensitive values.
   */
  client: {
    // CloudFront URL is safe to expose - it's a public CDN endpoint
    NEXT_PUBLIC_CLOUDFRONT_URL: z.string().url(),
  },

  /**
   * Runtime environment variable mappings.
   * All variables from server and client schemas must be mapped here.
   */
  runtimeEnv: {
    // Auth (server-only)
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_CLIENT_ID: process.env.AUTH_GOOGLE_CLIENT_ID,
    AUTH_GOOGLE_CLIENT_SECRET: process.env.AUTH_GOOGLE_CLIENT_SECRET,

    // Database (server-only)
    MONGODB_URI: process.env.MONGODB_URI,
    NODE_ENV: process.env.NODE_ENV,

    // AWS S3 (server-only - credentials never exposed to client)
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    BUCKET_NAME: process.env.BUCKET_NAME,

    // Resend (server-only)
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    REDIS_URL: process.env.REDIS_URL,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    // Public (safe for client exposure)
    NEXT_PUBLIC_CLOUDFRONT_URL: process.env.NEXT_PUBLIC_CLOUDFRONT_URL,
  },

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * Useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
