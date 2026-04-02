import { playerRouter } from "~/server/api/routers/player";
import { lineupRouter } from "~/server/api/routers/lineup";
import { commentRouter } from "~/server/api/routers/comment";
import { profileRouter } from "~/server/api/routers/profile";
import { followRouter } from "~/server/api/routers/follow";
import { requestedPlayerRouter } from "~/server/api/routers/requestedPlayer";
import { feedbackRouter } from "~/server/api/routers/feedback";
import { adminRouter } from "~/server/api/routers/admin";
import { videoRouter } from "~/server/api/routers/video";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  player: playerRouter,
  lineup: lineupRouter,
  comment: commentRouter,
  profile: profileRouter,
  follow: followRouter,
  requestedPlayer: requestedPlayerRouter,
  feedback: feedbackRouter,
  admin: adminRouter,
  video: videoRouter,
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
