"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import CommentCard from "~/app/_components/Comment/CommentCard";
import {
  CommentComposerField,
  ComposerMetaRow,
} from "~/app/_components/Comment/CommentComposerField";
import { ComposerUserAvatar } from "~/app/_components/Comment/ComposerUserAvatar";
import { cn } from "~/lib/utils";
import { GoldCircleSpinnerLoader } from "~/app/_components/common/loaders";
import { useLineupDetailPage } from "../_hooks/useLineupDetailPage";

export function LineupDetailContent() {
  const {
    router,
    lineup,
    isLoading,
    lineupId,
    session,
    allComments,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    myVotes,
    openReply,
    isDesktop,
    text,
    hasContent,
    showComposerChrome,
    isSubmitting,
    submitComposer,
    sharedComposerFieldProps,
    composerRef,
    handleComposerBlur,
    setMobileComposerExpanded,
  } = useLineupDetailPage();

  if (isLoading) return <GoldCircleSpinnerLoader />;
  if (!lineup)
    return (
      <div className="text-foreground/50 p-12 text-center">
        Lineup not found
      </div>
    );

  const sessionAvatarSrc =
    session?.image ?? session?.profileImg ?? "/default-user.jpg";
  const sessionAvatarAlt = session?.name ?? "You";

  const lineupHero = (
    <>
      <button
        type="button"
        onClick={() => router.back()}
        className="text-foreground/40 hover:text-foreground/70 mb-6 inline-flex w-fit items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <LineupCard
        lineup={lineup}
        showOwner={true}
        isOwner={false}
        currentUserId={session?.id ?? ""}
      />
    </>
  );

  const commentsSection =
    allComments.length > 0 ? (
      <div className="mt-2 px-1">
        {allComments.map((comment) => (
          <CommentCard
            key={comment._id}
            comment={comment}
            lineupId={lineupId}
            currentUserId={session?.id}
            userVote={myVotes?.[comment._id] ?? null}
            onReplyClick={() =>
              openReply(
                lineupId,
                {
                  _id: comment._id,
                  text: comment.text ?? "",
                  image: comment.image,
                  gif: comment.gif,
                  user: comment.user,
                  createdAt: comment.createdAt,
                },
                session?.id,
              )
            }
          />
        ))}
        {hasNextPage && (
          <div className="flex justify-center py-4">
            <button
              className="text-foreground/40 hover:text-foreground/70 text-sm transition-colors"
              type="button"
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {isFetchingNextPage ? "Loading..." : "Show more replies"}
            </button>
          </div>
        )}
      </div>
    ) : null;

  const signInCta = (
    <div className="border-foreground/10 mt-4 rounded-xl border p-6 text-center">
      <p className="text-foreground/50 text-sm">
        <Link
          href="/api/auth/signin"
          className="text-gold hover:text-gold-light font-medium"
        >
          Sign in
        </Link>{" "}
        to join the conversation
      </p>
    </div>
  );

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col px-4",
        isDesktop && "my-12 pt-12",
        !isDesktop &&
          "min-h-[calc(100dvh-6rem)] pt-8 pb-[max(0.5rem,env(safe-area-inset-bottom))]",
      )}
    >
      {isDesktop ? (
        <>
          {lineupHero}
          {session ? (
            <div className="border-foreground/10 mt-4 rounded-xl border p-4">
              <div className="flex gap-3">
                <ComposerUserAvatar
                  src={sessionAvatarSrc}
                  alt={sessionAvatarAlt}
                />
                <div className="flex-1">
                  <CommentComposerField
                    {...sharedComposerFieldProps}
                    rows={2}
                  />
                </div>
              </div>
              <ComposerMetaRow
                textLength={text.length}
                onSubmit={submitComposer}
                disabled={!hasContent || isSubmitting}
                isSubmitting={isSubmitting}
              />
            </div>
          ) : (
            signInCta
          )}
          {commentsSection}
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={cn("min-h-0 flex-1 overflow-y-auto", session && "pb-24")}
          >
            {lineupHero}
            {!session && signInCta}
            {commentsSection}
          </div>
          {session ? (
            <div
              ref={composerRef}
              onBlur={handleComposerBlur}
              className="border-foreground/10 bg-background sticky bottom-0 z-10 mt-2 shrink-0 rounded-t-xl border px-3 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)]"
            >
              <div
                className={cn(
                  "flex gap-3",
                  showComposerChrome ? "" : "items-center",
                )}
              >
                <ComposerUserAvatar
                  src={sessionAvatarSrc}
                  alt={sessionAvatarAlt}
                />
                <div className="min-w-0 flex-1">
                  <CommentComposerField
                    {...sharedComposerFieldProps}
                    rows={showComposerChrome ? 2 : 1}
                    showToolbar={showComposerChrome}
                    onFocus={() => setMobileComposerExpanded(true)}
                    textareaClassName={
                      !showComposerChrome ? "min-h-[2.75rem]" : undefined
                    }
                  />
                  {showComposerChrome ? (
                    <ComposerMetaRow
                      textLength={text.length}
                      onSubmit={submitComposer}
                      disabled={!hasContent || isSubmitting}
                      isSubmitting={isSubmitting}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
