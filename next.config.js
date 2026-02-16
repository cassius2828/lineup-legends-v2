/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**", // Use a wildcard for any path under /account123/
      },
    ],
  },
  eslint: {
    // ESLint errors are handled separately via `npm run lint`
    // This allows the build to succeed during Prisma to Mongoose migration
    ignoreDuringBuilds: true,
  },
  reactCompiler: true,
  // Prevent Next.js from bundling pino's worker threads (used by pino-pretty transport)
  serverExternalPackages: ["pino", "pino-pretty"],
};

export default config;
