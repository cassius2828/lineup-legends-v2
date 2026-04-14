import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  rateLimitMiddleware,
} from "~/server/api/trpc";
import { PlayerModel, PlayerAuditLogModel, UserModel } from "~/server/models";
import type { PlayerSnapshot } from "~/server/models";
import { escapeRegex } from "~/server/lib/escape-regex";
import {
  getPlayersFromCacheOrDb,
  invalidatePlayersCache,
} from "~/server/services/player-cache";
import {
  playerOutput,
  playersByValueOutput,
  populated,
} from "~/server/api/schemas/output";
import { getId } from "~/lib/types";
import { fetchBasketballPlayerWikiSummary } from "~/server/lib/wikipedia";
import {
  fetchFullPageHtml,
  fetchListedHeightWeightForPageTitle,
  fetchWikiExtendedSections,
  wikiDebugEnabled,
} from "~/server/lib/wikipedia-sections";
import { extractAwardsFromHtml } from "~/server/lib/ai-awards";

const REFRESH_TIMEZONE = "America/New_York";

/**
 * Returns midnight today in ET as a UTC Date.
 * Works by reading the current hour/min/sec in ET via Intl and subtracting
 * the elapsed time from `now` — no locale-string-to-Date parsing involved.
 */
function getStartOfDayET(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REFRESH_TIMEZONE,
    hourCycle: "h23",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(now);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)!.value);

  const elapsedMs =
    (get("hour") * 3600 + get("minute") * 60 + get("second")) * 1000 +
    now.getMilliseconds();

  return new Date(now.getTime() - elapsedMs);
}

async function samplePlayerPool() {
  const results = await PlayerModel.aggregate([
    {
      $facet: {
        value1Players: [{ $match: { value: 1 } }, { $sample: { size: 5 } }],
        value2Players: [{ $match: { value: 2 } }, { $sample: { size: 5 } }],
        value3Players: [{ $match: { value: 3 } }, { $sample: { size: 5 } }],
        value4Players: [{ $match: { value: 4 } }, { $sample: { size: 5 } }],
        value5Players: [{ $match: { value: 5 } }, { $sample: { size: 5 } }],
      },
    },
  ]);
  return populated(results[0]);
}

async function getRefreshEligibility(userId: string) {
  const user = await UserModel.findById(userId)
    .select("lastPlayerPoolRefreshAt")
    .lean();

  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }

  const todayStart = getStartOfDayET();
  const usedToday = !!(
    user.lastPlayerPoolRefreshAt && user.lastPlayerPoolRefreshAt >= todayStart
  );

  return { usedToday, todayStart };
}

function toSnapshot(doc: {
  firstName: string;
  lastName: string;
  value: number;
  imgUrl: string;
}): PlayerSnapshot {
  return {
    firstName: doc.firstName,
    lastName: doc.lastName,
    value: doc.value,
    imgUrl: doc.imgUrl,
  };
}

export const playerRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ value: z.number().min(1).max(5).optional() }).optional())
    .output(z.array(playerOutput))
    .query(async () => {
      return populated(await getPlayersFromCacheOrDb());
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(playerOutput.optional())
    .query(async ({ input }) => {
      // Always read one document from Mongo — do not use the Redis "all players" blob here.
      // JSON round-trips for cached lists can change _id shape; a list scan is also stale vs wiki writes.
      const found = await PlayerModel.findById(input.id).lean();
      if (!found) return undefined;
      return playerOutput.parse({
        ...found,
        id: getId(found),
      });
    }),

  /** Fetches Wikipedia lead summary (basketball-biased), persists on player, invalidates cache. */
  ensureWikiSummary: protectedProcedure
    .use(rateLimitMiddleware(5, 60))
    .input(
      z.object({
        id: z.string(),
        force: z.boolean().optional(),
      }),
    )
    .output(playerOutput)
    .mutation(async ({ input }) => {
      const raw = await PlayerModel.findById(input.id).lean();
      if (!raw) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      const STALE_MS = 7 * 24 * 60 * 60 * 1000;
      const fetchedAt = raw.wikiSummaryFetchedAt
        ? new Date(raw.wikiSummaryFetchedAt).getTime()
        : 0;
      const hasExtract = !!raw.wikiSummaryExtract?.trim();
      /** Awards + career keys must exist (even null) so we do not skip after summary-only rows. */
      const hasWikiExtendedStored =
        Object.prototype.hasOwnProperty.call(raw, "wikiAwardsHonorsText") &&
        Object.prototype.hasOwnProperty.call(raw, "wikiCareerRegularSeason") &&
        Object.prototype.hasOwnProperty.call(raw, "wikiCareerSeasonBests");
      const physicalEmpty =
        !String(raw.wikiListedHeight ?? "").trim() &&
        !String(raw.wikiListedWeight ?? "").trim();

      if (
        !input.force &&
        hasExtract &&
        hasWikiExtendedStored &&
        fetchedAt > 0 &&
        Date.now() - fetchedAt < STALE_MS
      ) {
        /** Stale hit: measurements are often null on older rows; patch from infobox without full wiki pull. */
        if (physicalEmpty && raw.wikiPageTitle?.trim()) {
          const hw = await fetchListedHeightWeightForPageTitle(
            raw.wikiPageTitle.trim(),
          );
          const got = !!hw.listedHeight?.trim() || !!hw.listedWeight?.trim();
          if (got) {
            await PlayerModel.findByIdAndUpdate(input.id, {
              wikiListedHeight: hw.listedHeight ?? null,
              wikiListedWeight: hw.listedWeight ?? null,
            });
            await invalidatePlayersCache();
            const patched = await PlayerModel.findById(input.id).lean();
            if (patched) {
              return playerOutput.parse({
                ...patched,
                id: getId(patched),
              });
            }
          }
        }

        return playerOutput.parse({
          ...raw,
          id: getId(raw),
        });
      }

      const summary = await fetchBasketballPlayerWikiSummary(
        raw.firstName,
        raw.lastName,
        { preferredPageTitle: raw.wikiPageTitle },
      );

      if (!summary) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "No Wikipedia biography found for this player. Try again later or contact an admin.",
        });
      }

      const extended = await fetchWikiExtendedSections(summary.title);

      if (wikiDebugEnabled()) {
        console.log("[player.ensureWikiSummary] wiki pull result", {
          playerId: input.id,
          resolvedTitle: summary.title,
          extractLength: summary.extract.length,
          awardsLength: extended.awardsPlainText?.length ?? 0,
          careerKeys: extended.careerRegularSeason
            ? Object.keys(extended.careerRegularSeason)
            : [],
        });
      }

      await PlayerModel.findByIdAndUpdate(input.id, {
        wikiPageTitle: summary.title,
        wikiSummaryExtract: summary.extract,
        wikiThumbnailUrl: summary.thumbnailUrl,
        wikiSummaryFetchedAt: new Date(),
        wikiAwardsHonorsText: extended.awardsPlainText ?? "",
        wikiCareerRegularSeason: extended.careerRegularSeason ?? null,
        wikiCareerSeasonBests: extended.careerSeasonBests ?? null,
        wikiListedHeight: extended.listedHeight ?? null,
        wikiListedWeight: extended.listedWeight ?? null,
      });
      await invalidatePlayersCache();

      const updated = await PlayerModel.findById(input.id).lean();
      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      return playerOutput.parse({
        ...updated,
        id: getId(updated),
      });
    }),

  /**
   * AI-powered fallback: extracts awards from the Wikipedia page HTML via LLM
   * when our regex-based parser missed the section. Runs independently so it
   * never blocks ensureWikiSummary.
   */
  ensureAwardsAI: protectedProcedure
    .use(rateLimitMiddleware(5, 60))
    .input(z.object({ id: z.string() }))
    .output(playerOutput)
    .mutation(async ({ input }) => {
      const raw = await PlayerModel.findById(input.id).lean();
      if (!raw) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      if (raw.wikiAwardsHonorsText?.trim()) {
        return playerOutput.parse({ ...raw, id: getId(raw) });
      }

      const pageTitle = raw.wikiPageTitle?.trim();
      if (!pageTitle) {
        return playerOutput.parse({ ...raw, id: getId(raw) });
      }

      const html = await fetchFullPageHtml(pageTitle);
      if (!html) {
        return playerOutput.parse({ ...raw, id: getId(raw) });
      }

      const aiAwards = await extractAwardsFromHtml(
        html,
        `${raw.firstName} ${raw.lastName}`,
      );

      if (!aiAwards) {
        return playerOutput.parse({ ...raw, id: getId(raw) });
      }

      if (wikiDebugEnabled()) {
        console.log("[player.ensureAwardsAI] AI extracted awards from HTML", {
          playerId: input.id,
          length: aiAwards.length,
          preview: aiAwards.slice(0, 200),
        });
      }

      await PlayerModel.findByIdAndUpdate(input.id, {
        wikiAwardsHonorsText: aiAwards,
      });
      await invalidatePlayersCache();

      const updated = await PlayerModel.findById(input.id).lean();
      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }
      return playerOutput.parse({ ...updated, id: getId(updated) });
    }),

  getRandomByValue: publicProcedure
    .output(playersByValueOutput)
    .query(() => samplePlayerPool()),

  refreshRandomByValue: protectedProcedure
    .output(playersByValueOutput)
    .mutation(async ({ ctx }) => {
      const { usedToday } = await getRefreshEligibility(ctx.session.user.id);
      if (usedToday) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "You've already used your daily refresh. Resets at midnight ET.",
        });
      }

      await UserModel.findByIdAndUpdate(ctx.session.user.id, {
        lastPlayerPoolRefreshAt: new Date(),
      });

      return samplePlayerPool();
    }),

  canRefreshPool: protectedProcedure
    .output(
      z.object({
        canRefresh: z.boolean(),
        nextRefreshAt: z.string().nullable(),
      }),
    )
    .query(async ({ ctx }) => {
      const { usedToday, todayStart } = await getRefreshEligibility(
        ctx.session.user.id,
      );
      if (usedToday) {
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { canRefresh: false, nextRefreshAt: tomorrow.toISOString() };
      }
      return { canRefresh: true, nextRefreshAt: null };
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().max(100) }))
    .output(z.array(playerOutput))
    .query(async ({ input }) => {
      if (!input.query.trim()) {
        return populated(
          await PlayerModel.find().limit(10).sort({ value: -1 }).lean(),
        );
      }

      const searchRegex = new RegExp(escapeRegex(input.query), "i");
      const players = await PlayerModel.find({
        $or: [
          { firstName: { $regex: searchRegex } },
          { lastName: { $regex: searchRegex } },
        ],
      }).sort({ value: -1 });

      return populated(players.map((p) => p.toObject()));
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        value: z.number().min(1).max(5),
        imgUrl: z.string().url(),
      }),
    )
    .output(playerOutput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await PlayerModel.findById(id).lean();
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      const beforeSnap = toSnapshot(existing);

      const updatedPlayer = await PlayerModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true },
      );

      if (!updatedPlayer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      await PlayerAuditLogModel.create({
        playerId: existing._id,
        action: "update",
        performedBy: ctx.session.user.id,
        performedByEmail: ctx.session.user.email ?? "unknown",
        before: beforeSnap,
        after: toSnapshot(updatedPlayer),
      });

      await invalidatePlayersCache();
      return populated(updatedPlayer.toObject());
    }),

  create: adminProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        value: z.number().min(1).max(5),
        imgUrl: z.string().url(),
      }),
    )
    .output(playerOutput)
    .mutation(async ({ ctx, input }) => {
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();

      const existingPlayer = await PlayerModel.findOne({
        firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, "i") },
        lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, "i") },
      });

      if (existingPlayer) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Player "${firstName} ${lastName}" already exists in the database.`,
        });
      }

      const newPlayer = await PlayerModel.create({
        firstName,
        lastName,
        value: input.value,
        imgUrl: input.imgUrl,
      });

      await PlayerAuditLogModel.create({
        playerId: newPlayer._id,
        action: "create",
        performedBy: ctx.session.user.id,
        performedByEmail: ctx.session.user.email ?? "unknown",
        before: null,
        after: toSnapshot(newPlayer),
      });

      await invalidatePlayersCache();
      return populated(newPlayer.toObject());
    }),

  auditLog: adminProcedure
    .input(
      z.object({
        playerId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const limit = input.limit;
      const filter: Record<string, unknown> = {};
      if (input.playerId) {
        filter.playerId = input.playerId;
      }
      if (input.cursor) {
        filter._id = { $lt: input.cursor };
      }

      const entries = await PlayerAuditLogModel.find(filter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .lean();

      const hasMore = entries.length > limit;
      const items = hasMore ? entries.slice(0, limit) : entries;

      return {
        items: items.map((e) => ({
          id: String(e._id),
          playerId: String(e.playerId),
          action: e.action,
          performedByEmail: e.performedByEmail,
          before: e.before,
          after: e.after,
          timestamp: e.timestamp.toISOString(),
        })),
        cursor: hasMore ? String(items[items.length - 1]!._id) : null,
      };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await PlayerModel.findById(input.id).lean();
      if (existing) {
        await PlayerAuditLogModel.create({
          playerId: existing._id,
          action: "delete",
          performedBy: ctx.session.user.id,
          performedByEmail: ctx.session.user.email ?? "unknown",
          before: toSnapshot(existing),
          after: null,
        });
      }
      await PlayerModel.findByIdAndDelete(input.id);
      await invalidatePlayersCache();
      return { success: true };
    }),
});
