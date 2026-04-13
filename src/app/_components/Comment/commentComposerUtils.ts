import type { FocusEvent, KeyboardEvent, RefObject } from "react";
import type { ComposerMedia } from "./ComposerToolbar";

/** Matches API / textarea `maxLength` for comment body text. */
export const COMMENT_BODY_MAX_LENGTH = 1000;

export function composerHasContent(
  text: string,
  media: ComposerMedia,
): boolean {
  return text.trim().length > 0 || !!media.image || !!media.gif;
}

/** Submit on ⌘/Ctrl+Enter when allowed (shared by modal and lineup page). */
export function handleComposerMetaEnter(
  e: KeyboardEvent<HTMLTextAreaElement>,
  opts: { hasContent: boolean; isSubmitting: boolean; onSubmit: () => void },
): void {
  if (e.key !== "Enter" || (!e.metaKey && !e.ctrlKey)) return;
  e.preventDefault();
  if (!opts.hasContent || opts.isSubmitting) return;
  opts.onSubmit();
}

/** Collapse mobile composer when focus leaves the container and draft is empty. */
export function applyMobileComposerBlur(
  e: FocusEvent,
  opts: {
    isDesktop: boolean;
    containerRef: RefObject<HTMLElement | null>;
    hasContent: boolean;
    onCollapse: () => void;
  },
): void {
  if (opts.isDesktop) return;
  const next = e.relatedTarget;
  if (next instanceof Node && opts.containerRef.current?.contains(next)) return;
  if (!opts.hasContent) opts.onCollapse();
}
