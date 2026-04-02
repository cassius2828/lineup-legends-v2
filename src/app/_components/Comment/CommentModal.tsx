"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { useSubmitComment } from "~/hooks/useSubmitComment";
import { LineupCard } from "../LineupCard/LineupCard";
import type { LineupType } from "~/lib/types";


interface ParentComment {
  _id: string;
  text: string;
  user: {
    name?: string;
    username?: string;
    image?: string | null;
    profileImg?: string | null;
  };
  createdAt: string | Date;
}

interface LineupContext {
  lineupId: string;
  ownerName: string;
  ownerImage?: string | null;
  totalValue: number;
}

type CommentModalProps = {
  open: boolean;
  onClose: () => void;
  lineupId: string;
} & (
  | { mode: "comment"; lineup: LineupContext; parentComment?: never }
  | { mode: "reply"; parentComment: ParentComment; lineup?: never }
);

export default function CommentModal({
  open,
  onClose,
  lineupId,
  mode,
  ...rest
}: CommentModalProps) {
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parentComment =
    mode === "reply"
      ? (rest as { parentComment: ParentComment }).parentComment
      : undefined;

  const { submit, isSubmitting } = useSubmitComment({
    lineupId,
    mode,
    commentId: parentComment?._id,
    onSuccess: () => {
      setText("");
      onClose();
    },
  });

  const { data: lineup } = api.lineup.getLineupById.useQuery(
    { id: lineupId },
    { enabled: !!lineupId },
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
      setText("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit(text);
    }
  };

  const userImage = session?.user?.image;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex min-h-full items-start justify-center px-4 py-10">
        <motion.div
          className="w-full max-w-3xl rounded-2xl bg-surface-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-foreground/40">
              {mode === "comment" ? "Comment" : "Reply"}
            </span>
            <div className="w-6" />
          </div>

          {/* Parent context */}
          <div className="border-b border-foreground/10 px-5 py-4">
            {mode === "comment" && lineup ? (
              <LineupCard lineup={lineup as unknown as LineupType} />
            ) : mode === "reply" ? (
              <ParentCommentPreview comment={parentComment!} />
            ) : null}
          </div>

          {/* Reply input */}
          <div className="px-5 py-4">
            <div className="flex gap-3">
              {userImage ? (
                <Image
                  src={userImage}
                  alt="You"
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-full"
                />
              ) : (
                <div className="h-9 w-9 shrink-0 rounded-full bg-foreground/10" />
              )}
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Post your reply"
                  maxLength={1000}
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-foreground/10 px-5 py-3">
            <span className="text-xs text-foreground/30">
              {text.length}/1000
            </span>
            <button
              type="button"
              onClick={() => submit(text)}
              disabled={!text.trim() || isSubmitting || !session}
              className="rounded-full bg-gold px-5 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Posting..." : "Reply"}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>,
    document.body,
  );
}

function ParentCommentPreview({ comment }: { comment: ParentComment }) {
  const displayName =
    comment.user.name ?? comment.user.username ?? "Anonymous";
  const avatar = comment.user.image ?? comment.user.profileImg;

  return (
    <div className="flex gap-3">
      {avatar ? (
        <Image
          src={avatar}
          alt={displayName}
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full"
        />
      ) : (
        <div className="h-9 w-9 shrink-0 rounded-full bg-foreground/10" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{displayName}</p>
        <p className="mt-0.5 text-sm text-foreground/60">{comment.text}</p>
      </div>
    </div>
  );
}
