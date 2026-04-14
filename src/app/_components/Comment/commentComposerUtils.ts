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

/**
 * Collapse mobile composer when focus leaves the container and draft is empty.
 *
 * iOS Safari does not set `relatedTarget` when a `<button>` is tapped,
 * so we defer the collapse check to let the tap's click handler fire first.
 * If the active element ends up inside the composer container we skip the
 * collapse — the user tapped toolbar buttons (image / GIF), not outside.
 */
export function applyMobileComposerBlur(
  _e: FocusEvent,
  opts: {
    isDesktop: boolean;
    containerRef: RefObject<HTMLElement | null>;
    hasContent: boolean;
    onCollapse: () => void;
  },
): void {
  if (opts.isDesktop) return;

  requestAnimationFrame(() => {
    const active = document.activeElement;
    if (active instanceof Node && opts.containerRef.current?.contains(active)) {
      return;
    }
    if (!opts.hasContent) opts.onCollapse();
  });
}
