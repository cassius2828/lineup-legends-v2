import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { PlayerModel } from "~/server/models";
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
  fetchListedHeightWeightForPageTitle,
  fetchWikiExtendedSections,
} from "~/server/lib/wikipedia-sections";

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
  ensureWikiSummary: publicProcedure
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

      if (
        process.env.NODE_ENV === "development" ||
        process.env.WIKIPEDIA_DEBUG === "1"
      ) {
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

  getRandomByValue: publicProcedure
    .output(playersByValueOutput)
    .query(async () => {
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
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

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
    .mutation(async ({ input }) => {
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();

      const existingPlayer = await PlayerModel.findOne({
        firstName: { $regex: new RegExp(`^${firstName}$`, "i") },
        lastName: { $regex: new RegExp(`^${lastName}$`, "i") },
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

      await invalidatePlayersCache();
      return populated(newPlayer.toObject());
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input }) => {
      await PlayerModel.findByIdAndDelete(input.id);
      await invalidatePlayersCache();
      return { success: true };
    }),
});
