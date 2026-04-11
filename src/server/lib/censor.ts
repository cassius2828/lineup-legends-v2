import { Filter } from "bad-words";

const filter = new Filter();

export interface CensorResult {
  cleaned: string;
  flagged: boolean;
  flaggedWords: string[];
}

export function censorText(text: string): CensorResult {
  if (!text || text.trim().length === 0) {
    return { cleaned: text, flagged: false, flaggedWords: [] };
  }

  const words = text.split(/\s+/);
  const flaggedWords: string[] = [];

  for (const word of words) {
    if (filter.isProfane(word)) {
      const stripped = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (stripped && !flaggedWords.includes(stripped)) {
        flaggedWords.push(stripped);
      }
    }
  }

  const cleaned = filter.clean(text);
  return {
    cleaned,
    flagged: flaggedWords.length > 0,
    flaggedWords,
  };
}
