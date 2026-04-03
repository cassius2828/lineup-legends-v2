"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { api } from "~/trpc/react";
import { useSubmitComment } from "~/hooks/useSubmitComment";
import { LineupCard } from "../LineupCard/LineupCard";
import ThreadCard from "./ThreadCard";
import type { LineupType } from "~/lib/types";
import type { Thread } from "~/server/models/threads";

export interface ParentComment {
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
  currentUserId?: string;
} & (
  | { mode: "comment"; lineup: LineupContext; parentComment?: never }
  | { mode: "reply"; parentComment: ParentComment; lineup?: never }
);

export default function CommentModal({
  open,
  onClose,
  lineupId,
  currentUserId,
  mode,
  ...rest
}: CommentModalProps) {
  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });
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
      if (mode === "comment") onClose();
    },
  });

  const { data: lineup } = api.lineup.getLineupById.useQuery(
    { id: lineupId },
    { enabled: !!lineupId && mode === "comment" },
  );

  const {
    data: threadData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.comment.getThreads.useInfiniteQuery(
    { commentId: parentComment?._id ?? "", limit: 10 },
    {
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.cursor : undefined,
      enabled: mode === "reply" && !!parentComment?._id && open,
    },
  );

  const { data: myThreadVotes } = api.comment.getMyThreadVotes.useQuery(
    { commentId: parentComment?._id ?? "" },
    {
      enabled:
        mode === "reply" && !!parentComment?._id && !!currentUserId && open,
    },
  );

  const allThreads = threadData?.pages.flatMap((p) => p.threads) ?? [];

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

  const userImage = session?.image ?? session?.profileImg;
  const parentDisplayName =
    parentComment?.user.name ?? parentComment?.user.username ?? "Anonymous";

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
              <LineupCard lineup={lineup as unknown as LineupType} hideFooter />
            ) : mode === "reply" && parentComment ? (
              <ParentCommentPreview comment={parentComment} />
            ) : null}
          </div>

          {/* Replying to @name */}
          {mode === "reply" && parentComment && (
            <div className="px-5 pt-3">
              <span className="text-xs text-foreground/40">
                Replying to{" "}
                <span className="text-gold">@{parentDisplayName}</span>
              </span>
            </div>
          )}

          {/* Composer */}
          <div className="px-5 py-4">
            <div className="flex gap-3">
              {userImage ? (
                <Image
                  src={userImage}
                  alt={session?.name ?? "You"}
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
            <div className="mt-2 flex items-center justify-between">
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
          </div>

          {/* Thread replies */}
          {mode === "reply" && allThreads.length > 0 && (
            <div className="border-t border-foreground/10 px-5">
              {allThreads.map((thread) => {
                const tid =
                  (thread as unknown as { _id: string })._id?.toString() ?? "";
                return (
                  <ThreadCard
                    key={tid}
                    thread={thread as unknown as Thread}
                    lineupId={lineupId}
                    commentId={parentComment!._id}
                    currentUserId={currentUserId}
                    userVote={myThreadVotes?.[tid] ?? null}
                  />
                );
              })}
              {hasNextPage && (
                <div className="flex justify-center py-4">
                  <button
                    className="text-sm text-foreground/40 transition-colors hover:text-foreground/70"
                    type="button"
                    disabled={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                  >
                    {isFetchingNextPage ? "Loading..." : "Show more replies"}
                  </button>
                </div>
              )}
            </div>
          )}
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
  const relativeTime = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

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
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="text-foreground/30">&middot;</span>
          <span className="text-xs text-foreground/40">{relativeTime}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-foreground/60">
          {comment.text}
        </p>
      </div>
    </div>
  );
}
