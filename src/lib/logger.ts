import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Centralized pino logger for server-side use.
 *
 * - In development: pretty-printed, colorized output at "debug" level
 * - In production: structured JSON output at "info" level
 *
 * Usage:
 *   import { logger } from "~/lib/logger";
 *   logger.info("server started");
 *   logger.error({ err }, "something went wrong");
 *
 * Create child loggers for specific modules:
 *   const log = logger.child({ module: "trpc" });
 */
export const logger = pino({
  level: isProduction ? "info" : "debug",
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),
});
