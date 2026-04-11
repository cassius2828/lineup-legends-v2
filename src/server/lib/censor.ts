import { Filter } from "bad-words";
import type { Types } from "mongoose";
import { ContentFlagModel, type ContentFlagType } from "../models/content-flag";

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

/**
 * If `result.flagged`, creates a ContentFlag for admin review.
 * Accepts a pre-computed CensorResult so the caller can create the parent
 * document first and pass the contentId.
 */
export async function flagContent(opts: {
  raw: string;
  result: CensorResult;
  contentType: ContentFlagType;
  contentId: Types.ObjectId | null;
  userId: Types.ObjectId | string | null;
}): Promise<void> {
  if (!opts.result.flagged) return;

  await ContentFlagModel.create({
    contentType: opts.contentType,
    contentId: opts.contentId,
    userId: opts.userId,
    originalText: opts.raw,
    censoredText: opts.result.cleaned,
    flaggedWords: opts.result.flaggedWords,
  });
}
