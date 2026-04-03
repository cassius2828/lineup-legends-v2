"use client";

import { ChevronUp, ChevronDown, MessageCircle } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { api } from "~/trpc/react";
import type { Comment } from "~/server/models";

interface CommentCardProps {
  comment: Comment & { threadCount?: number };
  lineupId: string;
  currentUserId: string | undefined;
  userVote: "upvote" | "downvote" | null;
  onReplyClick?: () => void;
}

export default function CommentCard({
  comment,
  lineupId,
  currentUserId,
  userVote,
  onReplyClick,
}: CommentCardProps) {
  const utils = api.useUtils();
  const commentId = (comment as unknown as { _id: string })._id?.toString() ?? comment.id;
  const commentOwnerId =
    typeof comment.user === "object" && comment.user !== null
      ? ((comment.user as unknown as { _id?: string })._id ?? "")
      : String(comment.user);
  const isOwnComment = !!currentUserId && currentUserId === commentOwnerId;

  const [optimisticVote, setOptimisticVote] = useState(userVote);
  const [optimisticTotal, setOptimisticTotal] = useState(comment.totalVotes ?? 0);

  const voteMutation = api.comment.voteComment.useMutation({
    onSuccess: (data) => {
      setOptimisticTotal(data.totalVotes);
      void utils.comment.getMyCommentVotes.invalidate({ lineupId });
    },
    onError: () => {
      setOptimisticVote(userVote);
      setOptimisticTotal(comment.totalVotes ?? 0);
    },
  });

  const handleVote = (type: "upvote" | "downvote") => {
    if (isOwnComment || !currentUserId) return;

    const newVote = optimisticVote === type ? null : type;
    const delta =
      optimisticVote === null
        ? type === "upvote" ? 1 : -1
        : optimisticVote === type
          ? type === "upvote" ? -1 : 1
          : type === "upvote" ? 2 : -2;

    setOptimisticVote(newVote);
    setOptimisticTotal((prev) => prev + delta);
    voteMutation.mutate({ lineupId, commentId, type });
  };

  const displayName = comment.user.name ?? comment.user.username ?? "Anonymous";
  const avatar = comment.user.image ?? comment.user.profileImg;
  const relativeTime = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  const voteColor =
    optimisticTotal > 0
      ? "text-gold"
      : optimisticTotal < 0
        ? "text-red-500"
        : "text-foreground/40";

  return (
    <div className="flex gap-3 border-b border-foreground/10 py-4 last:border-b-0">
      {/* Avatar */}
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

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + time */}
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="text-foreground/30">&middot;</span>
          <span className="shrink-0 text-xs text-foreground/40">
            {relativeTime}
          </span>
        </div>

        {/* Body */}
        {comment.text && (
          <p className="mt-1 text-sm leading-relaxed text-foreground/80">
            {comment.text}
          </p>
        )}

        {/* Attachment */}
        {comment.image && (
          <Image
            src={comment.image}
            alt="Comment attachment"
            width={400}
            height={300}
            className="mt-2 max-h-[300px] w-auto rounded-lg object-cover"
            unoptimized
          />
        )}
        {comment.gif && (
          <img
            src={comment.gif}
            alt="GIF"
            className="mt-2 max-h-[300px] w-auto rounded-lg object-cover"
          />
        )}

        {/* Actions */}
        <div className="mt-2 flex items-center gap-6">
          {/* Reply */}
          <button
            type="button"
            onClick={onReplyClick}
            className="flex cursor-pointer items-center gap-1.5 text-foreground/30 transition-colors hover:text-gold"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {(comment.threadCount ?? 0) > 0 && (
              <span className="text-xs">{comment.threadCount}</span>
            )}
          </button>

          {/* Votes */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isOwnComment || !currentUserId}
              onClick={() => handleVote("upvote")}
              className={`transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                optimisticVote === "upvote"
                  ? "text-gold"
                  : "text-foreground/30 hover:text-gold"
              }`}
              aria-label="Upvote"
            >
              <ChevronUp className="h-4 w-4" />
            </button>

            <span className={`min-w-[1.25rem] text-center text-xs font-medium ${voteColor}`}>
              {optimisticTotal}
            </span>

            <button
              type="button"
              disabled={isOwnComment || !currentUserId}
              onClick={() => handleVote("downvote")}
              className={`transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                optimisticVote === "downvote"
                  ? "text-red-500"
                  : "text-foreground/30 hover:text-red-500"
              }`}
              aria-label="Downvote"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
