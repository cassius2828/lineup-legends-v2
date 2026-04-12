/**
 * English Wikipedia: resolve NBA/basketball biographies via official APIs only.
 * 1) Optional stored title (admin / refresh).
 * 2) REST summary for "First Last (basketball)" (redirects to main bio for many stars).
 * 3) REST summary for plain "First Last" (canonical article is often this, not …(basketball)).
 * 4) MediaWiki search with basketball-biased queries; rank hits (prefer person titles, penalize
 *    team seasons / year-range pages), then try summaries for top hits until one works.
 */

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const WIKI_REST = "https://en.wikipedia.org/api/rest_v1/page/summary";

/** Required by Wikimedia; override via WIKIPEDIA_USER_AGENT in production. */
const USER_AGENT =
  process.env.WIKIPEDIA_USER_AGENT ??
  "LineupLegends/1.0 (https://github.com/cassius2828/lineup-legends-v2; wiki integration)";

/** Exported for MediaWiki parse API calls in wikipedia-sections.ts */
export const wikiJsonHeaders = {
  Accept: "application/json",
  "User-Agent": USER_AGENT,
} as const;

const FETCH_RETRIES = 3;
const FETCH_RETRY_BASE_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Transient TLS/TCP issues (e.g. ECONNRESET) are common to long-lived dev servers hitting Wikipedia. */
function isRetryableFetchError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.message === "fetch failed") return true;
  const cause = err.cause;
  if (cause instanceof Error && "code" in cause) {
    const code = (cause as NodeJS.ErrnoException).code;
    if (
      code === "ECONNRESET" ||
      code === "ETIMEDOUT" ||
      code === "ECONNREFUSED" ||
      code === "EPIPE" ||
      code === "UND_ERR_SOCKET"
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Wikipedia-bound fetch with retries. Survives occasional ECONNRESET / aborted reads.
 */
export async function wikiFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < FETCH_RETRIES; attempt++) {
    try {
      return await fetch(url, {
        ...init,
        headers: init?.headers ?? wikiJsonHeaders,
        next: { revalidate: 0 },
      });
    } catch (e) {
      lastError = e;
      const canRetry = isRetryableFetchError(e) && attempt < FETCH_RETRIES - 1;
      if (canRetry) {
        console.warn(
          `[wikipedia] fetch attempt ${attempt + 1}/${FETCH_RETRIES} failed, retrying:`,
          e instanceof Error ? e.message : e,
        );
        await sleep(FETCH_RETRY_BASE_MS * 2 ** attempt);
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

export interface WikiPageSummary {
  title: string;
  extract: string;
  thumbnailUrl: string | null;
}

interface RestSummaryJson {
  type?: string;
  title?: string;
  extract?: string;
  thumbnail?: { source?: string };
}

interface SearchHit {
  title: string;
  snippet?: string;
}

interface SearchResponse {
  query?: {
    search?: SearchHit[];
  };
}

function titleToPathSegment(title: string): string {
  return encodeURIComponent(title.replace(/ /g, "_"));
}

/**
 * Fetch lead summary for a canonical page title. Returns null if not found or unusable.
 */
export async function getPageSummary(
  pageTitle: string,
): Promise<WikiPageSummary | null> {
  const url = `${WIKI_REST}/${titleToPathSegment(pageTitle)}`;
  let res: Response;
  try {
    res = await wikiFetch(url, { headers: wikiJsonHeaders });
  } catch (e) {
    console.warn(
      `[wikipedia] summary fetch failed for ${JSON.stringify(pageTitle)}:`,
      e instanceof Error ? e.message : e,
    );
    return null;
  }
  if (res.status === 404) return null;
  if (!res.ok) {
    console.warn(
      `[wikipedia] summary HTTP ${res.status} for title=${JSON.stringify(pageTitle)}`,
    );
    return null;
  }

  let data: RestSummaryJson;
  try {
    data = (await res.json()) as RestSummaryJson;
  } catch (e) {
    console.warn(
      `[wikipedia] summary JSON parse failed for ${JSON.stringify(pageTitle)}:`,
      e instanceof Error ? e.message : e,
    );
    return null;
  }
  if (data.type === "disambiguation") return null;
  if (!data.title) return null;

  const extract = (data.extract ?? "").trim();
  if (!extract) return null;

  return {
    title: data.title,
    extract,
    thumbnailUrl: data.thumbnail?.source ?? null,
  };
}

/** Last token(s) before Jr/Sr/II/III so "Jaren Jackson Jr." still matches "Jackson". */
function primaryFamilyToken(fullLowerParts: string[]): string {
  let i = fullLowerParts.length - 1;
  while (
    i > 0 &&
    /^(jr\.?|sr\.?|ii|iii|iv|v)$/i.test(fullLowerParts[i] ?? "")
  ) {
    i -= 1;
  }
  return fullLowerParts[i] ?? "";
}

function scoreSearchHit(hit: SearchHit, full: string): number {
  let score = 0;
  const t = hit.title;
  const tNorm = t.replace(/_/g, " ").toLowerCase();
  const fullLower = full.trim().toLowerCase();
  const parts = fullLower.split(/\s+/).filter((p) => p.length > 0);
  const firstName = parts[0] ?? "";
  const family = primaryFamilyToken(parts);
  const s = (hit.snippet ?? "").toLowerCase();

  if (tNorm === fullLower) score += 500;
  if (tNorm === `${fullLower} (basketball)`) score += 480;

  if (family.length >= 2 && !tNorm.includes(family)) score -= 450;
  if (
    parts.length >= 2 &&
    firstName.length >= 2 &&
    !tNorm.includes(firstName)
  ) {
    score -= 220;
  }

  if (t.endsWith(" (basketball)")) score += 100;
  if (/\(disambiguation\)/i.test(t)) score -= 80;

  if (/\bseason\b/i.test(t)) score -= 320;
  if (/\b\d{4}[–-]\d{2}/.test(t)) score -= 260;

  if (/\bbasketball\b/i.test(t) || s.includes("basketball")) score += 40;
  if (/\bnba\b/i.test(s)) score += 25;
  if (/national basketball association/i.test(s)) score += 15;
  return score;
}

function pickRankedSearchHits(hits: SearchHit[], full: string): SearchHit[] {
  return [...hits].sort(
    (a, b) => scoreSearchHit(b, full) - scoreSearchHit(a, full),
  );
}

async function searchWikipedia(srsearch: string): Promise<SearchHit[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    format: "json",
    srsearch,
    srlimit: "10",
  });
  const url = `${WIKI_API}?${params.toString()}`;
  let res: Response;
  try {
    res = await wikiFetch(url, { headers: wikiJsonHeaders });
  } catch (e) {
    console.warn(
      `[wikipedia] search fetch failed q=${JSON.stringify(srsearch)}:`,
      e instanceof Error ? e.message : e,
    );
    return [];
  }
  if (!res.ok) {
    console.warn(
      `[wikipedia] search HTTP ${res.status} q=${JSON.stringify(srsearch)}`,
    );
    return [];
  }
  let data: SearchResponse;
  try {
    data = (await res.json()) as SearchResponse;
  } catch (e) {
    console.warn(
      `[wikipedia] search JSON parse failed q=${JSON.stringify(srsearch)}:`,
      e instanceof Error ? e.message : e,
    );
    return [];
  }
  return data.query?.search ?? [];
}

export interface FetchBasketballWikiOptions {
  /** When set (e.g. stored wikiPageTitle), try this REST title first for refresh / overrides. */
  preferredPageTitle?: string | null;
}

function buildFullName(firstName: string, lastName: string): string {
  return [firstName, lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

async function firstSummaryFromSearchHits(
  hits: SearchHit[],
  full: string,
): Promise<WikiPageSummary | null> {
  const ranked = pickRankedSearchHits(hits, full);
  for (const hit of ranked.slice(0, 10)) {
    const summary = await getPageSummary(hit.title);
    if (summary) return summary;
  }
  return null;
}

/**
 * Resolve Wikipedia biography: optional stored title, "(basketball)", plain name, then search.
 */
export async function fetchBasketballPlayerWikiSummary(
  firstName: string,
  lastName: string,
  options?: FetchBasketballWikiOptions,
): Promise<WikiPageSummary | null> {
  const full = buildFullName(firstName, lastName);
  if (!full) return null;

  const preferred = options?.preferredPageTitle?.trim();
  if (preferred) {
    const fromPreferred = await getPageSummary(preferred);
    if (fromPreferred) return fromPreferred;
  }

  const basketballTitle = await getPageSummary(`${full} (basketball)`);
  if (basketballTitle) return basketballTitle;

  const plainTitle = await getPageSummary(full);
  if (plainTitle) return plainTitle;

  const queries = [
    `"${full}" basketball`,
    `${full} NBA basketball`,
    `${full} basketball`,
    `${full} (basketball)`,
  ];

  for (const q of queries) {
    const hits = await searchWikipedia(q);
    const summary = await firstSummaryFromSearchHits(hits, full);
    if (summary) return summary;
  }

  return null;
}
