"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { api } from "~/trpc/react";
import { useSubmitComment } from "~/hooks/useSubmitComment";
import { LineupCard } from "../LineupCard/LineupCard";
import CommentCard from "./CommentCard";
import ThreadCard from "./ThreadCard";
import ComposerToolbar from "./ComposerToolbar";
import type { ComposerMedia } from "./ComposerToolbar";
import type { LineupOutput } from "~/server/api/schemas/output";

export interface ParentComment {
  _id: string;
  text: string;
  image?: string | null;
  gif?: string | null;
  user: {
    _id?: string;
    name?: string | null;
    username?: string | null;
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
  const [media, setMedia] = useState<ComposerMedia>({});
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Internal navigation within comment mode
  const [internalView, setInternalView] = useState<"comments" | "thread">(
    "comments",
  );
  const [selectedComment, setSelectedComment] = useState<ParentComment | null>(
    null,
  );

  const propParentComment =
    mode === "reply"
      ? (rest as { parentComment: ParentComment }).parentComment
      : undefined;

  const effectiveParent =
    mode === "reply" ? propParentComment : selectedComment;
  const showCommentsList = mode === "comment" && internalView === "comments";
  const showThreadView =
    mode === "reply" || (mode === "comment" && internalView === "thread");

  const effectiveUserId = currentUserId ?? session?.id;

  // Submit for top-level comments (stays open after posting)
  const { submit: submitComment, isSubmitting: isCommentSubmitting } =
    useSubmitComment({
      lineupId,
      mode: "comment",
      onSuccess: () => {
        setText("");
        setMedia({});
      },
    });

  // Submit for thread replies
  const { submit: submitThread, isSubmitting: isThreadSubmitting } =
    useSubmitComment({
      lineupId,
      mode: "reply",
      commentId: effectiveParent?._id,
      onSuccess: () => {
        setText("");
        setMedia({});
      },
    });

  // Lineup card (comment mode)
  const { data: lineup, isLoading: isLineupLoading } =
    api.lineup.getLineupById.useQuery(
      { id: lineupId },
      { enabled: !!lineupId && mode === "comment" },
    );

  // Comments feed (comment mode)
  const {
    data: commentsData,
    fetchNextPage: fetchMoreComments,
    hasNextPage: hasMoreComments,
    isFetchingNextPage: isFetchingMoreComments,
  } = api.comment.getComments.useInfiniteQuery(
    { lineupId, limit: 10 },
    {
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.cursor : undefined,
      enabled: mode === "comment" && open,
    },
  );
  const allComments = commentsData?.pages.flatMap((p) => p.comments) ?? [];

  const { data: myCommentVotes } = api.comment.getMyCommentVotes.useQuery(
    { lineupId },
    { enabled: mode === "comment" && !!effectiveUserId && open },
  );

  // Threads (thread view)
  const {
    data: threadData,
    fetchNextPage: fetchMoreThreads,
    hasNextPage: hasMoreThreads,
    isFetchingNextPage: isFetchingMoreThreads,
  } = api.comment.getThreads.useInfiniteQuery(
    { commentId: effectiveParent?._id ?? "", limit: 10 },
    {
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.cursor : undefined,
      enabled: showThreadView && !!effectiveParent?._id && open,
    },
  );

  const { data: myThreadVotes } = api.comment.getMyThreadVotes.useQuery(
    { commentId: effectiveParent?._id ?? "" },
    {
      enabled:
        showThreadView && !!effectiveParent?._id && !!effectiveUserId && open,
    },
  );

  const allThreads = threadData?.pages.flatMap((p) => p.threads) ?? [];

  useEffect(() => setMounted(true), []);

  // Reset internal view when modal closes
  useEffect(() => {
    if (!open) {
      setInternalView("comments");
      setSelectedComment(null);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setText("");
      setMedia({});
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus textarea on open or view change
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open, internalView]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === "comment" && internalView === "thread") {
          handleBackToComments();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, mode, internalView]);

  if (!open || !mounted) return null;

  const hasContent = text.trim().length > 0 || !!media.image || !!media.gif;
  const activeSubmit = showThreadView ? submitThread : submitComment;
  const activeIsSubmitting = showThreadView
    ? isThreadSubmitting
    : isCommentSubmitting;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      activeSubmit(text, media);
    }
  };

  const userImage = session?.image ?? session?.profileImg;
  const parentDisplayName =
    effectiveParent?.user.name ?? effectiveParent?.user.username ?? "Anonymous";

  const handleReplyClick = (comment: {
    _id: string;
    text?: string | null;
    image?: string | null;
    gif?: string | null;
    user: ParentComment["user"];
    createdAt: string | Date;
  }) => {
    setSelectedComment({
      _id: comment._id,
      text: comment.text ?? "",
      image: comment.image,
      gif: comment.gif,
      user: comment.user,
      createdAt: comment.createdAt,
    });
    setInternalView("thread");
    setText("");
    setMedia({});
  };

  const handleBackToComments = () => {
    setInternalView("comments");
    setSelectedComment(null);
    setText("");
    setMedia({});
  };

  const showBackButton = mode === "comment" && internalView === "thread";
  const headerTitle = showCommentsList
    ? "Comment"
    : mode === "reply"
      ? "Reply"
      : "Thread";

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
          className="bg-surface-800 w-full max-w-3xl rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="border-foreground/10 flex items-center justify-between border-b px-4 py-3">
            <button
              type="button"
              onClick={showBackButton ? handleBackToComments : onClose}
              className="text-foreground/50 hover:bg-foreground/10 hover:text-foreground rounded-full p-1 transition-colors"
            >
              {showBackButton ? (
                <ArrowLeft className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>
            <span className="text-foreground/40 text-sm font-medium">
              {headerTitle}
            </span>
            {showBackButton ? (
              <button
                type="button"
                onClick={onClose}
                className="text-foreground/50 hover:bg-foreground/10 hover:text-foreground rounded-full p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            ) : (
              <div className="w-6" />
            )}
          </div>

          {/* ── Comments list view ── */}
          {showCommentsList && (
            <div className="flex max-h-[80vh] flex-col">
              {/* Lineup card */}
              <div className="border-foreground/10 shrink-0 border-b px-5 py-4">
                {lineup ? (
                  <LineupCard lineup={lineup as LineupOutput} hideFooter />
                ) : isLineupLoading ? (
                  <div className="from-surface-800/90 to-surface-950/90 animate-pulse rounded-2xl bg-gradient-to-br p-6">
                    {/* Header skeleton: avatar + name + time + value badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-foreground/10 h-10 w-10 rounded-full" />
                        <div className="space-y-1.5">
                          <div className="bg-foreground/10 h-3.5 w-28 rounded" />
                          <div className="bg-foreground/10 h-3 w-20 rounded" />
                        </div>
                      </div>
                      <div className="bg-foreground/10 h-6 w-16 rounded-full" />
                    </div>
                    {/* Stats bar skeleton */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="bg-foreground/10 h-4 w-24 rounded" />
                      <div className="bg-foreground/10 h-4 w-20 rounded" />
                    </div>
                    {/* Players grid skeleton: 5 circles with labels */}
                    <div className="mt-4 flex justify-between px-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <div className="bg-foreground/10 h-3 w-5 rounded" />
                          <div className="bg-foreground/10 h-16 w-16 rounded-full" />
                          <div className="bg-foreground/10 h-3 w-14 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Composer */}
              {session ? (
                <div className="border-foreground/10 shrink-0 border-b px-5 py-4">
                  <div className="flex gap-3">
                    <Image
                      src={userImage ?? "/default-user.jpg"}
                      alt={session?.name ?? "You"}
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full"
                    />
                    <div className="flex-1">
                      <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Post your reply"
                        maxLength={1000}
                        rows={3}
                        className="text-foreground placeholder:text-foreground/30 w-full resize-none bg-transparent text-sm focus:outline-none"
                      />
                      <ComposerToolbar media={media} onMediaChange={setMedia} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-foreground/30 text-xs">
                      {text.length}/1000
                    </span>
                    <button
                      type="button"
                      onClick={() => submitComment(text, media)}
                      disabled={!hasContent || isCommentSubmitting}
                      className="bg-gold hover:bg-gold-light rounded-full px-5 py-1.5 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isCommentSubmitting ? "Posting..." : "Reply"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-foreground/10 shrink-0 border-b px-5 py-6 text-center">
                  <p className="text-foreground/50 text-sm">
                    <a
                      href="/api/auth/signin"
                      className="text-gold hover:text-gold-light font-medium"
                    >
                      Sign in
                    </a>{" "}
                    to comment
                  </p>
                </div>
              )}

              {/* Comment feed */}
              <div className="flex-1 overflow-y-auto px-5">
                {allComments.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-foreground/30 text-sm">
                      No comments yet. Be the first!
                    </p>
                  </div>
                ) : (
                  <>
                    {allComments.map((comment) => (
                      <CommentCard
                        key={comment._id}
                        comment={comment}
                        lineupId={lineupId}
                        currentUserId={effectiveUserId}
                        userVote={myCommentVotes?.[comment._id] ?? null}
                        onReplyClick={() => handleReplyClick(comment)}
                      />
                    ))}
                    {hasMoreComments && (
                      <div className="flex justify-center py-4">
                        <button
                          className="text-foreground/40 hover:text-foreground/70 text-sm transition-colors"
                          type="button"
                          disabled={isFetchingMoreComments}
                          onClick={() => fetchMoreComments()}
                        >
                          {isFetchingMoreComments
                            ? "Loading..."
                            : "Show more comments"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Thread view (reply mode or drilled-in from comment list) ── */}
          {showThreadView && effectiveParent && (
            <div className="flex max-h-[70vh] flex-col">
              {/* Scrollable thread area */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {/* Parent comment with connector line */}
                <div className="flex gap-3">
                  <div className="flex w-9 shrink-0 flex-col items-center">
                    <Image
                      src={
                        effectiveParent.user.image ??
                        effectiveParent.user.profileImg ??
                        "/default-user.jpg"
                      }
                      alt={parentDisplayName}
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full"
                    />
                    {allThreads.length > 0 && (
                      <div className="bg-foreground/20 mt-2 w-0.5 flex-1" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground text-sm font-medium">
                        {parentDisplayName}
                      </span>
                      <span className="text-foreground/30">&middot;</span>
                      <span className="text-foreground/40 text-xs">
                        {formatDistanceToNow(
                          new Date(effectiveParent.createdAt),
                          { addSuffix: true },
                        )}
                      </span>
                    </div>
                    {effectiveParent.text && (
                      <p className="text-foreground/60 mt-1 text-sm leading-relaxed">
                        {effectiveParent.text}
                      </p>
                    )}
                    {effectiveParent.image && (
                      <Image
                        src={effectiveParent.image}
                        alt="Attachment"
                        width={200}
                        height={150}
                        className="mt-2 max-h-[150px] w-auto rounded-lg object-cover"
                        unoptimized
                      />
                    )}
                    {effectiveParent.gif && (
                      <img
                        src={effectiveParent.gif}
                        alt="GIF"
                        className="mt-2 max-h-[150px] w-auto rounded-lg object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* Thread replies */}
                {allThreads.map((thread, index) => (
                  <ThreadCard
                    key={thread._id}
                    thread={thread}
                    lineupId={lineupId}
                    commentId={effectiveParent._id}
                    currentUserId={effectiveUserId}
                    userVote={myThreadVotes?.[thread._id] ?? null}
                    replyingTo={parentDisplayName}
                    isLast={index === allThreads.length - 1}
                  />
                ))}
                {hasMoreThreads && (
                  <div className="flex justify-center py-4">
                    <button
                      className="text-foreground/40 hover:text-foreground/70 text-sm transition-colors"
                      type="button"
                      disabled={isFetchingMoreThreads}
                      onClick={() => fetchMoreThreads()}
                    >
                      {isFetchingMoreThreads
                        ? "Loading..."
                        : "Show more replies"}
                    </button>
                  </div>
                )}
              </div>

              {/* Sticky composer at bottom */}
              {session ? (
                <div className="border-foreground/10 border-t px-5 py-3">
                  <div className="flex gap-3">
                    <div className="w-9 shrink-0">
                      <Image
                        src={userImage ?? "/default-user.jpg"}
                        alt={session?.name ?? "You"}
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-foreground/40 mb-1 block text-xs">
                        Replying to{" "}
                        <span className="text-gold">@{parentDisplayName}</span>
                      </span>
                      <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Post your reply"
                        maxLength={1000}
                        rows={2}
                        className="text-foreground placeholder:text-foreground/30 w-full resize-none bg-transparent text-sm focus:outline-none"
                      />
                      <ComposerToolbar media={media} onMediaChange={setMedia} />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-foreground/30 text-xs">
                          {text.length}/1000
                        </span>
                        <button
                          type="button"
                          onClick={() => submitThread(text, media)}
                          disabled={!hasContent || isThreadSubmitting}
                          className="bg-gold hover:bg-gold-light rounded-full px-5 py-1.5 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isThreadSubmitting ? "Posting..." : "Reply"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-foreground/10 border-t px-5 py-4 text-center">
                  <p className="text-foreground/50 text-sm">
                    <a
                      href="/api/auth/signin"
                      className="text-gold hover:text-gold-light font-medium"
                    >
                      Sign in
                    </a>{" "}
                    to reply
                  </p>
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
