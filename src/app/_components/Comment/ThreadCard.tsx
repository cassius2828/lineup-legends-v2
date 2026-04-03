"use client";

import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import ConfirmModal from "~/app/_components/ui/ConfirmModal";
import type { Thread } from "~/server/models/threads";

interface ThreadCardProps {
  thread: Thread;
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
  const threadId =
    (thread as unknown as { _id: string })._id?.toString() ?? thread.id;
  const threadOwnerId =
    typeof thread.user === "object" && thread.user !== null
      ? ((thread.user as unknown as { _id?: string })._id ?? "")
      : String(thread.user);
  const isOwnThread = !!currentUserId && currentUserId === threadOwnerId;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [optimisticVote, setOptimisticVote] = useState(userVote);
  const [optimisticTotal, setOptimisticTotal] = useState(
    thread.totalVotes ?? 0,
  );

  const voteMutation = api.comment.voteThread.useMutation({
    onSuccess: (data) => {
      setOptimisticTotal(data.totalVotes);
      void utils.comment.getMyThreadVotes.invalidate({ commentId });
    },
    onError: () => {
      setOptimisticVote(userVote);
      setOptimisticTotal(thread.totalVotes ?? 0);
    },
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

  const handleVote = (type: "upvote" | "downvote") => {
    if (isOwnThread || !currentUserId) return;

    const newVote = optimisticVote === type ? null : type;
    const delta =
      optimisticVote === null
        ? type === "upvote"
          ? 1
          : -1
        : optimisticVote === type
          ? type === "upvote"
            ? -1
            : 1
          : type === "upvote"
            ? 2
            : -2;

    setOptimisticVote(newVote);
    setOptimisticTotal((prev) => prev + delta);
    voteMutation.mutate({ lineupId, commentId, threadId, type });
  };

  const displayName =
    thread.user.name ?? thread.user.username ?? "Anonymous";
  const avatar = thread.user.image ?? thread.user.profileImg;
  const relativeTime = formatDistanceToNow(new Date(thread.createdAt), {
    addSuffix: true,
  });

  const voteColor =
    optimisticTotal > 0
      ? "text-gold"
      : optimisticTotal < 0
        ? "text-red-500"
        : "text-foreground/40";

  return (
    <div className="flex gap-3">
      <div className="flex w-9 shrink-0 flex-col items-center">
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
        {replyingTo && !isLast && (
          <div className="mt-2 w-0.5 flex-1 bg-foreground/20" />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-3">
        {replyingTo && (
          <span className="mb-0.5 block text-xs text-foreground/40">
            Replying to{" "}
            <span className="text-gold">@{replyingTo}</span>
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="text-foreground/30">&middot;</span>
          <span className="shrink-0 text-xs text-foreground/40">
            {relativeTime}
          </span>
        </div>

        {thread.text && (
          <p className="mt-1 text-sm leading-relaxed text-foreground/80">
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
              disabled={isOwnThread || !currentUserId}
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

            <span
              className={`min-w-[1.25rem] text-center text-xs font-medium ${voteColor}`}
            >
              {optimisticTotal}
            </span>

            <button
              type="button"
              disabled={isOwnThread || !currentUserId}
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
