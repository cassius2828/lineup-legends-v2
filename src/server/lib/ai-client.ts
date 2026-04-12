/**
 * Shared OpenAI client singleton and HTML-truncation helper
 * used by all AI-powered extraction modules.
 */

import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getAiClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

const MAX_HTML_LENGTH = 80_000;

export function truncateHtml(html: string): string {
  if (html.length <= MAX_HTML_LENGTH) return html;
  return html.slice(0, MAX_HTML_LENGTH) + "\n<!-- truncated -->";
}
