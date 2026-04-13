"use client";

import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { formatRelativeTime, getDisplayName } from "~/lib/format";
import { useVote } from "~/hooks/useVote";
import ConfirmModal from "~/app/_components/common/ui/ConfirmModal";
import type { ThreadOutput } from "~/server/api/schemas/output";

interface ThreadCardProps {
  thread: ThreadOutput;
  lineupId: string;
  commentId: string;
  currentUserId: string | undefined;
  userVote: "upvote" | "downvote" | null;
  replyingTo?: string;
  isLast?: boolean;
}

export default function ThreadCard({
  thread,
  lineupId,
  commentId,
  currentUserId,
  userVote,
  replyingTo,
  isLast = true,
}: ThreadCardProps) {
  const utils = api.useUtils();
  const threadId = thread._id;
  const threadOwnerId = thread.user._id;
  const isOwnThread = !!currentUserId && currentUserId === threadOwnerId;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const voteMutation = api.comment.voteThread.useMutation({
    onSuccess: (data) => {
      vote.resetVote(vote.optimisticVote, data.totalVotes);
      void utils.comment.getMyThreadVotes.invalidate({ commentId });
    },
    onError: () => {
      vote.resetVote(userVote, thread.totalVotes ?? 0);
    },
  });

  const vote = useVote({
    initialVote: userVote,
    initialTotal: thread.totalVotes ?? 0,
    isOwn: isOwnThread,
    currentUserId,
    onVote: (type) =>
      voteMutation.mutate({ lineupId, commentId, threadId, type }),
  });

  const deleteMutation = api.comment.deleteThread.useMutation({
    onSuccess: () => {
      setShowDeleteConfirm(false);
      toast.success("Reply deleted");
      void utils.comment.getThreads.invalidate({ commentId });
      void utils.comment.getComments.invalidate();
      void utils.comment.getCommentCount.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const displayName = getDisplayName(thread.user);
  const avatar = thread.user.image ?? thread.user.profileImg;
  const relativeTime = formatRelativeTime(thread.createdAt);

  return (
    <div className="flex gap-3">
      <div className="flex w-9 shrink-0 flex-col items-center">
        <Image
          src={avatar ?? "/default-user.jpg"}
          alt={displayName}
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full"
        />
        {replyingTo && !isLast && (
          <div className="bg-foreground/20 mt-2 w-0.5 flex-1" />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-3">
        {replyingTo && (
          <span className="text-foreground/40 mb-0.5 block text-xs">
            Replying to <span className="text-gold">@{replyingTo}</span>
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-foreground truncate text-sm font-medium">
            {displayName}
          </span>
          <span className="text-foreground/30">&middot;</span>
          <span className="text-foreground/40 shrink-0 text-xs">
            {relativeTime}
          </span>
        </div>

        {thread.text && (
          <p className="text-foreground/80 mt-1 text-sm leading-relaxed">
            {thread.text}
          </p>
        )}

        {thread.image && (
          <Image
            src={thread.image}
            alt="Reply attachment"
            width={400}
            height={300}
            className="mt-2 max-h-[300px] w-auto rounded-lg object-cover"
            unoptimized
          />
        )}
        {thread.gif && (
          <img
            src={thread.gif}
            alt="GIF"
            className="mt-2 max-h-[300px] w-auto rounded-lg object-cover"
          />
        )}

        <div className="mt-2 flex items-center gap-6">
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

          {isOwnThread && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-foreground/30 transition-colors hover:text-red-500"
              aria-label="Delete reply"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <ConfirmModal
          open={showDeleteConfirm}
          title="Delete reply?"
          description="This will permanently delete this reply. This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate({ commentId, threadId })}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}
