/**
 * MediaWiki parse API: pull "Awards and honors" and NBA "Regular season" career row
 * from the resolved article title (same official API family as wikipedia.ts; HTML parsed with cheerio).
 */

import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { wikiFetch, wikiJsonHeaders } from "~/server/lib/wikipedia";

const WIKI_API = "https://en.wikipedia.org/w/api.php";

function wikiDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.WIKIPEDIA_DEBUG === "1"
  );
}

function wikiLog(...args: unknown[]): void {
  if (wikiDebugEnabled()) console.log("[wikipedia-sections]", ...args);
}

export interface WikiCareerStats {
  points?: string;
  assists?: string;
  rebounds?: string;
  threePointPct?: string;
  fieldGoalPct?: string;
  freeThrowPct?: string;
  steals?: string;
  blocks?: string;
}

interface WikiSectionRow {
  line: string;
  index: string;
  toclevel: number;
}

interface ParseSectionsJson {
  parse?: {
    sections?: WikiSectionRow[];
  };
}

interface ParseTextJson {
  parse?: {
    text?: { "*": string };
  };
}

async function mediaWikiParse(
  params: Record<string, string>,
): Promise<unknown> {
  const search = new URLSearchParams({ format: "json", ...params });
  const url = `${WIKI_API}?${search.toString()}`;
  const res = await wikiFetch(url, { headers: wikiJsonHeaders });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchSectionIndices(
  pageTitle: string,
): Promise<WikiSectionRow[] | null> {
  const data = (await mediaWikiParse({
    action: "parse",
    page: pageTitle,
    prop: "sections",
  })) as ParseSectionsJson | null;
  return data?.parse?.sections ?? null;
}

async function fetchSectionHtml(
  pageTitle: string,
  sectionIndex: string,
): Promise<string | null> {
  const data = (await mediaWikiParse({
    action: "parse",
    page: pageTitle,
    section: sectionIndex,
    prop: "text",
  })) as ParseTextJson | null;
  const html = data?.parse?.text?.["*"];
  return html ?? null;
}

/** Full article HTML (used for infobox: listed height / weight). */
export async function fetchFullPageHtml(
  pageTitle: string,
): Promise<string | null> {
  const data = (await mediaWikiParse({
    action: "parse",
    page: pageTitle,
    prop: "text",
  })) as ParseTextJson | null;
  return data?.parse?.text?.["*"] ?? null;
}

function cleanInfoboxCell(s: string): string {
  return s
    .replace(/\[\d+\]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isHeightLabel(label: string): boolean {
  const l = label.toLowerCase();
  if (/wingspan|reach|standing reach/i.test(l)) return false;
  if (/\bweight\b/i.test(l) && !/\bheight\b/i.test(l)) return false;
  if (/^(listed )?height\b/i.test(l)) return true;
  if (l === "height") return true;
  return false;
}

function isWeightLabel(label: string): boolean {
  const l = label.toLowerCase();
  if (/^(listed )?weight\b/i.test(l)) return true;
  if (l === "weight") return true;
  return false;
}

/**
 * NBA / basketball bios: infobox "Listed height" / "Listed weight" (personal information).
 */
export function extractListedHeightWeightFromInfoboxHtml(html: string): {
  listedHeight: string | null;
  listedWeight: string | null;
} {
  const $ = cheerio.load(html);
  let listedHeight: string | null = null;
  let listedWeight: string | null = null;

  $("table.infobox, table[class*='infobox']").each((_, table) => {
    if (listedHeight && listedWeight) return false;

    $(table)
      .find("tr")
      .each((_, tr) => {
        if (listedHeight && listedWeight) return false;
        const $tr = $(tr);
        const $th = $tr.find("th").first();
        const $td = $tr.find("td").first();
        if (!$th.length || !$td.length) return;

        const label = cleanInfoboxCell($th.text());
        const value = cleanInfoboxCell($td.text());
        if (!label || !value) return;

        if (!listedHeight && isHeightLabel(label)) listedHeight = value;
        if (!listedWeight && isWeightLabel(label)) listedWeight = value;
      });
  });

  return { listedHeight, listedWeight };
}

/**
 * Infobox listed height/weight only (one parse call). Used when full wiki fetch is skipped
 * but measurements are still missing in Mongo.
 */
export async function fetchListedHeightWeightForPageTitle(
  pageTitle: string,
): Promise<{ listedHeight: string | null; listedWeight: string | null }> {
  const html = await fetchFullPageHtml(pageTitle);
  if (!html) return { listedHeight: null, listedWeight: null };
  return extractListedHeightWeightFromInfoboxHtml(html);
}

/** Parent TOC line must match one of these (first wins), then we take the next "Regular season" subsection. */
const CAREER_STATS_PARENT_MATCHERS: ReadonlyArray<{
  name: string;
  test: (line: string) => boolean;
}> = [
  {
    name: "NBA career statistics",
    test: (line) => /^nba career statistics$/i.test(line.trim()),
  },
  {
    name: "Career statistics",
    test: (line) => /^career statistics$/i.test(line.trim()),
  },
  { name: "Career stats", test: (line) => /^career stats$/i.test(line.trim()) },
];

/**
 * First "Regular season" subsection after a career-stats parent heading
 * (NBA career statistics | Career statistics | Career stats).
 */
export function findNbaRegularSeasonSectionIndex(sections: WikiSectionRow[]): {
  index: string | null;
  matchedParent: string | null;
} {
  let nbaIdx = -1;
  let matchedParent: string | null = null;
  for (const { name, test } of CAREER_STATS_PARENT_MATCHERS) {
    const idx = sections.findIndex((s) => test(s.line));
    if (idx >= 0) {
      nbaIdx = idx;
      matchedParent = name;
      break;
    }
  }
  if (nbaIdx < 0) return { index: null, matchedParent: null };
  const after = sections.slice(nbaIdx + 1);
  const reg = after.find((s) => /^regular season$/i.test(s.line.trim()));
  return { index: reg?.index ?? null, matchedParent };
}

/** Match order: prefer standard NBA bio headings; many articles use "Awards and achievements". */
const AWARDS_SECTION_LINE_TESTS: ReadonlyArray<(line: string) => boolean> = [
  (line) => /^awards and honors$/i.test(line),
  (line) => /^awards and achievements$/i.test(line),
  (line) => /^achievements and awards$/i.test(line),
  (line) => /^career achievements$/i.test(line),
  (line) => /^list of .+ achievements$/i.test(line),
];

export function findAwardsSectionIndex(
  sections: WikiSectionRow[],
): string | null {
  for (const test of AWARDS_SECTION_LINE_TESTS) {
    const hit = sections.find((s) => test(s.line.trim()));
    if (hit) return hit.index;
  }
  return null;
}

/**
 * Awards / honors: list items as plain lines (strip tables/navboxes noise).
 */
export function awardsSectionHtmlToPlainText(html: string): string | null {
  const $ = cheerio.load(html);
  $(".navbox, .mbox-small, .metadata").remove();
  const lines: string[] = [];
  $("ul > li, ol > li").each((_, el) => {
    const t = $(el)
      .text()
      .replace(/\[\d+\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (t.length < 3) return;
    if (/^cite error/i.test(t)) return;
    if (/^\^ [a-z]/i.test(t)) return;
    if (/mw-parser-output|wayback machine|archive\.org/i.test(t)) return;
    if (/^\s*\^/.test(t)) return;
    lines.push(t);
  });
  $("dl dt").each((_, dt) => {
    const title = $(dt)
      .text()
      .replace(/\[\d+\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const $dd = $(dt).next("dd");
    const body = $dd.length
      ? $dd
          .text()
          .replace(/\[\d+\]/g, "")
          .replace(/\s+/g, " ")
          .trim()
      : "";
    const combined = body ? `${title}: ${body}` : title;
    if (combined.length >= 3 && !/^cite error/i.test(combined))
      lines.push(combined);
  });
  if (lines.length === 0) {
    const fallback = $(".mw-parser-output")
      .clone()
      .find("table, .navbox, sup")
      .remove()
      .end()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    if (fallback.length > 40) return fallback.slice(0, 12000);
    return null;
  }
  return lines.join("\n").slice(0, 12000);
}

/** Strip ref markers like [1] so "Career[1]" matches career totals row. */
function normalizeRowLabelText(s: string): string {
  return s
    .replace(/\[\d+\]/g, "")
    .replace(/[\u2020\u2021\u2605*\u2606]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapHeaderToCareerKey(
  headerText: string,
): keyof WikiCareerStats | null {
  const h = headerText.replace(/\s+/g, " ").trim();
  if (/\bPPG\b|POINTS PER GAME/i.test(h)) return "points";
  if (/\bAPG\b|ASSISTS PER GAME/i.test(h)) return "assists";
  if (/\bRPG\b|REBOUNDS PER GAME/i.test(h)) return "rebounds";
  if (/\b3P%|3-POINT|THREE-POINT/i.test(h)) return "threePointPct";
  if (/\bFG%|FIELD GOAL/i.test(h)) return "fieldGoalPct";
  if (/\bFT%|FREE THROW/i.test(h)) return "freeThrowPct";
  if (/\bSPG\b|STEALS PER GAME/i.test(h)) return "steals";
  if (/\bBPG\b|BLOCKS PER GAME/i.test(h)) return "blocks";
  return null;
}

function findGpHeaderIndex(headers: string[]): number {
  return headers.findIndex((h) => /^\s*GP\s*$/i.test(h));
}

/**
 * How many leading header positions are covered by <th> elements in a data row,
 * or inferred as missing (mid-season trade rows that omit the Year cell entirely).
 *
 * Wikipedia tables use several patterns:
 *  - `<th scope="row">2020–21</th><td>Team</td>…`  → offset = 1
 *  - `<th colspan="2">Career</th><td>GP</td>…`     → offset = 2
 *  - `<td>Team</td><td>GP</td>…` (trade row, Year omitted) → offset = 1 (inferred)
 *  - `<td>Year</td><td>Team</td><td>GP</td>…`      → offset = 0
 */
function leadingHeaderOffset(
  $: cheerio.CheerioAPI,
  tr: AnyNode,
  headerCount: number,
): number {
  const ths = $(tr).children("th").toArray();
  if (ths.length > 0) {
    let sum = 0;
    for (const el of ths) {
      sum += parseInt($(el).attr("colspan") ?? "1", 10);
    }
    return sum;
  }

  const tds = $(tr).children("td").toArray();
  if (tds.length > 0 && tds.length === headerCount - 1) {
    return 1;
  }

  return 0;
}

/**
 * Normalised text of the first <th> or <td> in a row (document order),
 * whichever comes first. Handles tables where Year / Career is a <th>.
 */
function firstCellLabel($: cheerio.CheerioAPI, tr: AnyNode): string {
  const first = $(tr).children("th, td").first();
  return first.length ? normalizeRowLabelText(first.text()) : "";
}

/**
 * Build a season label from the row's leading cells.
 * Handles both `<th>Year</th><td>Team</td>` and `<td>Year</td><td>Team</td>`.
 */
function seasonLabelFromRow($: cheerio.CheerioAPI, tr: AnyNode): string {
  const cells = $(tr).children("th, td").toArray();
  if (cells.length === 0) return "";
  const c0 = normalizeRowLabelText($(cells[0]).text());
  const c1 = cells.length > 1 ? normalizeRowLabelText($(cells[1]).text()) : "";
  if (
    /^\d{4}[\u2013-]\d{2,4}$/.test(c0) ||
    /^\d{4}$/.test(c0) ||
    /^\d{4}[\u2013-]\d{4}$/.test(c0)
  ) {
    if (c1 && c1.length <= 28 && !/^\d{4}/.test(c1) && !/^career$/i.test(c1))
      return `${c0} \u00B7 ${c1}`.trim();
  }
  return c0.slice(0, 80);
}

function shouldSkipSeasonStatsRow(firstCellNorm: string): boolean {
  if (!firstCellNorm) return true;
  if (/^career$/i.test(firstCellNorm)) return true;
  if (/^total$/i.test(firstCellNorm)) return true;
  if (/^season$/i.test(firstCellNorm)) return true;
  if (/^year$/i.test(firstCellNorm)) return true;
  if (/all-?star/i.test(firstCellNorm)) return true;
  return false;
}

function parseStatCellToNumber(raw: string): number | null {
  const s = raw
    .replace(/[\u2020\u2021\u2605\u2606*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s || s === "\u2014" || s === "-" || s === "\u2013") return null;
  const m = s.match(/-?\d*\.?\d+/);
  if (!m?.[0]) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

function formatStatCellDisplay(raw: string): string {
  return raw
    .replace(/[\u2020\u2021\u2605\u2606*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * First wikitable in the Regular season section; row whose first cell(s) are "Career".
 * Handles tables where Year/Career are <th scope="row"> instead of <td>.
 */
export function extractCareerStatsFromRegularSeasonHtml(
  html: string,
): WikiCareerStats | null {
  const $ = cheerio.load(html);
  const table = $("table.wikitable").first();
  if (!table.length) return null;

  const headerRow = table
    .find("tr")
    .filter((_, tr) => {
      return $(tr).find("th").length >= 4;
    })
    .first();
  if (!headerRow.length) return null;

  const headers = headerRow
    .find("th")
    .map((_, el) => $(el).text())
    .get() as string[];

  const careerTr = table
    .find("tr")
    .filter((_, tr) => {
      return /^career$/i.test(firstCellLabel($, tr));
    })
    .first();

  if (!careerTr.length) return null;

  const tds = careerTr.find("td").toArray();
  if (tds.length < 3) return null;

  const tdOffset = leadingHeaderOffset($, careerTr.get(0)!, headers.length);

  const out: WikiCareerStats = {};
  for (let hi = tdOffset; hi < headers.length; hi++) {
    const key = mapHeaderToCareerKey(headers[hi] ?? "");
    if (!key) continue;
    const di = hi - tdOffset;
    if (di >= tds.length) break;
    const cell = tds[di];
    if (!cell) break;
    let val = $(cell).text().trim();
    val = val.replace(/[\u2020\u2021\u2605\u2606*]/g, "").trim();
    if (val) out[key] = val;
  }

  return Object.keys(out).length > 0 ? out : null;
}

/** Single-stat high from scanning per-season rows (not the career average row). */
export type WikiCareerSeasonBestEntry = {
  value: string;
  /** Season / team label from the table row (e.g. 2015\u201316 \u00B7 GSW). */
  season: string;
};

export type WikiCareerSeasonBests = Partial<
  Record<keyof WikiCareerStats, WikiCareerSeasonBestEntry>
>;

/**
 * Same Regular season wikitable as {@link extractCareerStatsFromRegularSeasonHtml}: for each
 * mapped stat column, take the **maximum** numeric value across **season** rows (excludes Career).
 * Handles tables where Year is a <th scope="row"> instead of <td>.
 */
export function extractCareerSeasonBestsFromRegularSeasonHtml(
  html: string,
): WikiCareerSeasonBests | null {
  const $ = cheerio.load(html);
  const table = $("table.wikitable").first();
  if (!table.length) return null;

  const headerRow = table
    .find("tr")
    .filter((_, tr) => {
      return $(tr).find("th").length >= 4;
    })
    .first();
  if (!headerRow.length) return null;

  const headers = headerRow
    .find("th")
    .map((_, el) => $(el).text())
    .get() as string[];

  const gpHi = findGpHeaderIndex(headers);

  type Best = { n: number; value: string; season: string };
  const bestByKey = new Map<string, Best>();

  table.find("tr").each((_, tr) => {
    const $tr = $(tr);
    const tds = $tr.find("td").toArray();
    if (tds.length < 3) return;

    const label = firstCellLabel($, tr);
    if (shouldSkipSeasonStatsRow(label)) return;

    const tdOffset = leadingHeaderOffset($, tr, headers.length);
    let season = seasonLabelFromRow($, tr);

    if (gpHi >= tdOffset) {
      const gpDi = gpHi - tdOffset;
      if (gpDi >= 0 && gpDi < tds.length) {
        const gpRaw = formatStatCellDisplay($(tds[gpDi]).text());
        if (gpRaw) season = season ? `${season} - ${gpRaw} GP` : `${gpRaw} GP`;
      }
    }

    for (let hi = tdOffset; hi < headers.length; hi++) {
      const key = mapHeaderToCareerKey(headers[hi] ?? "");
      if (!key) continue;
      const di = hi - tdOffset;
      if (di < 0 || di >= tds.length) continue;
      const cell = tds[di];
      if (!cell) continue;
      const raw = $(cell).text();
      const n = parseStatCellToNumber(raw);
      if (n === null) continue;
      const value = formatStatCellDisplay(raw);
      if (!value) continue;

      const prev = bestByKey.get(key);
      if (!prev || n > prev.n) {
        bestByKey.set(key, { n, value, season: season || "\u2014" });
      }
    }
  });

  if (bestByKey.size === 0) return null;

  const out: WikiCareerSeasonBests = {};
  for (const [k, v] of bestByKey) {
    out[k as keyof WikiCareerStats] = {
      value: v.value,
      season: v.season,
    };
  }
  return Object.keys(out).length > 0 ? out : null;
}

export interface WikiExtendedSections {
  awardsPlainText: string | null;
  careerRegularSeason: WikiCareerStats | null;
  /** Highest per-game (or rate) value per stat across season rows in the regular-season table. */
  careerSeasonBests: WikiCareerSeasonBests | null;
  /** From infobox listed height / weight (personal information). */
  listedHeight: string | null;
  listedWeight: string | null;
}

export async function fetchWikiExtendedSections(
  canonicalPageTitle: string,
  options?: { fullPageHtml?: string | null },
): Promise<WikiExtendedSections> {
  const [sections, fullPageHtml] = await Promise.all([
    fetchSectionIndices(canonicalPageTitle),
    fetchFullPageHtml(canonicalPageTitle),
  ]);

  const { listedHeight, listedWeight } = fullPageHtml
    ? extractListedHeightWeightFromInfoboxHtml(fullPageHtml)
    : { listedHeight: null, listedWeight: null };
  wikiLog("listedHeight", listedHeight, "listedWeight", listedWeight);

  if (!sections?.length) {
    wikiLog(`no sections for page=${JSON.stringify(canonicalPageTitle)}`);
    return {
      awardsPlainText: null,
      careerRegularSeason: null,
      careerSeasonBests: null,
      listedHeight,
      listedWeight,
    };
  }

  wikiLog(
    `page=${JSON.stringify(canonicalPageTitle)} tocCount=${sections.length}`,
    "tocSample",
    sections.slice(0, 25).map((s) => ({ line: s.line, index: s.index })),
  );

  let awardsPlainText: string | null = null;
  const awardsIdx = findAwardsSectionIndex(sections);
  wikiLog("awardsSectionIndex", awardsIdx ?? "(none)");
  if (awardsIdx) {
    const html = await fetchSectionHtml(canonicalPageTitle, awardsIdx);
    wikiLog("awardsHtmlLength", html?.length ?? 0);
    if (html) awardsPlainText = awardsSectionHtmlToPlainText(html);
    wikiLog(
      "awardsPlainText",
      awardsPlainText
        ? {
            length: awardsPlainText.length,
            preview: awardsPlainText.slice(0, 280),
          }
        : null,
    );
  }

  let careerRegularSeason: WikiCareerStats | null = null;
  let careerSeasonBests: WikiCareerSeasonBests | null = null;
  const { index: regIdx, matchedParent } =
    findNbaRegularSeasonSectionIndex(sections);
  wikiLog(
    "careerStatsParent",
    matchedParent ?? "(no match)",
    "regularSeasonIndex",
    regIdx ?? "(none)",
  );
  if (regIdx) {
    const html = await fetchSectionHtml(canonicalPageTitle, regIdx);
    wikiLog("regularSeasonHtmlLength", html?.length ?? 0);
    if (html) {
      careerRegularSeason = extractCareerStatsFromRegularSeasonHtml(html);
      if (!careerRegularSeason) {
        wikiLog(
          "careerRowParseMiss: first wikitable present but no Career row / mappable headers",
        );
      }
      careerSeasonBests = extractCareerSeasonBestsFromRegularSeasonHtml(html);
      wikiLog("careerSeasonBests", careerSeasonBests);
    }
    wikiLog("careerRegularSeason", careerRegularSeason);
  }

  return {
    awardsPlainText,
    careerRegularSeason,
    careerSeasonBests,
    listedHeight,
    listedWeight,
  };
}
