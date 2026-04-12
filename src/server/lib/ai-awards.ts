/**
 * Fallback: extract NBA player awards from Wikipedia page HTML via OpenAI
 * when our regex-based section parser fails to find an awards heading.
 *
 * No web_search tool — we already have the HTML, just need the LLM to read it.
 */

import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

const SYSTEM_PROMPT = `You are a concise NBA data extractor.
You will receive the HTML of a basketball player's Wikipedia page.
Extract ALL career awards, honors, All-Star selections, championships, and notable achievements from the page.
Return ONLY a plain-text bulleted list (one award per line, prefixed with "• ").
If the page contains no awards or honors, return exactly: "No notable awards found."
Do NOT include any introductory text, commentary, HTML, or citations—just the list.`;

function truncateHtml(html: string): string {
  const MAX = 80_000;
  if (html.length <= MAX) return html;
  return html.slice(0, MAX) + "\n<!-- truncated -->";
}

/**
 * Sends Wikipedia page HTML to GPT-4o-mini and asks it to extract awards.
 * Much cheaper than web search — uses only input/output tokens.
 */
export async function extractAwardsFromHtml(
  html: string,
  playerFullName: string,
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    console.warn(
      "[ai-awards] OPENAI_API_KEY not set — skipping AI awards fallback",
    );
    return null;
  }

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      instructions: SYSTEM_PROMPT,
      input: `Extract all awards and honors for ${playerFullName} from this Wikipedia page HTML:\n\n${truncateHtml(html)}`,
    });

    const text = response.output_text?.trim();

    if (!text || /no notable awards found/i.test(text)) return null;
    if (text.length < 10) return null;

    const cleaned = text.replace(/\n{3,}/g, "\n\n").trim();

    return cleaned || null;
  } catch (err) {
    console.error("[ai-awards] OpenAI extraction failed:", err);
    return null;
  }
}
