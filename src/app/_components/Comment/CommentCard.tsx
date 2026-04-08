"use client";

import { ChevronUp, ChevronDown, MessageCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { formatRelativeTime, getDisplayName } from "~/lib/format";
import { useVote } from "~/hooks/useVote";
import ConfirmModal from "~/app/_components/ui/ConfirmModal";
import type { CommentOutput } from "~/server/api/schemas/output";

interface CommentCardProps {
  comment: CommentOutput;
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
  const commentId = comment._id;
  const commentOwnerId = comment.user._id;
  const isOwnComment = !!currentUserId && currentUserId === commentOwnerId;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const voteMutation = api.comment.voteComment.useMutation({
    onSuccess: (data) => {
      vote.resetVote(vote.optimisticVote, data.totalVotes);
      void utils.comment.getMyCommentVotes.invalidate({ lineupId });
    },
    onError: () => {
      vote.resetVote(userVote, comment.totalVotes ?? 0);
    },
  });

  const vote = useVote({
    initialVote: userVote,
    initialTotal: comment.totalVotes ?? 0,
    isOwn: isOwnComment,
    currentUserId,
    onVote: (type) => voteMutation.mutate({ lineupId, commentId, type }),
  });

  const deleteMutation = api.comment.deleteComment.useMutation({
    onSuccess: () => {
      setShowDeleteConfirm(false);
      toast.success("Comment deleted");
      void utils.comment.getComments.invalidate({ lineupId });
      void utils.comment.getCommentCount.invalidate({ lineupId });
    },
    onError: (err) => toast.error(err.message),
  });

  const displayName = getDisplayName(comment.user);
  const avatar = comment.user.image ?? comment.user.profileImg;
  const relativeTime = formatRelativeTime(comment.createdAt);

  return (
    <div className="border-foreground/10 flex gap-3 border-b py-4 last:border-b-0">
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
        <div className="bg-foreground/10 h-9 w-9 shrink-0 rounded-full" />
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + time */}
        <div className="flex items-center gap-1.5">
          <span className="text-foreground truncate text-sm font-medium">
            {displayName}
          </span>
          <span className="text-foreground/30">&middot;</span>
          <span className="text-foreground/40 shrink-0 text-xs">
            {relativeTime}
          </span>
        </div>

        {/* Body */}
        {comment.text && (
          <p className="text-foreground/80 mt-1 text-sm leading-relaxed">
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
            className="text-foreground/30 hover:text-gold flex cursor-pointer items-center gap-1.5 transition-colors"
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
              disabled={vote.isDisabled}
              onClick={() => vote.handleVote("upvote")}
              className={`transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                vote.optimisticVote === "upvote"
                  ? "text-gold"
                  : "text-foreground/30 hover:text-gold"
              }`}
              aria-label="Upvote"
            >
              <ChevronUp className="h-4 w-4" />
            </button>

            <span
              className={`min-w-[1.25rem] text-center text-xs font-medium ${vote.voteColor}`}
            >
              {vote.optimisticTotal}
            </span>

            <button
              type="button"
              disabled={vote.isDisabled}
              onClick={() => vote.handleVote("downvote")}
              className={`transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                vote.optimisticVote === "downvote"
                  ? "text-red-500"
                  : "text-foreground/30 hover:text-red-500"
              }`}
              aria-label="Downvote"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {isOwnComment && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-foreground/30 transition-colors hover:text-red-500"
              aria-label="Delete comment"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete comment?"
        description="This will permanently delete this comment and all its replies. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate({ lineupId, commentId })}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
