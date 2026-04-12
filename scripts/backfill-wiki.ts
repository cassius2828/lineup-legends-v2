/**
 * One-off script: fetch Wikipedia data for every player in the database.
 * Run with: npx tsx scripts/backfill-wiki.ts
 * Delete this file after use.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { PlayerModel } from "../src/server/models/player";
import { fetchBasketballPlayerWikiSummary } from "../src/server/lib/wikipedia";
import { fetchWikiExtendedSections } from "../src/server/lib/wikipedia-sections";
import { extractAwardsFromHtml } from "../src/server/lib/ai-awards";
import { extractCareerStatsFromHtml } from "../src/server/lib/ai-career-stats";
import { fetchFullPageHtml } from "../src/server/lib/wikipedia-sections";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

const DELAY_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log("Connected to MongoDB\n");

  const players = await PlayerModel.find().sort({ value: -1 }).lean();
  console.log(`Found ${players.length} players\n`);

  let fetched = 0;
  let skipped = 0;
  let failed = 0;
  let aiFallbacks = 0;

  for (let i = 0; i < players.length; i++) {
    const p = players[i]!;
    const name = `${p.firstName} ${p.lastName}`;
    const tag = `[${i + 1}/${players.length}]`;

    const hasWiki =
      !!p.wikiSummaryExtract?.trim() &&
      p.wikiAwardsHonorsText !== undefined &&
      p.wikiCareerRegularSeason !== undefined &&
      p.wikiCareerSeasonBests !== undefined &&
      p.wikiListedHeight !== undefined &&
      p.wikiListedWeight !== undefined;

    if (hasWiki) {
      console.log(`${tag} SKIP  ${name} (already has wiki data)`);
      skipped++;
      continue;
    }

    try {
      console.log(`${tag} FETCH ${name}...`);

      const summary = await fetchBasketballPlayerWikiSummary(
        p.firstName,
        p.lastName,
        { preferredPageTitle: p.wikiPageTitle ?? undefined },
      );

      if (!summary) {
        console.log(`${tag}   ⚠ No Wikipedia page found for ${name}`);
        failed++;
        await sleep(DELAY_MS);
        continue;
      }

      const extended = await fetchWikiExtendedSections(summary.title);

      let awardsText = extended.awardsPlainText ?? "";
      let { careerRegularSeason, careerSeasonBests } = extended;

      const needsAiFallback =
        (!awardsText || !careerRegularSeason || !careerSeasonBests) &&
        process.env.OPENAI_API_KEY;

      if (needsAiFallback) {
        const html = await fetchFullPageHtml(summary.title);
        if (html) {
          if (!awardsText) {
            const aiAwards = await extractAwardsFromHtml(html, name);
            if (aiAwards) {
              awardsText = aiAwards;
              aiFallbacks++;
              console.log(`${tag}   ✦ Awards extracted via AI for ${name}`);
            }
          }

          if (!careerRegularSeason || !careerSeasonBests) {
            const aiStats = await extractCareerStatsFromHtml(html, name);
            if (aiStats) {
              if (!careerRegularSeason && aiStats.careerRegularSeason) {
                careerRegularSeason = aiStats.careerRegularSeason;
                aiFallbacks++;
                console.log(
                  `${tag}   ✦ Career averages extracted via AI for ${name}`,
                );
              }
              if (!careerSeasonBests && aiStats.careerSeasonBests) {
                careerSeasonBests = aiStats.careerSeasonBests;
                aiFallbacks++;
                console.log(
                  `${tag}   ✦ Season bests extracted via AI for ${name}`,
                );
              }
            }
          }
        }
      }

      await PlayerModel.findByIdAndUpdate(p._id, {
        wikiPageTitle: summary.title,
        wikiSummaryExtract: summary.extract,
        wikiThumbnailUrl: summary.thumbnailUrl,
        wikiSummaryFetchedAt: new Date(),
        wikiAwardsHonorsText: awardsText,
        wikiCareerRegularSeason: careerRegularSeason ?? null,
        wikiCareerSeasonBests: careerSeasonBests ?? null,
        wikiListedHeight: extended.listedHeight ?? null,
        wikiListedWeight: extended.listedWeight ?? null,
      });

      fetched++;
      console.log(
        `${tag}   ✓ ${name} — bio:${summary.extract.length}ch, awards:${awardsText.length}ch, stats:${
          careerRegularSeason
            ? Object.keys(careerRegularSeason).length + " keys"
            : "none"
        }`,
      );

      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`${tag}   ✗ FAILED ${name}:`, err);
      failed++;
      await sleep(DELAY_MS);
    }
  }

  console.log("\n--- Done ---");
  console.log(`Fetched: ${fetched}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed:  ${failed}`);
  console.log(`AI fallbacks: ${aiFallbacks}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
