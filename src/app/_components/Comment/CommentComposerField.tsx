"use client";

import type { RefObject } from "react";
import ComposerToolbar from "./ComposerToolbar";
import type { ComposerMedia } from "./ComposerToolbar";
import { COMMENT_BODY_MAX_LENGTH } from "./commentComposerUtils";
import { cn } from "~/lib/utils";

type CommentComposerFieldProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  media: ComposerMedia;
  onMediaChange: (media: ComposerMedia) => void;
  rows: number;
  /** When false, only the textarea is rendered (mobile collapsed). */
  showToolbar?: boolean;
  maxLength?: number;
  placeholder?: string;
  textareaClassName?: string;
  onFocus?: () => void;
};

export function CommentComposerField({
  textareaRef,
  value,
  onChange,
  onKeyDown,
  media,
  onMediaChange,
  rows,
  showToolbar = true,
  maxLength = COMMENT_BODY_MAX_LENGTH,
  placeholder = "Post your reply",
  textareaClassName,
  onFocus,
}: CommentComposerFieldProps) {
  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={cn(
          "text-foreground placeholder:text-foreground/30 w-full resize-none bg-transparent text-sm focus:outline-none",
          textareaClassName,
        )}
      />
      {showToolbar ? (
        <ComposerToolbar media={media} onMediaChange={onMediaChange} />
      ) : null}
    </>
  );
}

type ComposerMetaRowProps = {
  textLength: number;
  maxLength?: number;
  onSubmit: () => void;
  disabled: boolean;
  isSubmitting: boolean;
};

export function ComposerMetaRow({
  textLength,
  maxLength = COMMENT_BODY_MAX_LENGTH,
  onSubmit,
  disabled,
  isSubmitting,
}: ComposerMetaRowProps) {
  return (
    <div className="mt-2 flex items-center justify-between">
      <span className="text-foreground/30 text-xs">
        {textLength}/{maxLength}
      </span>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="bg-gold hover:bg-gold-light rounded-full px-5 py-1.5 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? "Posting..." : "Reply"}
      </button>
    </div>
  );
}
