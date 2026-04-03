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
import ComposerToolbar from "./ComposerToolbar";
import type { ComposerMedia } from "./ComposerToolbar";
import type { LineupType } from "~/lib/types";
import type { Thread } from "~/server/models/threads";

export interface ParentComment {
  _id: string;
  text: string;
  image?: string | null;
  gif?: string | null;
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
  const [media, setMedia] = useState<ComposerMedia>({});
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
      setMedia({});
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
      setMedia({});
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

  const hasContent = text.trim().length > 0 || !!media.image || !!media.gif;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit(text, media);
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

          {/* Comment mode: lineup card + composer */}
          {mode === "comment" && (
            <>
              <div className="border-b border-foreground/10 px-5 py-4">
                {lineup && (
                  <LineupCard
                    lineup={lineup as unknown as LineupType}
                    hideFooter
                  />
                )}
              </div>

              {session ? (
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
                      <ComposerToolbar media={media} onMediaChange={setMedia} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-foreground/30">
                      {text.length}/1000
                    </span>
                    <button
                      type="button"
                      onClick={() => submit(text, media)}
                      disabled={!hasContent || isSubmitting}
                      className="rounded-full bg-gold px-5 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSubmitting ? "Posting..." : "Reply"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-foreground/50">
                    <a href="/api/auth/signin" className="font-medium text-gold hover:text-gold-light">Sign in</a>
                    {" "}to comment
                  </p>
                </div>
              )}
            </>
          )}

          {/* Reply mode: threaded layout with composer at bottom */}
          {mode === "reply" && parentComment && (
            <div className="flex max-h-[70vh] flex-col">
              {/* Scrollable thread area */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {/* Parent comment with connector line */}
                <div className="flex gap-3">
                  <div className="flex w-9 shrink-0 flex-col items-center">
                    {(parentComment.user.image ??
                      parentComment.user.profileImg) ? (
                      <Image
                        src={
                          (parentComment.user.image ??
                            parentComment.user.profileImg)!
                        }
                        alt={parentDisplayName}
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-full"
                      />
                    ) : (
                      <div className="h-9 w-9 shrink-0 rounded-full bg-foreground/10" />
                    )}
                    {allThreads.length > 0 && (
                      <div className="mt-2 w-0.5 flex-1 bg-foreground/20" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">
                        {parentDisplayName}
                      </span>
                      <span className="text-foreground/30">&middot;</span>
                      <span className="text-xs text-foreground/40">
                        {formatDistanceToNow(
                          new Date(parentComment.createdAt),
                          { addSuffix: true },
                        )}
                      </span>
                    </div>
                    {parentComment.text && (
                      <p className="mt-1 text-sm leading-relaxed text-foreground/60">
                        {parentComment.text}
                      </p>
                    )}
                    {parentComment.image && (
                      <Image
                        src={parentComment.image}
                        alt="Attachment"
                        width={200}
                        height={150}
                        className="mt-2 max-h-[150px] w-auto rounded-lg object-cover"
                        unoptimized
                      />
                    )}
                    {parentComment.gif && (
                      <img
                        src={parentComment.gif}
                        alt="GIF"
                        className="mt-2 max-h-[150px] w-auto rounded-lg object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* Thread replies */}
                {allThreads.map((thread, index) => {
                  const tid =
                    (thread as unknown as { _id: string })._id?.toString() ??
                    "";
                  return (
                    <ThreadCard
                      key={tid}
                      thread={thread as unknown as Thread}
                      lineupId={lineupId}
                      commentId={parentComment._id}
                      currentUserId={currentUserId}
                      userVote={myThreadVotes?.[tid] ?? null}
                      replyingTo={parentDisplayName}
                      isLast={index === allThreads.length - 1}
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

              {/* Sticky composer at bottom */}
              {session ? (
                <div className="border-t border-foreground/10 px-5 py-3">
                  <div className="flex gap-3">
                    <div className="w-9 shrink-0">
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
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="mb-1 block text-xs text-foreground/40">
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
                        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                      />
                      <ComposerToolbar media={media} onMediaChange={setMedia} />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-foreground/30">
                          {text.length}/1000
                        </span>
                        <button
                          type="button"
                          onClick={() => submit(text, media)}
                          disabled={!hasContent || isSubmitting}
                          className="rounded-full bg-gold px-5 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isSubmitting ? "Posting..." : "Reply"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-foreground/10 px-5 py-4 text-center">
                  <p className="text-sm text-foreground/50">
                    <a href="/api/auth/signin" className="font-medium text-gold hover:text-gold-light">Sign in</a>
                    {" "}to reply
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

