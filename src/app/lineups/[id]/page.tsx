"use client";

import { ArrowLeft } from "lucide-react";
import { LineupCard } from "~/app/_components/LineupCard/LineupCard";
import { api } from "~/trpc/react";
import { useParams, useRouter } from "next/navigation";
import Loading from "./loading";
import CommentCard from "~/app/_components/Comment/CommentCard";
import type { ParentComment } from "~/app/_components/Comment/CommentModal";
import ComposerToolbar from "~/app/_components/Comment/ComposerToolbar";
import type { ComposerMedia } from "~/app/_components/Comment/ComposerToolbar";
import Image from "next/image";
import { useSubmitComment } from "~/hooks/useSubmitComment";
import { useCommentModalStore } from "~/stores/commentModal";
import { useState } from "react";

const LineupCardPage = () => {
  const router = useRouter();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<ComposerMedia>({});
  const openReply = useCommentModalStore((s) => s.openReply);
  const { data: session } = api.profile.getMe.useQuery(undefined, {
    retry: false,
  });
  const params = useParams();
  const rawId = params?.id;
  const lineupId =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
        ? (rawId[0] ?? "")
        : "";
  const { data: lineup, isLoading } = api.lineup.getLineupById.useQuery({
    id: lineupId,
  });
  const {
    data: commentData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.comment.getComments.useInfiniteQuery(
    { lineupId, limit: 10 },
    { getNextPageParam: (lastPage) => lastPage.cursor },
  );

  const { data: myVotes } = api.comment.getMyCommentVotes.useQuery(
    { lineupId },
    { enabled: !!lineupId && !!session },
  );

  const allComments = commentData?.pages.flatMap((p) => p.comments) ?? [];
  const { submit, isSubmitting } = useSubmitComment({
    lineupId,
    mode: "comment",
    commentId: undefined,
  });
  if (isLoading) return <Loading />;
  if (!lineup)
    return (
      <div className="text-foreground/50 p-12 text-center">
        Lineup not found
      </div>
    );
  return (
    <div className="mx-auto my-12 flex w-full max-w-3xl flex-col px-4 pt-12">
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
      {/* Composer */}
      {session ? (
        <div className="border-foreground/10 mt-4 rounded-xl border p-4">
          <div className="flex gap-3">
            <Image
              src={session.image ?? session.profileImg ?? "/default-user.jpg"}
              alt={session.name ?? "You"}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full"
            />
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                maxLength={1000}
                className="text-foreground placeholder:text-foreground/30 w-full resize-none bg-transparent text-sm focus:outline-none"
                placeholder="Post your reply"
              />
              <ComposerToolbar media={media} onMediaChange={setMedia} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                submit(text, media);
                setText("");
                setMedia({});
              }}
              disabled={
                (!text.trim() && !media.image && !media.gif) || isSubmitting
              }
              className="bg-gold hover:bg-gold-light rounded-full px-5 py-1.5 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-foreground/10 mt-4 rounded-xl border p-6 text-center">
          <p className="text-foreground/50 text-sm">
            <a
              href="/api/auth/signin"
              className="text-gold hover:text-gold-light font-medium"
            >
              Sign in
            </a>{" "}
            to join the conversation
          </p>
        </div>
      )}
      {/* Comments list */}
      {allComments.length > 0 && (
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
      )}
    </div>
  );
};

export default LineupCardPage;
