"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { useSubmitComment } from "~/hooks/useSubmitComment";
import { LineupCardSkeleton } from "../common/skeletons";
import { Spinner } from "../common/loaders";
import { LineupCard } from "../LineupCard/LineupCard";
import CommentCard from "./CommentCard";
import ThreadCard from "./ThreadCard";
import type { ComposerMedia } from "./ComposerToolbar";
import { CommentComposerField, ComposerMetaRow } from "./CommentComposerField";
import {
  applyMobileComposerBlur,
  composerHasContent,
  handleComposerMetaEnter,
} from "./commentComposerUtils";
import { ComposerUserAvatar } from "./ComposerUserAvatar";
import { useIsDesktop } from "~/hooks/useIsDesktop";
import { cn } from "~/lib/utils";

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

function SignInCta({ action, border }: { action: string; border: string }) {
  return (
    <div
      className={`border-foreground/10 px-5 py-4 text-center ${border === "border-b" ? "shrink-0 border-b py-6" : "border-t"}`}
    >
      <p className="text-foreground/50 text-sm">
        <Link
          href="/sign-in"
          className="text-gold hover:text-gold-light font-medium"
        >
          Sign in
        </Link>{" "}
        to {action}
      </p>
    </div>
  );
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
  const { data: nextAuthSession, status: authStatus } = useSession();
  const { data: profile } = api.profile.getMe.useQuery(undefined, {
    enabled: open && authStatus === "authenticated",
    retry: false,
  });

  /** Full profile from API when ready; otherwise NextAuth session (JWT cookie) so we never flash "sign in" while getMe is loading. */
  const me =
    profile ??
    (authStatus === "authenticated" && nextAuthSession?.user
      ? {
          id: nextAuthSession.user.id,
          name: nextAuthSession.user.name ?? null,
          image: nextAuthSession.user.image ?? null,
          profileImg: nextAuthSession.user.profileImg ?? null,
        }
      : null);

  const sessionLoading = authStatus === "loading";
  const isUnauthenticated = authStatus === "unauthenticated";
  const [text, setText] = useState("");
  const [media, setMedia] = useState<ComposerMedia>({});
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listComposerRef = useRef<HTMLDivElement>(null);
  const threadComposerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const [mobileListComposerExpanded, setMobileListComposerExpanded] =
    useState(false);
  const [mobileThreadComposerExpanded, setMobileThreadComposerExpanded] =
    useState(false);

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

  const effectiveUserId = currentUserId ?? me?.id;

  const resetComposer = useCallback(() => {
    setText("");
    setMedia({});
  }, []);

  // Submit for top-level comments (stays open after posting)
  const { submit: submitComment, isSubmitting: isCommentSubmitting } =
    useSubmitComment({
      lineupId,
      mode: "comment",
      onSuccess: resetComposer,
    });

  // Submit for thread replies
  const { submit: submitThread, isSubmitting: isThreadSubmitting } =
    useSubmitComment({
      lineupId,
      mode: "reply",
      commentId: effectiveParent?._id,
      onSuccess: resetComposer,
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
    isLoading: isCommentsLoading,
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
    isLoading: isThreadsLoading,
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
      setMobileListComposerExpanded(false);
      setMobileThreadComposerExpanded(false);
    }
  }, [open]);

  useEffect(() => {
    setMobileListComposerExpanded(false);
    setMobileThreadComposerExpanded(false);
  }, [internalView, mode]);

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

  // Focus textarea on open or view change (desktop only — mobile stays collapsed)
  useEffect(() => {
    if (open && isDesktop) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open, internalView, isDesktop]);

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

  const hasContent = composerHasContent(text, media);
  const activeSubmit = showThreadView ? submitThread : submitComment;
  const isComposerSubmitting = showThreadView
    ? isThreadSubmitting
    : isCommentSubmitting;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleComposerMetaEnter(e, {
      hasContent,
      isSubmitting: isComposerSubmitting,
      onSubmit: () => activeSubmit(text, media),
    });
  };

  const sharedComposerFieldProps = {
    textareaRef,
    value: text,
    onChange: setText,
    onKeyDown: handleKeyDown,
    media,
    onMediaChange: setMedia,
  };

  const userImage = me?.image ?? me?.profileImg;
  const sessionAvatarSrc = userImage ?? "/default-user.jpg";
  const sessionAvatarAlt = me?.name ?? "You";
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
    resetComposer();
  };

  const handleBackToComments = () => {
    setInternalView("comments");
    setSelectedComment(null);
    resetComposer();
  };

  const showBackButton = mode === "comment" && internalView === "thread";
  const headerTitle = showCommentsList
    ? "Comment"
    : mode === "reply"
      ? "Reply"
      : "Thread";

  const showListComposerChrome =
    isDesktop || mobileListComposerExpanded || hasContent;
  const showThreadComposerChrome =
    isDesktop || mobileThreadComposerExpanded || hasContent;

  const handleListComposerBlur = (e: React.FocusEvent) =>
    applyMobileComposerBlur(e, {
      isDesktop,
      containerRef: listComposerRef,
      hasContent,
      onCollapse: () => setMobileListComposerExpanded(false),
    });

  const handleThreadComposerBlur = (e: React.FocusEvent) =>
    applyMobileComposerBlur(e, {
      isDesktop,
      containerRef: threadComposerRef,
      hasContent,
      onCollapse: () => setMobileThreadComposerExpanded(false),
    });

  const lineupCardSection = (
    <div className="border-foreground/10 shrink-0 border-b px-5 py-4">
      {lineup ? (
        <LineupCard lineup={lineup} hideFooter />
      ) : isLineupLoading ? (
        <LineupCardSkeleton />
      ) : null}
    </div>
  );

  const commentsListSection = (
    <>
      {isCommentsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : allComments.length === 0 ? (
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
                {isFetchingMoreComments ? "Loading..." : "Show more comments"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );

  const threadScrollSection = effectiveParent ? (
    <>
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
              {formatDistanceToNow(new Date(effectiveParent.createdAt), {
                addSuffix: true,
              })}
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

      {isThreadsLoading ? (
        <div className="flex items-center justify-center py-6">
          <Spinner />
        </div>
      ) : (
        allThreads.map((thread, index) => (
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
        ))
      )}
      {hasMoreThreads && (
        <div className="flex justify-center py-4">
          <button
            className="text-foreground/40 hover:text-foreground/70 text-sm transition-colors"
            type="button"
            disabled={isFetchingMoreThreads}
            onClick={() => fetchMoreThreads()}
          >
            {isFetchingMoreThreads ? "Loading..." : "Show more replies"}
          </button>
        </div>
      )}
    </>
  ) : null;

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
          {showCommentsList && isDesktop && (
            <div className="flex max-h-[80vh] flex-col">
              {lineupCardSection}
              {sessionLoading ? (
                <div className="border-foreground/10 flex shrink-0 justify-center border-b py-10">
                  <Spinner size="lg" />
                </div>
              ) : isUnauthenticated ? (
                <SignInCta action="comment" border="border-b" />
              ) : me ? (
                <div className="border-foreground/10 shrink-0 border-b px-5 py-4">
                  <div className="flex gap-3">
                    <ComposerUserAvatar
                      src={sessionAvatarSrc}
                      alt={sessionAvatarAlt}
                    />
                    <div className="flex-1">
                      <CommentComposerField
                        {...sharedComposerFieldProps}
                        rows={3}
                      />
                    </div>
                  </div>
                  <ComposerMetaRow
                    textLength={text.length}
                    onSubmit={() => submitComment(text, media)}
                    disabled={!hasContent || isCommentSubmitting}
                    isSubmitting={isCommentSubmitting}
                  />
                </div>
              ) : (
                <div className="border-foreground/10 flex shrink-0 justify-center border-b py-10">
                  <Spinner size="lg" />
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-5">
                {commentsListSection}
              </div>
            </div>
          )}

          {showCommentsList && !isDesktop && (
            <div className="flex max-h-[min(80vh,100dvh-8rem)] min-h-0 flex-col">
              <div className="border-foreground/10 flex min-h-0 flex-1 flex-col overflow-y-auto pb-2">
                {lineupCardSection}
                <div className="flex-1 px-5">{commentsListSection}</div>
              </div>
              {sessionLoading ? (
                <div className="border-foreground/10 flex shrink-0 justify-center border-t py-8">
                  <Spinner size="lg" />
                </div>
              ) : isUnauthenticated ? (
                <div className="shrink-0">
                  <SignInCta action="comment" border="border-t" />
                </div>
              ) : me ? (
                <div
                  ref={listComposerRef}
                  onBlur={handleListComposerBlur}
                  className="border-foreground/10 bg-surface-800 shrink-0 border-t px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                >
                  <div
                    className={cn(
                      "flex gap-3",
                      showListComposerChrome ? "" : "items-center",
                    )}
                  >
                    <ComposerUserAvatar
                      src={sessionAvatarSrc}
                      alt={sessionAvatarAlt}
                    />
                    <div className="min-w-0 flex-1">
                      <CommentComposerField
                        {...sharedComposerFieldProps}
                        rows={showListComposerChrome ? 3 : 1}
                        showToolbar={showListComposerChrome}
                        onFocus={() => setMobileListComposerExpanded(true)}
                        textareaClassName={
                          !showListComposerChrome
                            ? "min-h-[2.75rem]"
                            : undefined
                        }
                      />
                      {showListComposerChrome ? (
                        <ComposerMetaRow
                          textLength={text.length}
                          onSubmit={() => submitComment(text, media)}
                          disabled={!hasContent || isCommentSubmitting}
                          isSubmitting={isCommentSubmitting}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-foreground/10 flex shrink-0 justify-center border-t py-8">
                  <Spinner size="lg" />
                </div>
              )}
            </div>
          )}

          {/* ── Thread view (reply mode or drilled-in from comment list) ── */}
          {showThreadView && effectiveParent && isDesktop && (
            <div className="flex max-h-[70vh] flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {threadScrollSection}
              </div>
              {sessionLoading ? (
                <div className="border-foreground/10 flex justify-center border-t py-8">
                  <Spinner size="lg" />
                </div>
              ) : isUnauthenticated ? (
                <SignInCta action="reply" border="border-t" />
              ) : me ? (
                <div className="border-foreground/10 border-t px-5 py-3">
                  <div className="flex gap-3">
                    <div className="w-9 shrink-0">
                      <ComposerUserAvatar
                        src={sessionAvatarSrc}
                        alt={sessionAvatarAlt}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-foreground/40 mb-1 block text-xs">
                        Replying to{" "}
                        <span className="text-gold">@{parentDisplayName}</span>
                      </span>
                      <CommentComposerField
                        {...sharedComposerFieldProps}
                        rows={2}
                      />
                      <ComposerMetaRow
                        textLength={text.length}
                        onSubmit={() => submitThread(text, media)}
                        disabled={!hasContent || isThreadSubmitting}
                        isSubmitting={isThreadSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-foreground/10 flex justify-center border-t py-8">
                  <Spinner size="lg" />
                </div>
              )}
            </div>
          )}

          {showThreadView && effectiveParent && !isDesktop && (
            <div className="flex max-h-[min(70vh,100dvh-8rem)] min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-6">
                {threadScrollSection}
              </div>
              {sessionLoading ? (
                <div className="border-foreground/10 flex shrink-0 justify-center border-t py-8">
                  <Spinner size="lg" />
                </div>
              ) : isUnauthenticated ? (
                <SignInCta action="reply" border="border-t" />
              ) : me ? (
                <div
                  ref={threadComposerRef}
                  onBlur={handleThreadComposerBlur}
                  className="border-foreground/10 bg-surface-800 shrink-0 border-t px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                >
                  <div
                    className={cn(
                      "flex gap-3",
                      showThreadComposerChrome ? "" : "items-center",
                    )}
                  >
                    <div className="w-9 shrink-0">
                      <ComposerUserAvatar
                        src={sessionAvatarSrc}
                        alt={sessionAvatarAlt}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      {showThreadComposerChrome && (
                        <span className="text-foreground/40 mb-1 block text-xs">
                          Replying to{" "}
                          <span className="text-gold">
                            @{parentDisplayName}
                          </span>
                        </span>
                      )}
                      <CommentComposerField
                        {...sharedComposerFieldProps}
                        rows={showThreadComposerChrome ? 2 : 1}
                        showToolbar={showThreadComposerChrome}
                        onFocus={() => setMobileThreadComposerExpanded(true)}
                        textareaClassName={
                          !showThreadComposerChrome
                            ? "min-h-[2.75rem]"
                            : undefined
                        }
                      />
                      {showThreadComposerChrome ? (
                        <ComposerMetaRow
                          textLength={text.length}
                          onSubmit={() => submitThread(text, media)}
                          disabled={!hasContent || isThreadSubmitting}
                          isSubmitting={isThreadSubmitting}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-foreground/10 flex shrink-0 justify-center border-t py-8">
                  <Spinner size="lg" />
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
