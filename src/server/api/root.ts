import { playerRouter } from "~/server/api/routers/player";
import { lineupRouter } from "~/server/api/routers/lineup";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  player: playerRouter,
  lineup: lineupRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.player.getAll();
 *       ^? Player[]
 */
export const createCaller = createCallerFactory(appRouter);
