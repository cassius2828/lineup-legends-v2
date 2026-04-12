/**
 * Fallback: extract NBA career averages and season bests from Wikipedia HTML
 * via OpenAI when cheerio-based table parsing fails (e.g. unusual table markup).
 */

import OpenAI from "openai";
import type { WikiCareerStats } from "./wikipedia-sections";
import type {
  WikiCareerSeasonBests,
  WikiCareerSeasonBestEntry,
} from "./wikipedia-sections";

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

function truncateHtml(html: string): string {
  const MAX = 80_000;
  if (html.length <= MAX) return html;
  return html.slice(0, MAX) + "\n<!-- truncated -->";
}

const CAREER_STATS_SYSTEM_PROMPT = `You are a concise NBA data extractor.
You will receive the HTML of a basketball player's Wikipedia page (or just the career statistics section).
Extract the player's NBA REGULAR SEASON career averages from the stats table.
Return ONLY valid JSON matching this exact schema — no markdown fences, no commentary:

{
  "careerRegularSeason": {
    "points": "<PPG value or null>",
    "assists": "<APG value or null>",
    "rebounds": "<RPG value or null>",
    "threePointPct": "<3P% value or null>",
    "fieldGoalPct": "<FG% value or null>",
    "freeThrowPct": "<FT% value or null>",
    "steals": "<SPG value or null>",
    "blocks": "<BPG value or null>"
  },
  "careerSeasonBests": {
    "points": { "value": "<best PPG>", "season": "<season label, e.g. 2013–14 · LAC - 82 GP>" },
    "assists": { "value": "<best APG>", "season": "<season>" },
    "rebounds": { "value": "<best RPG>", "season": "<season>" },
    "threePointPct": { "value": "<best 3P%>", "season": "<season>" },
    "fieldGoalPct": { "value": "<best FG%>", "season": "<season>" },
    "freeThrowPct": { "value": "<best FT%>", "season": "<season>" },
    "steals": { "value": "<best SPG>", "season": "<season>" },
    "blocks": { "value": "<best BPG>", "season": "<season>" }
  }
}

Rules:
- Use the "Career" totals/averages row for careerRegularSeason (NOT playoff stats).
- For careerSeasonBests, find the single best (highest) value for each stat across all REGULAR SEASON rows (exclude Career/All-Star/Playoff rows).
- Format season labels as "YYYY–YY · TEAM - GP GP" (e.g. "2018–19 · Detroit - 75 GP").
- Omit any stat key whose value you cannot determine (do NOT include null values).
- If you cannot find career stats at all, return: {"careerRegularSeason": null, "careerSeasonBests": null}`;

interface AiCareerStatsResult {
  careerRegularSeason: WikiCareerStats | null;
  careerSeasonBests: WikiCareerSeasonBests | null;
}

const VALID_STAT_KEYS = new Set([
  "points",
  "assists",
  "rebounds",
  "threePointPct",
  "fieldGoalPct",
  "freeThrowPct",
  "steals",
  "blocks",
]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function sanitizeCareerStats(raw: unknown): WikiCareerStats | null {
  if (!raw || typeof raw !== "object") return null;
  const out: WikiCareerStats = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!VALID_STAT_KEYS.has(k)) continue;
    if (!isNonEmptyString(v)) continue;
    (out as Record<string, string>)[k] = v.trim();
  }
  return Object.keys(out).length > 0 ? out : null;
}

function sanitizeSeasonBests(raw: unknown): WikiCareerSeasonBests | null {
  if (!raw || typeof raw !== "object") return null;
  const out: WikiCareerSeasonBests = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!VALID_STAT_KEYS.has(k)) continue;
    if (!v || typeof v !== "object") continue;
    const entry = v as Record<string, unknown>;
    if (!isNonEmptyString(entry.value)) continue;
    const best: WikiCareerSeasonBestEntry = {
      value: (entry.value as string).trim(),
      season: isNonEmptyString(entry.season)
        ? (entry.season as string).trim()
        : "\u2014",
    };
    out[k as keyof WikiCareerStats] = best;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Sends Wikipedia page HTML to GPT-4o-mini to extract career averages + season bests.
 * Only called when cheerio-based parsing returns null for either field.
 */
export async function extractCareerStatsFromHtml(
  html: string,
  playerFullName: string,
): Promise<AiCareerStatsResult | null> {
  const client = getClient();
  if (!client) {
    console.warn(
      "[ai-career-stats] OPENAI_API_KEY not set — skipping AI career stats fallback",
    );
    return null;
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      instructions: CAREER_STATS_SYSTEM_PROMPT,
      input: `Extract NBA regular season career averages and season bests for ${playerFullName} from this Wikipedia HTML:\n\n${truncateHtml(html)}`,
    });

    const text = response.output_text?.trim();
    if (!text) return null;

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      console.warn("[ai-career-stats] failed to parse JSON from AI response");
      return null;
    }

    const careerRegularSeason = sanitizeCareerStats(parsed.careerRegularSeason);
    const careerSeasonBests = sanitizeSeasonBests(parsed.careerSeasonBests);

    if (!careerRegularSeason && !careerSeasonBests) return null;

    return { careerRegularSeason, careerSeasonBests };
  } catch (err) {
    console.error("[ai-career-stats] OpenAI extraction failed:", err);
    return null;
  }
}
